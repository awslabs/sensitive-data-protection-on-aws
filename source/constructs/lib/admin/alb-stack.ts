/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import * as path from 'path';
import {
  Duration,
  IgnoreMode,
  Aws,
  CfnMapping,
  Fn,
  CfnOutput,
  CfnCondition,
  CfnParameter,
  IAspect,
  Aspects,
  Token,
  CfnStack,
  NestedStack,
  Tags,
} from 'aws-cdk-lib';
import {
  IVpc,
  SecurityGroup,
  Peer,
  Port,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationListener,
  ListenerCondition,
  CfnLoadBalancer,
  CfnListener,
  ListenerCertificate,
  SslPolicy,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import {
  ServicePrincipal,
  AccountPrincipal,
} from 'aws-cdk-lib/aws-iam';
import { DockerImageFunction, DockerImageCode, Function, Runtime, Code, Architecture } from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct, IConstruct } from 'constructs';
import { BuildConfig } from '../common/build-config';
import { Constants } from '../common/constants';
import { SolutionInfo } from '../common/solution-info';

export interface VpcProps {
  readonly vpcId: string;
  readonly privateSubnet1: string;
  readonly privateSubnet2: string;
  readonly publicSubnet1: string;
  readonly publicSubnet2: string;
}


export interface AlbProps {
  readonly vpc?: IVpc;
  // Value of property Parameters must be an object with String (or simple type) properties in NestedStack.
  readonly vpcInfo?: VpcProps;
  readonly onlyPrivateSubnets?: boolean;
  readonly bucket: IBucket;
  readonly apiFunction: Function;
  readonly port: number;
  readonly internetFacing: string;
  readonly certificateArn: string;
  readonly oidcIssuer: string;
  readonly oidcClientId: string;
  readonly domainName: string;
  readonly useCognito?: boolean;
}

export class AlbStack extends NestedStack {
  public readonly url: string;
  private readonly portalConfigPriority = 10;
  private readonly apiPriority = 20;
  private readonly identifier: string;
  private readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: AlbProps) {
    super(scope, id);

    if (props.certificateArn == '') {
      this.identifier = ApplicationProtocol.HTTP.toString();
    } else {
      this.identifier = ApplicationProtocol.HTTPS.toString();
    }

    if (props.vpc) {
      this.vpc = props.vpc;
    } else {
      let publicSubnetIds = undefined;
      const onlyPrivateSubnets = props.onlyPrivateSubnets ?? false;
      if (!onlyPrivateSubnets) {
        publicSubnetIds = [];
        publicSubnetIds.push(props.vpcInfo!.publicSubnet1);
        publicSubnetIds.push(props.vpcInfo!.publicSubnet2);
      }
      this.vpc = Vpc.fromVpcAttributes(this, 'AlbVpc', {
        vpcId: props.vpcInfo!.vpcId,
        availabilityZones: [0, 1].map(i => Fn.select(i, Fn.getAzs())),
        publicSubnetIds: publicSubnetIds,
        privateSubnetIds: [props.vpcInfo!.privateSubnet1, props.vpcInfo!.privateSubnet2],
      });
    }

    const albSecurityGroup = this.createSecurityGroup(props.port);
    let internetFacing = true;
    if (props.onlyPrivateSubnets) {
      internetFacing = false;
    }
    const alb = new ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      // loadBalancerName: `${SolutionInfo.SOLUTION_NAME}-ALB-${this.identifier}`,
      vpc: this.vpc,
      internetFacing: internetFacing,
      securityGroup: albSecurityGroup,
      http2Enabled: true,
    });
    // In NestedStack,Only directly using `props.internetFacing` will get an error.
    new CfnCondition(this, 'IsInternetFacing', { expression: Fn.conditionEquals(props.internetFacing, 'Yes') });
    const schemeOut = Fn.conditionIf('IsInternetFacing', 'internet-facing', 'internal');
    const cfnAlb = alb.node.defaultChild as CfnLoadBalancer;
    cfnAlb.addPropertyOverride('Scheme', schemeOut.toString());

    this.setLog(alb, props);

    const isHttp = new CfnCondition(this, 'IsHttp', { expression: Fn.conditionEquals(props.certificateArn, '') });
    const isHttps = new CfnCondition(this, 'IsHttps', { expression: Fn.conditionNot(isHttp) });

    let listener;
    if (props.certificateArn == '') {
      listener = alb.addListener('HttpListener', {
        protocol: ApplicationProtocol.HTTP,
        port: props.port,
      });

      this.url = this.setUrl(scope, alb.loadBalancerDnsName, props, Constants.HttpDefaultPort);
      this.setOutput(scope, alb.loadBalancerDnsName, isHttp);
    } else {
      listener = alb.addListener('HttpsListener', {
        protocol: ApplicationProtocol.HTTPS,
        port: props.port,
        certificates: [ListenerCertificate.fromArn(props.certificateArn)],
        sslPolicy: SslPolicy.RECOMMENDED_TLS,
      });

      this.url = this.setUrl(scope, alb.loadBalancerDnsName, props, Constants.HttpsDefaultPort);
      this.setOutput(scope, alb.loadBalancerDnsName, isHttps);
    }

    this.createApi(listener, props);
    this.createProtalConfig(listener, props);
    this.createPortal(listener);
  };

  private setUrl(scope: Construct, dnsName: string, props: AlbProps, defaultPort: number) {
    // Both the main stack and this stack require these conditions
    const isDefaultPort = new CfnCondition(this, `IsDefaultPort${this.identifier}`, { expression: Fn.conditionEquals(props.port, defaultPort) });
    new CfnCondition(scope, `IsDefaultPort${this.identifier}`, { expression: isDefaultPort.expression });
    const isCustomdomainName = new CfnCondition(this, `IsCustomdomainName${this.identifier}`, { expression: Fn.conditionNot(Fn.conditionEquals(props.domainName, '')) });
    new CfnCondition(scope, `IsCustomdomainName${this.identifier}`, { expression: isCustomdomainName.expression });
    const protocolShow = this.identifier.toLowerCase();
    const domainNameShow = Fn.conditionIf(
      `IsCustomdomainName${this.identifier}`,
      props.domainName,
      dnsName,
    ).toString();
    const url = Fn.conditionIf(
      `IsDefaultPort${this.identifier}`,
      `${protocolShow}://${domainNameShow}`,
      `${protocolShow}://${domainNameShow}:${props.port}`,
    ).toString();
    return url;
  }

  private setOutput(scope: Construct, dnsName: string, condition: CfnCondition) {
    new CfnOutput(scope, `PortalUrl${this.identifier}`, {
      description: 'Portal URL/Sign out redirect URI for OIDC',
      value: this.url,
    }).condition = condition;

    new CfnOutput(scope, `LoadBalancerDnsName${this.identifier}`, {
      description: 'If you use a custom domain name, set the CName of the custom domain name to this value.',
      value: dnsName,
    }).condition = condition;

    new CfnOutput(scope, `SigninRedirectUri${this.identifier}`, {
      description: 'Sign in redirect URI for OIDC',
      value: `${this.url}${Constants.LoginCallbackUrlSuffix}`,
    }).condition = condition;
  };

  private setLog(alb: ApplicationLoadBalancer, props: AlbProps) {
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

  private createSecurityGroup(port: number) {
    const albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      // securityGroupName: `ALB-${this.identifier}`,
      vpc: this.vpc,
    });
    albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(port), 'rule of allow inbound traffic from server port');
    albSecurityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(port), 'rule of allow inbound traffic from server port');
    return albSecurityGroup;
  }

  private createApi(listener: ApplicationListener, props: AlbProps) {
    const apiTarget = [new LambdaTarget(props.apiFunction)];
    const apiTargetGroup = listener.addTargets('ApiTarget', {
      // targetGroupName: `${SolutionInfo.SOLUTION_NAME}-API-Target-${this.identifier}`,
      priority: this.apiPriority,
      targets: apiTarget,
      conditions: [ListenerCondition.httpHeader('Authorization', ['*'])],
    });
    Tags.of(apiTargetGroup).add(SolutionInfo.TAG_NAME, 'API');
  }

  private createProtalConfig(listener: ApplicationListener, props: AlbProps) {
    let logoutUrl = '';
    if (props?.useCognito) {
      logoutUrl = `https://${SolutionInfo.SOLUTION_NAME.toLowerCase()}-${Aws.ACCOUNT_ID}.auth.${Aws.REGION}.amazoncognito.com/logout`;
    }
    const portalConfigFunction = new Function(this, 'PortalConfigFunction', {
      // functionName: `${SolutionInfo.SOLUTION_NAME}-PortalConfig-${this.identifier}`,
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - set the configration to Lambda environment and portal will read it through ALB.`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'portal_config.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, '../../api/lambda')),
      memorySize: 1024,
      timeout: Duration.seconds(10),
      vpc: this.vpc,
      vpcSubnets: this.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      environment: {
        aws_oidc_issuer: props.oidcIssuer,
        aws_oidc_client_id: props.oidcClientId,
        aws_oidc_customer_domain: `${this.url}/logincallback`,
        aws_oidc_logout: logoutUrl,
        backend_url: `${this.url}`,
        version: SolutionInfo.SOLUTION_VERSION,
      },
    });
    const portalConfigTarget = [new LambdaTarget(portalConfigFunction)];
    const portalConfigTargetGroup = listener.addTargets('PortalConfigTarget', {
      // targetGroupName: `${SolutionInfo.SOLUTION_NAME}-PortalConfig-Target-${this.identifier}`,
      priority: this.portalConfigPriority,
      targets: portalConfigTarget,
      conditions: [ListenerCondition.pathPatterns(['/config/getConfig'])],
    });
    Tags.of(portalConfigTargetGroup).add(SolutionInfo.TAG_NAME, 'PortalConfig');
  }

  private createPortal(listener: ApplicationListener) {
    let portalFunction;
    if (BuildConfig.PortalRepository && BuildConfig.PortalTag) {
      portalFunction = new DockerImageFunction(this, 'PortalFunction', {
        // functionName: `${SolutionInfo.SOLUTION_NAME}-Portal-${this.identifier}`,
        description: `${SolutionInfo.SOLUTION_FULL_NAME} - portal Lambda function`,
        code: DockerImageCode.fromEcr(Repository.fromRepositoryArn(this, 'PortalRepository', BuildConfig.PortalRepository),
          { tagOrDigest: BuildConfig.PortalTag }),
        architecture: Architecture.X86_64,
        vpc: this.vpc,
        vpcSubnets: this.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        }),
      });
    } else {
      portalFunction = new DockerImageFunction(this, 'PortalFunction', {
        // functionName: `${SolutionInfo.SOLUTION_NAME}-Portal-${this.identifier}`,
        description: `${SolutionInfo.SOLUTION_FULL_NAME} - portal Lambda function`,
        code: DockerImageCode.fromImageAsset(path.join(__dirname, '../../../portal'), {
          file: 'Dockerfile',
          ignoreMode: IgnoreMode.DOCKER,
          platform: Platform.LINUX_AMD64,
        }),
        architecture: Architecture.X86_64,
        vpc: this.vpc,
        vpcSubnets: this.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        }),
      });
    }
    const portalTarget = [new LambdaTarget(portalFunction)];
    const protalTargetGroup = listener.addTargets('PortalTarget', {
      // targetGroupName: `${SolutionInfo.SOLUTION_NAME}-Portal-Target-${this.identifier}`,
      targets: portalTarget,
    });
    Tags.of(protalTargetGroup).add(SolutionInfo.TAG_NAME, 'Portal');
  }
}

