import {
  Duration,
  IgnoreMode,
  Aws,
  CfnMapping,
  Fn,
} from 'aws-cdk-lib';
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
  ServicePrincipal,
  AccountPrincipal,
} from 'aws-cdk-lib/aws-iam';
import { DockerImageFunction, DockerImageCode, Function, Runtime, Code, Architecture } from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';
import { Constants } from '../common/constants';
import * as path from 'path';


export interface AlbProps {
  readonly port?: number;
  readonly vpc: IVpc;
  readonly bucket: IBucket;
  readonly apiFunction: Function;
  readonly internetFacing?: boolean;
  readonly oidcProvider: string;
  readonly oidcClientId: string;
}

export class AlbStack extends Construct {
  public readonly url: string;
  private readonly portalConfigPriority = 10;
  private readonly apiPriority = 20;
  private readonly defaultPort = 80; 

  constructor(scope: Construct, id: string, props: AlbProps) {
    super(scope, id);

    const port = props.port ?? this.defaultPort;

    const albSecurityGroup = this.createSecurityGroup(port, props);

    const alb = new ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      loadBalancerName: `${SolutionInfo.SOLUTION_NAME_ABBR}-ALB`,
      vpc: props.vpc,
      internetFacing: props.internetFacing ?? false,
      securityGroup: albSecurityGroup,
      http2Enabled: true,
    });

    this.url = 'http://' + alb.loadBalancerDnsName + ':' + port;

    this.setLog(alb, props);

    const listener = alb.addListener('Listener', {
        protocol: ApplicationProtocol.HTTP,
        port: port,
      });

    this.createProtalConfig(listener, props);
    this.createApi(listener, props);
    this.createPortal(listener, props);
  };

  private setLog(alb: ApplicationLoadBalancer, props: AlbProps){
    const albLogPrefix = 'alb-log';
    
    const albLogServiceAccountMapping = new CfnMapping(this, 'ALBServiceAccountMapping', Constants.ALBLogServiceAccountMapping);
    props.bucket.grantPut(new AccountPrincipal(albLogServiceAccountMapping.findInMap(Aws.REGION, 'account')),
      `${albLogPrefix}/*`);
    props.bucket.grantPut(new ServicePrincipal('logdelivery.elasticloadbalancing.amazonaws.com'),
      `${albLogPrefix}/*`);
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', props.bucket.bucketName);
    alb.setAttribute('access_logs.s3.prefix', albLogPrefix);
  }

  private createSecurityGroup(port:number, props: AlbProps){
    const albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      securityGroupName: "ALB",
      vpc: props.vpc,
    });
    if (props.internetFacing) {
      albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(port), 'rule of allow inbound traffic from servier port');
      return albSecurityGroup;
    } else {
      albSecurityGroup.addIngressRule(Peer.ipv4(props.vpc.vpcCidrBlock),
        Port.tcp(port),
        'application load balancer allow traffic from this security group under internal deploy mode',
      );
      // Need to get immutable version because otherwise the ApplicationLoadBalance
      // would create 0.0.0.0/0 rule for inbound traffic
      const albImmutableSecurityGroup = SecurityGroup.fromSecurityGroupId(
        this,
        'AlbImmutableSecurityGroup',
        albSecurityGroup.securityGroupId,
        { mutable: false },
      );
      return albImmutableSecurityGroup;
    }
  }

  private createApi(listener: ApplicationListener, props: AlbProps){
    const apiTarget = [new LambdaTarget(props.apiFunction)];
    listener.addTargets("ApiTarget", {
      targetGroupName: `${SolutionInfo.SOLUTION_NAME_ABBR}-API-Target`,
      priority: this.apiPriority,
      targets: apiTarget,
      conditions: [ListenerCondition.httpHeader("authorization",["*"])],
    });
  }

  private createProtalConfig(listener: ApplicationListener, props: AlbProps){
    const portalConfigFunction = new Function(this, 'PortalConfigFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-PortalConfig`,
      description: `${SolutionInfo.SOLUTION_NAME} - set the configration to Lambda environment and portal will read it through ALB.`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'portal_config.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, '../../api/lambda')),
      memorySize: 1024,
      timeout: Duration.seconds(10),
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      environment: {
        "aws_oidc_provider": props.oidcProvider,
        "aws_oidc_client_id": props.oidcClientId,
        "aws_oidc_customer_domain": `${this.url}/logincallback`,
        "backend_url": `${this.url}`,
        "expired": "12",
      }
    });
    const portalConfigTarget = [new LambdaTarget(portalConfigFunction)];
    listener.addTargets('PortalConfigTarget', {
      targetGroupName: `${SolutionInfo.SOLUTION_NAME_ABBR}-PortalConfig-Target`,
      priority: this.portalConfigPriority,
      targets: portalConfigTarget,
      conditions: [ListenerCondition.pathPatterns(["/config/getConfig"])],
    });
  }

  private createPortal(listener: ApplicationListener, props: AlbProps){
    const portalFunction = new DockerImageFunction(this, 'PortalFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-Portal`,
      description: `${SolutionInfo.SOLUTION_NAME} portal Lambda function`,
      code: DockerImageCode.fromImageAsset(path.join(__dirname, '../../../portal'), {
        file: 'Dockerfile',
        ignoreMode: IgnoreMode.DOCKER,
        platform: Platform.LINUX_AMD64,
      }),
      architecture: Architecture.X86_64,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
    });
    const portalTarget = [new LambdaTarget(portalFunction)];
    listener.addTargets('PortalTarget', {
      targetGroupName: `${SolutionInfo.SOLUTION_NAME_ABBR}-Portal-Target`,
      targets: portalTarget,
    });
  }
}
