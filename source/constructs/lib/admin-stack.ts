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
  CfnOutput,
  CfnParameter,
  CfnResource,
  Stack,
  StackProps,
  CfnCondition,
  Fn,
  CfnStack,
  Tags,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AlbStack } from './admin/alb-stack';
import { ApiStack } from './admin/api-stack';
import { BucketStack } from './admin/bucket-stack';
import { DeleteResourcesStack } from './admin/delete-resources-stack';
import { GlueStack } from './admin/glue-stack';
import { RdsStack } from './admin/rds-stack';
import { VpcStack } from './admin/vpc-stack';
import { BuildConfig } from './common/build-config';
import { Parameter } from './common/parameter';
import { SolutionInfo } from './common/solution-info';

/**
 * cfn-nag suppression rule interface
 */
interface CfnNagSuppressRule {
  readonly id: string;
  readonly reason: string;
}

export function addCfnNagSuppressRules(
  resource: CfnResource,
  rules: CfnNagSuppressRule[],
) {
  resource.addMetadata('cfn_nag', {
    rules_to_suppress: rules,
  });
}

export interface AdminProps extends StackProps {
  /**
   * Indicate whether to create a new VPC or use existing VPC for this Solution
   *
   * @default - false.
   */
  existingVpc?: boolean;
}

export const enum AuthType {
  COGNITO = 'AMAZON_COGNITO_USER_POOLS',
  OIDC = 'OPENID_CONNECT',
}
// Admin stack
export class AdminStack extends Stack {

  constructor(scope: Construct, id: string, props?: AdminProps) {
    super(scope, id, props);

    this.templateOptions.description = SolutionInfo.DESCRIPTION;
    Parameter.init();
    this.setBuildConfig();

    // ALB Paramter
    const port = new CfnParameter(this, 'AlbPort', {
      type: 'Number',
      default: 80,
      minValue: 1,
      maxValue: 65535,
      description: 'If an ACM certificate ARN has been added, we recommend using port 443 as the default port for HTTPS protocol. Otherwise, port 80 can be set as an alternative option',
    });
    Parameter.addToParamLabels('Port', port.logicalId);

    const vpcStack = new VpcStack(this, 'VPC', {
      existingVpc: props?.existingVpc,
    });

    const rdsStack = new RdsStack(this, 'RDS', {
      vpc: vpcStack.vpc,
      existingVpc: props?.existingVpc,
    });

    const bucketStack = new BucketStack(this, 'S3');

    new GlueStack(this, 'Glue', {
      bucket: bucketStack.bucket,
    });

    // create api lambda
    const apiStack = new ApiStack(this, 'API', {
      vpc: vpcStack.vpc,
      bucketName: bucketStack.bucket.bucketName,
      rdsClientSecurityGroup: rdsStack.clientSecurityGroup,
    });

    const httpAlbStack = new AlbStack(this, 'HttpALB', {
      vpcInfo: {
        vpcId: vpcStack.vpcId,
        publicSubnet1: vpcStack.publicSubnet1,
        publicSubnet2: vpcStack.publicSubnet2,
        privateSubnet1: vpcStack.privateSubnet1,
        privateSubnet2: vpcStack.privateSubnet2,
      },
      bucket: bucketStack.bucket,
      apiFunction: apiStack.apiFunction,
      port: port.valueAsNumber,
    });

    new DeleteResourcesStack(this, 'DeleteResources');

    // new CallRegionStack(this, "CallRegion");

    this.templateOptions.metadata = {
      'AWS::CloudFormation::Interface': {
        ParameterGroups: Parameter.paramGroups,
        ParameterLabels: Parameter.paramLabels,
      },
    };

    new CfnOutput(this, 'VpcIdOutput', {
      description: 'VPC Id',
      value: vpcStack.vpc.vpcId,
    });

    Tags.of(this).add(SolutionInfo.TAG_KEY, SolutionInfo.TAG_VALUE);
  }

  private setBuildConfig() {
    BuildConfig.BuildInChina = this.node.tryGetContext('BuildInChina') != undefined;
    BuildConfig.InternetFacing = this.node.tryGetContext('InternetFacing') != undefined;
    const portalRepository = this.node.tryGetContext('PortalRepository');
    if (portalRepository) {
      BuildConfig.PortalRepository = portalRepository;
    }
    BuildConfig.PortalTag = this.node.tryGetContext('PortalTag');
    if (BuildConfig.BuildInChina) {
      BuildConfig.PIP_MIRROR_PARAMETER = `-i ${BuildConfig.PIP_MIRROR_CHINA_URL}`;
    }
  }
}
