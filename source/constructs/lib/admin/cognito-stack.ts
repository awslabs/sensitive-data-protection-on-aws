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
  Aws, CfnOutput, CfnParameter, CustomResource, Duration, RemovalPolicy,
} from 'aws-cdk-lib';
import { UserPool, VerificationEmailStyle, AdvancedSecurityMode, UserPoolDomain, OAuthScope, CfnUserPoolUser } from 'aws-cdk-lib/aws-cognito';
import { PolicyStatement, Effect, Role, ServicePrincipal, Policy } from 'aws-cdk-lib/aws-iam';
import {
  Code, Function,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { BuildConfig } from '../common/build-config';
import { SolutionInfo } from '../common/solution-info';
import { Parameter } from '../common/parameter';

export interface CognitoProps {
}

export class CognitoStack extends Construct {
  public readonly issuer: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const adminEmail = new CfnParameter(scope, 'AdminEmail', {
      type: 'String',
      allowedPattern: '^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$',
      description: 'Please fill in the administrator email, and the temporary password will be sent to this email.',
    });
    Parameter.addToParamLabels('Administrator', adminEmail.logicalId);
    Parameter.addToParamGroups(
      'Administrator',
      adminEmail.logicalId,
    );

    const userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInCaseSensitive: false,
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
        domainPrefix: `${SolutionInfo.SOLUTION_NAME_ABBR.toLowerCase()}-${Aws.ACCOUNT_ID}`,
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
      ],
    });

    this.issuer = `https://cognito-idp.${Aws.REGION}.amazonaws.com/${userPool.userPoolId}`;
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
  }
}
