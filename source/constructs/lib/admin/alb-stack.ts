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
  readonly publicSubnets?: string;
  readonly privateSubnets?: string;
  readonly bucket: IBucket;
  readonly apiFunction: Function;
  readonly port: number;
}

export class AlbStack extends NestedStack {
  public readonly url: string;
  private readonly httpDefaultPort = 80;
  private readonly httpsDefaultPort = 443;
  private readonly portalConfigPriority = 10;
  private readonly apiPriority = 20;
  private readonly identifier: string;
  private readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: AlbProps) {
    super(scope, id);

    this.identifier = ApplicationProtocol.HTTP.toString();

    if (props.vpc) {
      this.vpc = props.vpc;
    } else {
      this.vpc = Vpc.fromVpcAttributes(this, 'AlbVpc', {
        vpcId: props.vpcInfo!.vpcId,
        availabilityZones: [0, 1].map(i => Fn.select(i, Fn.getAzs())),
        publicSubnetIds: [props.vpcInfo!.publicSubnet1, props.vpcInfo!.publicSubnet2],
        privateSubnetIds: [props.vpcInfo!.privateSubnet1, props.vpcInfo!.privateSubnet2],
      });
    }

    const albSecurityGroup = this.createSecurityGroup(props.port);

    const alb = new ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      // loadBalancerName: `${SolutionInfo.SOLUTION_NAME_ABBR}-ALB-${this.identifier}`,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      http2Enabled: true,
    });

    this.setLog(alb, props);
    const listener = alb.addListener('HttpListener', {
      protocol: ApplicationProtocol.HTTP,
      port: props.port,
    });

    this.url = this.setUrl(scope, alb.loadBalancerDnsName, props, this.httpDefaultPort);
    this.createApi(listener, props);
    new CfnOutput(scope, `PortalUrl${this.identifier}`, {
      description: 'API URL',
      value: this.url,
    });
  };

  private setUrl(scope: Construct, dnsName: string, props: AlbProps, defaultPort: number) {
    // Both the main stack and this stack require these conditions
    const isDefaultPort = new CfnCondition(this, `IsDefaultPort${this.identifier}`, { expression: Fn.conditionEquals(props.port, defaultPort) });
    new CfnCondition(scope, `IsDefaultPort${this.identifier}`, { expression: isDefaultPort.expression });
    const protocolShow = this.identifier.toLowerCase();
    const domainNameShow = dnsName;
    const url = `${protocolShow}://${domainNameShow}:${props.port}`;
    return url;
  }

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
    albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(port), 'rule of allow inbound traffic from servier port');
    albSecurityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(port), 'rule of allow inbound traffic from servier port');
    return albSecurityGroup;
  }

  private createApi(listener: ApplicationListener, props: AlbProps) {
    const apiTarget = [new LambdaTarget(props.apiFunction)];
    const apiTargetGroup = listener.addTargets('ApiTarget', {
      // targetGroupName: `${SolutionInfo.SOLUTION_NAME_ABBR}-API-Target-${this.identifier}`,
      targets: apiTarget,
    });
    Tags.of(apiTargetGroup).add(SolutionInfo.TAG_NAME, 'API');
  }

}

