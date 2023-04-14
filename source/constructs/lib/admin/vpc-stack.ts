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

import {
  CfnParameter,
  CfnRule,
  Fn,
  RemovalPolicy,
} from 'aws-cdk-lib';
import {
  IpAddresses,
  CfnSubnet,
  FlowLogDestination,
  FlowLogTrafficType,
  IVpc,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { CfnLogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { addCfnNagSuppressRules } from '../admin-stack';
import { Parameter } from '../common/parameter';
import { SolutionInfo } from '../common/solution-info';

export interface VpcProps {
  /**
   * cidr to create the VPC
   *
   * @default - 10.0.0.0/16.
   */
  cidr?: string;

  /**
   * Indicate whether to create a new VPC or use existing VPC for this Solution.
   *
   * @default - false.
   */
  existingVpc?: boolean;
  readonly internetFacing?: boolean;
}

/**
 * Stack to provision a default VPC and security group.
 */
export class VpcStack extends Construct {
  public vpc!: IVpc;

  constructor(scope: Construct, id: string, props?: VpcProps) {
    super(scope, id);

    if (props?.existingVpc) {
      this.selectExistingVpc(scope);
    } else {
      this.createVpc(props);
    }
  }

  private createVpc(props?: VpcProps) {
    const cidr = props?.cidr ?? '10.0.0.0/16';

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
    this.vpc = new Vpc(this, 'NewVPC', {
      vpcName: `${SolutionInfo.SOLUTION_NAME_ABBR}-VPC`,
      ipAddresses: IpAddresses.cidr(cidr),
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

  private selectExistingVpc(scope: Construct) {
    const VPC_ID_PARRERN = '^vpc-[a-f0-9]+$';

    const vpcId = new CfnParameter(scope, 'VpcId', {
      description: 'Select the virtual private cloud (VPC).',
      type: 'AWS::EC2::VPC::Id',
      allowedPattern: `^${VPC_ID_PARRERN}$`,
      constraintDescription: `VPC id must match pattern ${VPC_ID_PARRERN}`,
    });

    const privateSubnets = new CfnParameter(scope, 'PrivateSubnets', {
      description: 'The private subnets must have a route to NatGateway.Cannot select public subnets.',
      type: 'List<AWS::EC2::Subnet::Id>',
    });

    const publicSubnets = new CfnParameter(scope, 'PublicSubnets', {
      description: 'Select at least one public subnet in each Availability Zone.',
      type: 'List<AWS::EC2::Subnet::Id>',
    });

    Parameter.addToParamGroups(
      'VPC Settings',
      vpcId.logicalId,
      publicSubnets.logicalId,
      privateSubnets.logicalId,
    );

    this.vpc = Vpc.fromVpcAttributes(scope, 'ExistingVpc', {
      vpcId: vpcId.valueAsString,
      availabilityZones: Fn.getAzs(),
      privateSubnetIds: privateSubnets.valueAsList,
      publicSubnetIds: publicSubnets.valueAsList,
    });

    new CfnRule(scope, 'SubnetsInVpc', {
      assertions: [
        {
          assert: Fn.conditionEachMemberIn(Fn.valueOfAll('AWS::EC2::Subnet::Id', 'VpcId'), Fn.refAll('AWS::EC2::VPC::Id')),
          assertDescription:
            'All subnets must in the VPC',
        },
      ],
    });
  }
}
