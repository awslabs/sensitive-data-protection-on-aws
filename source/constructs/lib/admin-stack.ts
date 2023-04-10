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
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RdsStack } from './admin/rds-stack';
import { VpcStack } from './admin/vpc-stack';
import { ApiStack } from './admin/api-stack';
import { SolutionInfo } from './common/solution-info';
import { BucketStack } from './admin/bucket-stack';
import { GlueStack } from './admin/glue-stack';
import { DeleteResourcesStack } from './admin/delete-resources-stack';
import { AlbStack } from './admin/alb-stack';

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
  /**
   * Indicate the auth type in which main stack uses
   */
  authType?: string;
}

export const enum AuthType {
  COGNITO = 'AMAZON_COGNITO_USER_POOLS',
  OIDC = 'OPENID_CONNECT',
}
// Admin stack
export class AdminStack extends Stack {
  private readonly paramGroups: any[] = [];
  private paramLabels: any = {};
  private oidcProvider = "";
  private oidcClientId = "";

  constructor(scope: Construct, id: string, props?: AdminProps) {
    super(scope, id, props);

    this.templateOptions.description = SolutionInfo.DESCRIPTION;

    let oidcProvider: CfnParameter | null = null;
    let oidcClientId: CfnParameter | null = null;

    oidcProvider = new CfnParameter(this, "OidcProvider", {
      type: "String",
      description: "Open Id Connector Provider Issuer",
      allowedPattern:
        "(https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?",
    });
    this.addToParamLabels("OidcProvider", oidcProvider.logicalId);
    this.oidcProvider = oidcProvider.valueAsString;

    oidcClientId = new CfnParameter(this, "OidcClientId", {
      type: "String",
      description: "OpenID Connector Client Id",
      allowedPattern: "^[^ ]+$",
    });
    this.addToParamLabels("OidcClientId", oidcClientId.logicalId);
    this.oidcClientId = oidcClientId.valueAsString;

    this.addToParamGroups(
      "OpenID Connect (OIDC) Settings",
      oidcClientId.logicalId,
      oidcProvider.logicalId
    );

    const buildInChina = this.node.tryGetContext("BuildInChina");
    if (buildInChina){
      SolutionInfo.PIP_MIRROR_PARAMETER = `-i ${SolutionInfo.PIP_MIRROR_CHINA_URL}`;
    }

    const vpcStack = new VpcStack(this, "VPC", {});

    const rdsStack = new RdsStack(this, "RDS", {
      vpc: vpcStack.vpc,
    });

    const bucketStack = new BucketStack(this, "S3");

    const glueStack = new GlueStack(this, "Glue", {
      bucket: bucketStack.bucket,
    });

    // create api lambda
    const apiStack = new ApiStack(this, 'API', {
      vpc: vpcStack.vpc,
      bucketName: bucketStack.bucket.bucketName,
      rdsClientSecurityGroup: rdsStack.clientSecurityGroup,
    });

    const albStack = new AlbStack(this, "ALB", {
      vpc: vpcStack.vpc,
      bucket: bucketStack.bucket,
      internetFacing: false,
      port: 80,
      apiFunction: apiStack.apiFunction,
      oidcProvider: this.oidcProvider,
      oidcClientId: this.oidcClientId,
    })

    new DeleteResourcesStack(this, 'DeleteResources');

    // new CallRegionStack(this, "CallRegion");

    new CfnOutput(this, 'VpcId', {
      description: 'VPC Id',
      value: vpcStack.vpc.vpcId
    }).overrideLogicalId('VpcId');

    new CfnOutput(this, 'portalUrl', {
      description: 'Portal URL',
      value: albStack.url,
    }).overrideLogicalId('portalUrl');
  }

  private addToParamGroups(label: string, ...param: string[]) {
    this.paramGroups.push({
      Label: { default: label },
      Parameters: param,
    });
  }

  private addToParamLabels(label: string, param: string) {
    this.paramLabels[param] = {
      default: label,
    };
  }
}
