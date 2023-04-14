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
} from 'aws-cdk-lib';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
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

    // Oidc Paramter
    const oidcProvider = new CfnParameter(this, 'OidcProvider', {
      type: 'String',
      description: 'Open Id Connector Provider Issuer',
      allowedPattern: '(https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?',
    });
    const oidcClientId = new CfnParameter(this, 'OidcClientId', {
      type: 'String',
      description: 'OpenID Connector Client Id',
      allowedPattern: '^[^ ]+$',
    });
    Parameter.addToParamGroups(
      'OpenID Connect (OIDC) Settings',
      oidcClientId.logicalId,
      oidcProvider.logicalId,
    );

    // ALB Paramter
    const internetFacing = new CfnParameter(this, 'AlbInternetFacing', {
      type: 'String',
      default: 'Yes',
      description: 'Set whether ALB faces the Internet',
      allowedValues: ['Yes', 'No'],
    });
    const port = new CfnParameter(this, 'AlbPort', {
      type: 'Number',
      default: 80,
      minValue: 1,
      maxValue: 65535,
      description: 'Set the port number of ALB',
    });
    const certificate = new CfnParameter(this, 'AlbCertificate', {
      type: 'String',
      default: '',
      allowedPattern: '^(arn:(aws|aws-cn):acm:[a-zA-Z0-9-_:/]+)?$',
      description: 'If you want to use the https feature, Please fill in the arn of the ACM certificate.',
    });
    Parameter.addToParamLabels('(optional)AlbCertificate', certificate.logicalId);
    const domainName = new CfnParameter(this, 'CustomDomainName', {
      type: 'String',
      default: '',
      description: 'Only fill in the domain name, do not fill in http(s)://',
    });
    Parameter.addToParamLabels('(optional)CustomDomainName', domainName.logicalId);
    Parameter.addToParamGroups(
      'ALB Settings',
      internetFacing.logicalId,
      port.logicalId,
      certificate.logicalId,
      domainName.logicalId,
    );

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

    const isHttp = new CfnCondition(this, 'IsHttp', { expression: Fn.conditionEquals(certificate.valueAsString, '') });
    const isHttps = new CfnCondition(this, 'IsHttps', { expression: Fn.conditionNot(isHttp) });

    const httpAlbStack = new AlbStack(this, 'HttpALB', {
      vpc: vpcStack.vpc,
      bucket: bucketStack.bucket,
      apiFunction: apiStack.apiFunction,
      port: port.valueAsNumber,
      internetFacing: internetFacing.valueAsString,
      certificateArn: '',
      oidcProvider: oidcProvider.valueAsString,
      oidcClientId: oidcClientId.valueAsString,
      domainName: domainName.valueAsString,
    });
    (httpAlbStack.nestedStackResource as CfnStack).cfnOptions.condition = isHttp;

    const httpsAlbStack = new AlbStack(this, 'HttpsALB', {
      vpc: vpcStack.vpc,
      bucket: bucketStack.bucket,
      apiFunction: apiStack.apiFunction,
      port: port.valueAsNumber,
      internetFacing: internetFacing.valueAsString,
      certificateArn: certificate.valueAsString,
      oidcProvider: oidcProvider.valueAsString,
      oidcClientId: oidcClientId.valueAsString,
      domainName: domainName.valueAsString,
    });
    (httpsAlbStack.nestedStackResource as CfnStack).cfnOptions.condition = isHttps;


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
