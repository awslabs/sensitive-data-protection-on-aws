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
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import { Construct } from 'constructs';
import { AcmStack } from './admin/acm-stack';
import { AlbStack } from './admin/alb-stack';
import { ApiStack } from './admin/api-stack';
import { BucketStack } from './admin/bucket-stack';
import { CognitoPostStack } from './admin/cognito-post-stack';
import { CognitoStack } from './admin/cognito-stack';
import { DeleteResourcesStack } from './admin/delete-resources-stack';
import { GlueStack } from './admin/glue-stack';
import { RdsStack } from './admin/rds-stack';
import { VpcStack } from './admin/vpc-stack';
import { AgentStack } from './agent-stack';
import { BuildConfig } from './common/build-config';
import { Constants } from './common/constants';
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

  /**
   * When using an existing VPC, only use a private subnet
   *
   * @default - false.
   */
  onlyPrivateSubnets?: boolean;

  /**
   * Indicate whether to use cognito
   *
   * @default - false.
   */
  useCognito?: boolean;
}

// Admin stack
export class AdminStack extends Stack {
  private internetFacing = 'Yes';

  constructor(scope: Construct, id: string, props?: AdminProps) {
    super(scope, id, props);

    this.templateOptions.description = SolutionInfo.DESCRIPTION;
    Parameter.init();
    this.setBuildConfig();

    const bucketStack = new BucketStack(this, 'S3');

    // Oidc Paramter
    let oidcIssuerValue, oidcUserPoolIdValue = '', oidcClientIdValue;
    if (props?.useCognito) {
      const cognitoStack = new CognitoStack(this, 'Cognito');
      oidcIssuerValue = cognitoStack.issuer;
      oidcUserPoolIdValue = cognitoStack.userPoolId;
      oidcClientIdValue = cognitoStack.userPoolClientId;
    } else {
      const oidcIssuer = new CfnParameter(this, 'OidcIssuer', {
        type: 'String',
        description: 'Specify the secure OpenID Connect URL. Maximum 255 characters. URL must begin with "https://"',
        allowedPattern: '(https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?',
      });
      Parameter.addToParamLabels('Issuer URL', oidcIssuer.logicalId);
      const oidcClientId = new CfnParameter(this, 'OidcClientId', {
        type: 'String',
        description: 'Specify the client ID issued by the identity provider. Maximum 255 characters. Use alphanumeric or ‘:_.-/’ characters',
        allowedPattern: '^[^ ]+$',
      });
      Parameter.addToParamLabels('Client ID', oidcClientId.logicalId);
      Parameter.addToParamGroups(
        'OpenID Connect(OIDC) Identity Provider',
        oidcIssuer.logicalId,
        oidcClientId.logicalId,
      );
      oidcIssuerValue = oidcIssuer.valueAsString;
      oidcClientIdValue = oidcClientId.valueAsString;
    }

    const paramNetwork = [];
    if (props?.onlyPrivateSubnets) {
      this.internetFacing = 'No';
    } else {
      // ALB Paramter
      const internetFacing = new CfnParameter(this, 'AlbInternetFacing', {
        type: 'String',
        default: 'Yes',
        description: 'If you choose No, the portal website can be accessed ONLY in the VPC. If you want to access the portal website over Internet, you need to choose Yes',
        allowedValues: ['Yes', 'No'],
      });
      Parameter.addToParamLabels('Public Access', internetFacing.logicalId);
      paramNetwork.push(internetFacing.logicalId);
      this.internetFacing = internetFacing.valueAsString;
    }

    let portValue;
    if (props?.useCognito) {
      portValue = Constants.HttpsDefaultPort;
    } else {
      const port = new CfnParameter(this, 'AlbPort', {
        type: 'Number',
        default: Constants.HttpDefaultPort,
        minValue: 1,
        maxValue: 65535,
        description: 'If an ACM certificate ARN has been added, we recommend using port 443 as the default port for HTTPS protocol. Otherwise, port 80 can be set as an alternative option',
      });
      Parameter.addToParamLabels('Port', port.logicalId);
      paramNetwork.push(port.logicalId);
      portValue = port.valueAsNumber;
    }
    const certificate = new CfnParameter(this, 'AlbCertificate', {
      type: 'String',
      default: '',
      allowedPattern: '^(arn:(aws|aws-cn):acm:[a-zA-Z0-9-_:/]+)?$',
      description: 'To enable secure communication through encryption and enhancing the security of the solution, you can add a public certificate ARN from ACM to create the portal website URL based on the HTTPS protocol',
    });
    Parameter.addToParamLabels('ACM Certificate ARN (optional)', certificate.logicalId);
    paramNetwork.push(certificate.logicalId);
    const domainName = new CfnParameter(this, 'CustomDomainName', {
      type: 'String',
      default: '',
      description: 'By adding your own domain name, such as sdps.example.com, you can directly access the portal website by adding a CNAME record to that domain name after deploying the stack.Only fill in the domain name, do not fill in http(s)://',
    });
    Parameter.addToParamLabels('Custom Domain Name (optional)', domainName.logicalId);
    paramNetwork.push(domainName.logicalId);
    Parameter.addToParamGroups(
      'Network Access',
      ...paramNetwork,
    );
    let certificateValue = certificate.valueAsString;
    if (props?.useCognito) {
      // When using Cognito, if there is no certificate, generate a certificate
      const acmStack = new AcmStack(this, 'Acm', {
        certificateArn: certificateValue,
        bucketName: bucketStack.bucket.bucketName,
      });
      certificateValue = acmStack.certificateArn;
    }

    const vpcStack = new VpcStack(this, 'VPC', {
      existingVpc: props?.existingVpc,
      onlyPrivateSubnets: props?.onlyPrivateSubnets,
    });

    const rdsStack = new RdsStack(this, 'RDS', {
      vpc: vpcStack.vpc,
    });

    new GlueStack(this, 'Glue', {
      bucket: bucketStack.bucket,
    });

    // create api lambda
    const apiStack = new ApiStack(this, 'API', {
      vpc: vpcStack.vpc,
      bucketName: bucketStack.bucket.bucketName,
      rdsClientSecurityGroup: rdsStack.clientSecurityGroup,
      oidcIssuer: oidcIssuerValue,
      oidcClientId: oidcClientIdValue,
    });

    // Using certificateValue will get an error:Cannot reference resources in the Conditions block of the template
    let certificateCondition = certificate.valueAsString;
    if (props?.useCognito) {
      certificateCondition = 'arn';
    }
    const isHttp = new CfnCondition(this, 'IsHttp', { expression: Fn.conditionEquals(certificateCondition, '') });
    const isHttps = new CfnCondition(this, 'IsHttps', { expression: Fn.conditionNot(isHttp) });

    if (props?.existingVpc) {
      const httpAlbStack = new AlbStack(this, 'HttpALB', {
        vpcInfo: {
          vpcId: vpcStack.vpcId,
          publicSubnet1: vpcStack.publicSubnet1,
          publicSubnet2: vpcStack.publicSubnet2,
          privateSubnet1: vpcStack.privateSubnet1,
          privateSubnet2: vpcStack.privateSubnet2,
        },
        onlyPrivateSubnets: props.onlyPrivateSubnets,
        bucket: bucketStack.bucket,
        apiFunction: apiStack.apiFunction,
        port: portValue,
        internetFacing: this.internetFacing,
        certificateArn: '',
        oidcIssuer: oidcIssuerValue,
        oidcClientId: oidcClientIdValue,
        domainName: domainName.valueAsString,
      });
      (httpAlbStack.nestedStackResource as CfnStack).cfnOptions.condition = isHttp;

      const httpsAlbStack = new AlbStack(this, 'HttpsALB', {
        vpcInfo: {
          vpcId: vpcStack.vpcId,
          publicSubnet1: vpcStack.publicSubnet1,
          publicSubnet2: vpcStack.publicSubnet2,
          privateSubnet1: vpcStack.privateSubnet1,
          privateSubnet2: vpcStack.privateSubnet2,
        },
        onlyPrivateSubnets: props.onlyPrivateSubnets,
        bucket: bucketStack.bucket,
        apiFunction: apiStack.apiFunction,
        port: portValue,
        internetFacing: this.internetFacing,
        certificateArn: certificateValue,
        oidcIssuer: oidcIssuerValue,
        oidcClientId: oidcClientIdValue,
        domainName: domainName.valueAsString,
        useCognito: props?.useCognito,
      });
      (httpsAlbStack.nestedStackResource as CfnStack).cfnOptions.condition = isHttps;

      if (props?.useCognito) {
        // When using Cognito, assert as https
        new CognitoPostStack(this, 'UpdateCallbackUrl', {
          userPoolId: oidcUserPoolIdValue,
          userPoolClientId: oidcClientIdValue,
          callbackUrl: `${httpsAlbStack.url}${Constants.LoginCallbackUrlSuffix}`,
          logoutUrl: httpsAlbStack.url,
        });
      }
    } else {
      const httpAlbStack = new AlbStack(this, 'HttpALB', {
        vpc: vpcStack.vpc,
        bucket: bucketStack.bucket,
        apiFunction: apiStack.apiFunction,
        port: portValue,
        internetFacing: this.internetFacing,
        certificateArn: '',
        oidcIssuer: oidcIssuerValue,
        oidcClientId: oidcClientIdValue,
        domainName: domainName.valueAsString,
      });
      (httpAlbStack.nestedStackResource as CfnStack).cfnOptions.condition = isHttp;

      const httpsAlbStack = new AlbStack(this, 'HttpsALB', {
        vpc: vpcStack.vpc,
        bucket: bucketStack.bucket,
        apiFunction: apiStack.apiFunction,
        port: portValue,
        internetFacing: this.internetFacing,
        certificateArn: certificateValue,
        oidcIssuer: oidcIssuerValue,
        oidcClientId: oidcClientIdValue,
        domainName: domainName.valueAsString,
        useCognito: props?.useCognito,
      });
      (httpsAlbStack.nestedStackResource as CfnStack).cfnOptions.condition = isHttps;

      if (props?.useCognito) {
        // When using Cognito, assert as https
        new CognitoPostStack(this, 'UpdateCallbackUrl', {
          userPoolId: oidcUserPoolIdValue,
          userPoolClientId: oidcClientIdValue,
          callbackUrl: `${httpsAlbStack.url}${Constants.LoginCallbackUrlSuffix}`,
          logoutUrl: httpsAlbStack.url,
        });
      }
    }


    const deleteStack = new DeleteResourcesStack(this, 'DeleteResources');

    // new CallRegionStack(this, "CallRegion");

    const agent = new AgentStack(this, 'AgentStack', {
      accountID: Stack.of(this).account,
      synthesizer: process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined,
    });

    agent.node.addDependency(deleteStack);

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
