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
  Tags,
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
  /**
   * When using an existing VPC, only use a private subnet
   *
   * @default - false.
   */
  onlyPrivateSubnets?: boolean;
  readonly internetFacing?: boolean;
}

/**
 * Stack to provision a default VPC and security group.
 */
export class VpcStack extends Construct {
  public vpc!: IVpc;
  public vpcId = '';
  public publicSubnet1 = '';
  public publicSubnet2 = '';
  public privateSubnet1 = '';
  public privateSubnet2 = '';

  constructor(scope: Construct, id: string, props?: VpcProps) {
    super(scope, id);

    if (props?.existingVpc) {
      this.selectExistingVpc(scope, props.onlyPrivateSubnets ?? false);
    } else {
      this.createVpc(props);
    }
  }

  private createVpc(props?: VpcProps) {
    const cidr = props?.cidr ?? '10.0.0.0/16';

    const vpcLogGroup = new LogGroup(this, 'VPCLogGroup', {
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
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

  private selectExistingVpc(scope: Construct, onlyPrivateSubnets: boolean) {
    const param = [];
    let publicSubnetIds = undefined;

    const VPC_ID_PARRERN = '^vpc-[a-f0-9]+$';

    const vpcId = new CfnParameter(scope, 'VpcId', {
      description: 'Select the virtual private cloud (VPC).',
      type: 'AWS::EC2::VPC::Id',
      allowedPattern: `^${VPC_ID_PARRERN}$`,
      constraintDescription: `VPC id must match pattern ${VPC_ID_PARRERN}`,
    });
    param.push(vpcId.logicalId);
    this.vpcId = vpcId.valueAsString;

    if (!onlyPrivateSubnets) {
      publicSubnetIds = [];
      const publicSubnet1 = new CfnParameter(scope, 'PublicSubnet1', {
        description: 'Select one public subnet in Availability Zone 1.',
        type: 'AWS::EC2::Subnet::Id',
      });
      param.push(publicSubnet1.logicalId);
      publicSubnetIds.push(publicSubnet1.valueAsString);
      this.publicSubnet1 = publicSubnet1.valueAsString;

      const publicSubnet2 = new CfnParameter(scope, 'PublicSubnet2', {
        description: 'Select one public subnet in Availability Zone 2.',
        type: 'AWS::EC2::Subnet::Id',
      });
      param.push(publicSubnet2.logicalId);
      publicSubnetIds.push(publicSubnet2.valueAsString);
      this.publicSubnet2 = publicSubnet2.valueAsString;
    }

    const privateSubnet1 = new CfnParameter(scope, 'PrivateSubnet1', {
      description: 'The private subnet must have a route to NatGateway.Select one private subnet in Availability Zone 1.',
      type: 'AWS::EC2::Subnet::Id',
    });
    param.push(privateSubnet1.logicalId);

    const privateSubnet2 = new CfnParameter(scope, 'PrivateSubnet2', {
      description: 'The private subnet must have a route to NatGateway.Select one private subnet in Availability Zone 2.',
      type: 'AWS::EC2::Subnet::Id',
    });
    param.push(privateSubnet2.logicalId);

    Parameter.addToParamGroups(
      'VPC Settings',
      ...param,
    );

    this.vpc = Vpc.fromVpcAttributes(scope, 'ExistingVpc', {
      vpcId: vpcId.valueAsString,
      availabilityZones: [0, 1].map(i => Fn.select(i, Fn.getAzs())),
      privateSubnetIds: [privateSubnet1.valueAsString, privateSubnet2.valueAsString],
      publicSubnetIds: publicSubnetIds,
    });
    this.privateSubnet1 = privateSubnet1.valueAsString;
    this.privateSubnet2 = privateSubnet2.valueAsString;

    new CfnRule(scope, 'SubnetsInVpc', {
      assertions: [
        {
          assert: Fn.conditionEachMemberIn(Fn.valueOfAll('AWS::EC2::Subnet::Id', 'VpcId'), Fn.refAll('AWS::EC2::VPC::Id')),
          assertDescription:
            'All subnets must in the VPC',
        },
      ],
    });

    if (onlyPrivateSubnets) {
      new CfnRule(scope, 'SubnetsNoRepeat', {
        assertions: [
          {
            assert: Fn.conditionNot(Fn.conditionContains([
              this.privateSubnet2,
            ],
            this.privateSubnet1)),
            assertDescription: 'All subnets must NOT Repeat',
          },
        ],
      });
    } else {
      new CfnRule(scope, 'SubnetsNoRepeat', {
        assertions: [
          {
            assert: Fn.conditionNot(Fn.conditionContains([
              this.publicSubnet2,
              this.privateSubnet1,
              this.privateSubnet2,
            ],
            this.publicSubnet1)),
            assertDescription: 'All subnets must NOT Repeat',
          },
          {
            assert: Fn.conditionNot(Fn.conditionContains([
              this.publicSubnet1,
              this.privateSubnet1,
              this.privateSubnet2,
            ],
            this.publicSubnet2)),
            assertDescription: 'All subnets must NOT Repeat',
          },
          {
            assert: Fn.conditionNot(Fn.conditionContains([
              this.publicSubnet1,
              this.publicSubnet2,
              this.privateSubnet2,
            ],
            this.privateSubnet1)),
            assertDescription: 'All subnets must NOT Repeat',
          },
          {
            assert: Fn.conditionNot(Fn.conditionContains([
              this.publicSubnet1,
              this.publicSubnet2,
              this.privateSubnet1,
            ],
            this.privateSubnet2)),
            assertDescription: 'All subnets must NOT Repeat',
          },
        ],
      });
    }

  }
}
