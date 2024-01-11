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
  Aws, CfnOutput, CfnParameter, CustomResource, Duration, RemovalPolicy,
} from 'aws-cdk-lib';
import { UserPool, VerificationEmailStyle, AdvancedSecurityMode, UserPoolDomain, OAuthScope, CfnUserPoolUser, AccountRecovery } from 'aws-cdk-lib/aws-cognito';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Parameter } from '../common/parameter';
import { SolutionInfo } from '../common/solution-info';

export interface CognitoProps {
  /**
   * Indicate whether to use cognito
   *
   * @default - false.
   */
  initialUser?: boolean;
}

export class CognitoStack extends Construct {
  public readonly issuer: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props: CognitoProps) {
    super(scope, id);

    const userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInCaseSensitive: false,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
      signInAliases: {
        email: true,
      },
      userVerification: {
        emailStyle: VerificationEmailStyle.LINK,
      },
      advancedSecurityMode: AdvancedSecurityMode.ENFORCED,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      userInvitation: {
        emailSubject: 'Welcome to use Sensitive Data Protection on AWS',
        emailBody: 'Hello {username}, your temporary password for Sensitive Data Protection on AWS is {####}',
      },
    });

    // Create an unique cognito domain
    const userPoolDomain = new UserPoolDomain(this, 'UserPoolDomain', {
      userPool: userPool,
      cognitoDomain: {
        domainPrefix: `${SolutionInfo.SOLUTION_NAME.toLowerCase()}-${Aws.ACCOUNT_ID}`,
      },
    });

    // Add UserPoolClient
    const userPoolClient = userPool.addClient('UserPoolClient', {
      userPoolClientName: 'SDPS',
      authFlows: {
        userSrp: true,
      },
      oAuth: {
        scopes: [OAuthScope.OPENID, OAuthScope.PROFILE, OAuthScope.EMAIL],
      },
    });

    if (props.initialUser) {
      // Create initial user
      new CfnUserPoolUser(this, 'DefaultUser', {
        userPoolId: userPool.userPoolId,
        username: SolutionInfo.INITIAL_USER,
        desiredDeliveryMediums: ['EMAIL'],
        userAttributes: [
          {
            name: 'email',
            value: SolutionInfo.INITIAL_USER,
          },
          {
            name: 'email_verified',
            value: 'true',
          },
        ],
        forceAliasCreation: false,
        messageAction: 'SUPPRESS',
      });
      new AwsCustomResource(
        this,
        'AwsCustomResource-ForcePassword',
        {
          onCreate: {
            service: 'CognitoIdentityServiceProvider',
            action: 'adminSetUserPassword',
            parameters: {
              UserPoolId: userPool.userPoolId,
              Username: SolutionInfo.INITIAL_USER,
              Password: SolutionInfo.INITIAL_PASSWORD,
              Permanent: true,
            },
            physicalResourceId: PhysicalResourceId.of(
              `AwsCustomResource-ForcePassword-${SolutionInfo.INITIAL_USER}`,
            ),
          },
          policy: AwsCustomResourcePolicy.fromSdkCalls({
            resources: AwsCustomResourcePolicy.ANY_RESOURCE,
          }),
          installLatestAwsSdk: true,
        },
      );
    } else {
      const adminEmail = new CfnParameter(scope, 'AdminEmail', {
        type: 'String',
        allowedPattern: '^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$',
        description: 'Please fill in the administrator email, and the temporary password will be sent to this email.',
      });
      Parameter.addToParamLabels('AdminEmail', adminEmail.logicalId);
      Parameter.addToParamGroups(
        'Administrator',
        adminEmail.logicalId,
      );
      // Add AdminUser
      const email = adminEmail.valueAsString;
      new CfnUserPoolUser(this, 'AdminUser', {
        userPoolId: userPool.userPoolId,
        username: email,
        userAttributes: [
          {
            name: 'email',
            value: email,
          },
          {
            name: 'email_verified',
            value: 'true',
          },
        ],
      });
    }
    this.issuer = `https://cognito-idp.${Aws.REGION}.amazonaws.com/${userPool.userPoolId}`;
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
  }
}
