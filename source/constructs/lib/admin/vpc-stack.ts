/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import {
  IpAddresses, CfnSubnet, FlowLogDestination,
  FlowLogTrafficType, IVpc,
  SecurityGroup, SubnetType, Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { CfnLogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { addCfnNagSuppressRules } from '../admin-stack';

export interface VpcProps {
  /**
   * cidr to create the VPC
   *
   * @default - 10.0.0.0/16.
   */
  cidr?: string

  /**
   * if a VPC is not provided, create a new VPC
   *
   * @default - None.
   */
  vpc?: IVpc;
}

/**
 * Stack to provision a default VPC and security group.
 */
export class VpcStack extends Construct {
  readonly vpc: IVpc;
  readonly cidr: string;

  constructor(scope: Construct, id: string, props?: VpcProps) {
    super(scope, id);

    if (props?.cidr) {
      this.cidr = props?.cidr
    } else {
      this.cidr = "10.0.0.0/16";
    }

    if (props?.vpc) {
      this.vpc = props.vpc;
    } else {
      const vpcLogGroup = new LogGroup(this, 'VPCLogGroup', {
        retention: RetentionDays.TWO_WEEKS,
        removalPolicy: RemovalPolicy.RETAIN,
      });

      const cfnVpcLG = vpcLogGroup.node.defaultChild as CfnLogGroup;
      addCfnNagSuppressRules(cfnVpcLG, [
        {
          id: 'W84',
          reason: 'log group is encrypted with the default master key',
        },
      ]);

      // Create a new VPC
      this.vpc = new Vpc(this, 'DefaultVPC', {
        ipAddresses: IpAddresses.cidr(this.cidr),
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetConfiguration: [
          {
            name: 'public',
            subnetType: SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'private',
            subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
          },
        ],
        maxAzs: 3,
        natGateways: 1,
        flowLogs: {
          ['DefaultVPCFlowLog']: {
            destination: FlowLogDestination.toCloudWatchLogs(vpcLogGroup),
            trafficType: FlowLogTrafficType.REJECT,
          },
        },
      });

      this.vpc.publicSubnets.forEach((subnet) => {
        const cfnSubnet = subnet.node.defaultChild as CfnSubnet;
        addCfnNagSuppressRules(cfnSubnet, [
          {
            id: 'W33',
            reason: 'Default for public subnets',
          },
        ]);
      });
    }
  }
}
