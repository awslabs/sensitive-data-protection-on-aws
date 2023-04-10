import {
  Duration,
  IgnoreMode,
  Arn,
  Aws,
  ArnFormat,
  CfnMapping,
  Fn,
} from 'aws-cdk-lib';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  IVpc,
  ISecurityGroup,
  SecurityGroup,
  Peer,
  Port,
  SubnetSelection,
  Connections,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import {
  ApplicationLoadBalancer,
  IpAddressType,
  ApplicationProtocol,
  ApplicationListener,
  ListenerCondition,
  ListenerAction,
  IApplicationLoadBalancerTarget,
  HealthCheck,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import {
  PolicyStatement,
  ServicePrincipal,
  Role,
  Effect,
  Policy,
  AccountPrincipal,
} from 'aws-cdk-lib/aws-iam';
import { DockerImageFunction, DockerImageCode, Function, Runtime, Code, Architecture } from 'aws-cdk-lib/aws-lambda';
import { IHostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Constants } from '../common/constants';
import { BucketStack } from './bucket-stack';
import { SolutionInfo } from '../common/solution-info';
import * as path from 'path';

export interface RouteProps {
  readonly routePath: string;
  readonly priority: number;
  readonly target: IApplicationLoadBalancerTarget[];
  readonly healthCheck: HealthCheck;
  readonly methods?: string[];
}

export interface FixedResponseProps {
  readonly routePath: string;
  readonly priority: number;
  readonly content: string;
  readonly contentType: string;
}

export interface FrontendProps {
  readonly directory: string;
  readonly dockerFile: string;
}

export interface NetworkProps {
  readonly vpc: IVpc;
  readonly subnets?: SubnetSelection;
  readonly appPort?: number;
  readonly apiPort: number;
  readonly oidcProvider: string;
  readonly oidcClientId: string;
}

export interface DomainProps {
  readonly domainPrefix: string;
  readonly zoneName: string;
  readonly hostzone: IHostedZone;
  readonly certificate?: ICertificate;
}

export interface LogProps {
  readonly enableAccessLog: boolean;
  readonly bucket?: IBucket;
  readonly prefix?: string;
}

export interface ApplicationLoadBalancerProps {
  readonly internetFacing: boolean;
  readonly protocol: ApplicationProtocol;
  readonly idleTimeout?: Duration;
  readonly http2Enabled?: boolean;
  readonly ipAddressType?: IpAddressType;
  readonly healthCheckInterval?: Duration;
  readonly logProps: LogProps;
}

export interface ApplicationLoadBalancerLambdaPortalProps {
  readonly applicationLoadBalancerProps: ApplicationLoadBalancerProps;
  readonly networkProps: NetworkProps;
  readonly frontendProps: FrontendProps;
  readonly domainProps?: DomainProps;
}

export class ApplicationLoadBalancerLambdaPortal extends Construct {

  public readonly applicationLoadBalancer: ApplicationLoadBalancer;
  public readonly appPort: number;
  public readonly listener: ApplicationListener;
  public readonly rootPathPriority = 50;
  public readonly configPathPriority = 40;
  public readonly securityGroup: ISecurityGroup;
  public readonly sourceSecurityGroupId?: string;
  public readonly controlPlaneUrl: string;
  public readonly customDomainName: string; //controlPlaneUrl without port

  constructor(scope: Construct, id: string, props: ApplicationLoadBalancerLambdaPortalProps) {
    super(scope, id);

    this.node.addValidation({
      validate: () => {
        const messages: string[] = [];
        if (props.domainProps?.certificate !== undefined && props.applicationLoadBalancerProps.protocol === ApplicationProtocol.HTTP) {
          messages.push('Please use the HTTPS protocol when the certificate parameter is provided, the cerfificate parameter is meaningless when you use the HTTP protocol');
        }
        if (props.applicationLoadBalancerProps.protocol === ApplicationProtocol.HTTPS && props.domainProps?.certificate === undefined) {
          messages.push('Please provide certificate when using HTTPS protocol');
        }

        return messages;
      },
    });

    const portalFn = new DockerImageFunction(this, 'portal_fn', {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-Portal`,
      description: 'SDPS portal Lambda function',
      code: DockerImageCode.fromImageAsset(props.frontendProps.directory, {
        file: 'Dockerfile',
        ignoreMode: IgnoreMode.DOCKER,
        platform: Platform.LINUX_AMD64,
      }),
      allowPublicSubnet: props.applicationLoadBalancerProps.internetFacing,
      architecture: Architecture.X86_64,
      vpc: props.networkProps.vpc,
      vpcSubnets: props.networkProps.subnets,
    });

    this.securityGroup = new SecurityGroup(this, 'portal_sg', {
      vpc: props.networkProps.vpc,
    });

    let appPort = props.networkProps.appPort;
    if (appPort === undefined) {
      if (props.domainProps?.certificate === undefined) {
        appPort = 80;
      } else {
        appPort = 443;
      }
    }
    this.appPort = appPort;

    if (props.applicationLoadBalancerProps.internetFacing) {
      this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(appPort), 'rule of allow inbound traffic from servier port ');
      this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(props.networkProps.apiPort), 'rule of allow inbound traffic from servier port ');
      if (props.applicationLoadBalancerProps.ipAddressType === IpAddressType.DUAL_STACK) {
        this.securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(appPort), 'rule of allow IPv6 inbound traffic from servier port ');
        this.securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(props.networkProps.apiPort), 'rule of allow IPv6 inbound traffic from servier port ');
      }
    } else {
      const sourceSg = new SecurityGroup(this, 'portal_source_sg', {
        vpc: props.networkProps.vpc,
      });
      this.sourceSecurityGroupId = sourceSg.securityGroupId;

      this.securityGroup.connections.allowFrom(
        new Connections({ peer: Peer.ipv4(props.networkProps.vpc.vpcCidrBlock) }),
        Port.tcp(appPort),
        'application load balancer allow traffic from this security group under internal deploy mode',
      );

      this.securityGroup.connections.allowFrom(
        new Connections({ peer: Peer.ipv4(props.networkProps.vpc.vpcCidrBlock) }),
        Port.tcp(props.networkProps.apiPort),
        'application load balancer allow traffic from this security group under internal deploy mode',
      );
    }

    // Need to get immutable version because otherwise the ApplicationLoadBalance
    // would create 0.0.0.0/0 rule for inbound traffic
    const albSgImmutable = SecurityGroup.fromSecurityGroupId(
      this,
      'LoadBalancerSecurityGroupImmutable',
      this.securityGroup.securityGroupId,
      { mutable: false },
    );

    this.applicationLoadBalancer = new ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.networkProps.vpc,
      vpcSubnets: props.networkProps.subnets ?? { subnetType: SubnetType.PUBLIC },
      internetFacing: props.applicationLoadBalancerProps.internetFacing,
      securityGroup: albSgImmutable,
      ipAddressType: props.applicationLoadBalancerProps.ipAddressType ?? IpAddressType.IPV4,
      idleTimeout: props.applicationLoadBalancerProps.idleTimeout ?? Duration.seconds(300),
      http2Enabled: props.applicationLoadBalancerProps.http2Enabled ?? true,
    });

    if (props.domainProps !== undefined) {
      this.customDomainName = Fn.join('.', [props.domainProps.domainPrefix, props.domainProps.zoneName]);
      this.controlPlaneUrl = 'https://' + this.customDomainName + ':' + this.appPort;
    } else {
      this.customDomainName = 'http://' + this.applicationLoadBalancer.loadBalancerDnsName;
      this.controlPlaneUrl = 'http://' + this.applicationLoadBalancer.loadBalancerDnsName + ':' + this.appPort;
    }

    if (props.applicationLoadBalancerProps.logProps.enableAccessLog) {
      let albLogBucket: IBucket;
      if (props.applicationLoadBalancerProps.logProps.bucket === undefined) {
        albLogBucket = new BucketStack(this, 'logbucket').bucket;
      } else {
        albLogBucket = props.applicationLoadBalancerProps.logProps.bucket;
      }

      const albLogServiceAccountMapping = new CfnMapping(this, 'ALBServiceAccountMapping', Constants.ALBLogServiceAccountMapping);

      const albLogPrefix = props.applicationLoadBalancerProps.logProps?.prefix ?? 'alb-log';
      albLogBucket.grantPut(new AccountPrincipal(albLogServiceAccountMapping.findInMap(Aws.REGION, 'account')),
        `${albLogPrefix}/AWSLogs/${Aws.ACCOUNT_ID}/*`);

      albLogBucket.grantPut(new ServicePrincipal('logdelivery.elasticloadbalancing.amazonaws.com'),
        `${albLogPrefix}/AWSLogs/${Aws.ACCOUNT_ID}/*`);

      this.applicationLoadBalancer.setAttribute('access_logs.s3.enabled', 'true');
      this.applicationLoadBalancer.setAttribute('access_logs.s3.bucket', albLogBucket.bucketName);
      this.applicationLoadBalancer.setAttribute('access_logs.s3.prefix', albLogPrefix);
    }

    if (props.applicationLoadBalancerProps.protocol === ApplicationProtocol.HTTPS && props.domainProps?.certificate !== undefined) {
      this.listener = this.applicationLoadBalancer.addListener('Listener', {
        protocol: ApplicationProtocol.HTTPS,
        port: this.appPort,
        certificates: [props.domainProps.certificate],
      });
    } else {
      this.listener = this.applicationLoadBalancer.addListener('Listener', {
        protocol: ApplicationProtocol.HTTP,
        port: this.appPort,
      });
    }

    this.listener.addAction('DefaultAction', {
      action: ListenerAction.fixedResponse(404, {
        messageBody: 'Cannot route your request; no matching project found.',
      }),
    });

    //if the protocol is HTTPS, creating a default 80 listener to redirect to HTTPS port
    if (props.applicationLoadBalancerProps.protocol === ApplicationProtocol.HTTPS) {
      const httpListener = this.applicationLoadBalancer.addListener('HttpListener', {
        protocol: ApplicationProtocol.HTTP,
        port: 80,
      });

      httpListener.addAction('RedirectAction', {
        action: ListenerAction.redirect({
          protocol: ApplicationProtocol.HTTPS,
          port: this.appPort.toString(),
        }),
      });
    }

    const portalTargets = [new LambdaTarget(portalFn)];

    const portalConfigFn = new Function(this, 'portal-config', {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-PortalConfig`,
      description: `${SolutionInfo.SOLUTION_NAME} - set the configration to Lambda environment and portal will read it through ALB.`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'portal_config.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, '../../api/lambda')),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      vpcSubnets: props.networkProps.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      vpc: props.networkProps.vpc,
      environment: {
        "aws_project_region": "",
        "aws_api_endpoint": "",
        "aws_authenticationType": "",
        "aws_oidc_provider": props.networkProps.oidcProvider,
        "aws_oidc_client_id": props.networkProps.oidcClientId,
        "aws_oidc_customer_domain": `${this.controlPlaneUrl}/logincallback`,
        "aws_alb_url": "",
        "aws_cognito_region": "",
        "aws_user_pools_id": "",
        "aws_user_pools_web_client_id": "",
        "version": "",
        "backend_url": `${this.customDomainName}:${props.networkProps.apiPort}/`,
        "expired": "12"
      }
    });

    const configTargets = [new LambdaTarget(portalConfigFn)];
    const interval = props.applicationLoadBalancerProps.healthCheckInterval ?? Duration.seconds(60);
    // It will make sure that the lambda is alive and we can consider to turn it off to save cost.
    const healthCheck = {
      enabled: true,
      interval: interval,
    };

    this.addRoute('control-plane-targets', {
      routePath: '/*',
      priority: this.rootPathPriority,
      target: portalTargets,
      healthCheck: healthCheck,
      methods: ['POST', 'GET', 'PATCH', 'PUT', 'DELETE'],
    });

    this.addRoute('portal-config-targets', {
      routePath: '/config/getConfig',
      priority: this.configPathPriority,
      target: configTargets,
      healthCheck: healthCheck,
      methods: ['GET', 'POST'],
    });

    if (props.domainProps !== undefined) {
      const aliasRecord = new ARecord(this, 'aliasRecord', {
        recordName: props.domainProps.domainPrefix,
        zone: props.domainProps.hostzone,
        target: RecordTarget.fromAlias(new LoadBalancerTarget(this.applicationLoadBalancer)),
      });
    }

  };

  /**
   * Add a route matching and target group to the ALB
   * @param id id of this target
   * @param props RouteProps
   */
  public addRoute(id: string, props: RouteProps) {
    let listenerCondition = [ListenerCondition.pathPatterns([props.routePath])];
    // if (props.methods !== undefined) {
    //   listenerCondition = listenerCondition.concat([ListenerCondition.httpRequestMethods(props.methods)]);
    // }

    this.listener.addTargets(id, {
      priority: props.priority,
      targets: props.target,
      conditions: listenerCondition,
      healthCheck: props.healthCheck,
    });
  }

  /**
   * Add fixed response to the ALB
   * @param id id of this listener action
   * @param path path match pattern, ex: '/config'
   * @param content the fixed response content
   * @param contentType text/plain | text/css | text/html | application/javascript | application/json
   */
  public addFixedResponse(id: string, props: FixedResponseProps) {
    this.listener.addAction(id, {
      priority: props.priority,
      conditions: [
        ListenerCondition.pathPatterns([props.routePath]),
      ],
      action: ListenerAction.fixedResponse(200, {
        contentType: props.contentType,
        messageBody: props.content,
      }),
    });
  }

}
