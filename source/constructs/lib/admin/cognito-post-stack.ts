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

export interface CognitoPostProps {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
  readonly callbackUrl: string;
  readonly logoutUrl: string;
}

export class CognitoPostStack extends Construct {

  constructor(scope: Construct, id: string, props: CognitoPostProps) {
    super(scope, id);

    // Create a lambda layer with required python packages.
    const cognitoPostLayer = new LayerVersion(this, 'CognitoPostLayer', {
      code: Code.fromAsset(path.join(__dirname, './cognito-post'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${BuildConfig.PIP_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      // layerVersionName: `${SolutionInfo.SOLUTION_NAME}-CognitoPost`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - CognitoPost generated by the program layer`,
    });

    const cognitoPostRole = new Role(this, 'CognitoPostRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    cognitoPostRole.attachInlinePolicy(new Policy(this, 'AWSLambdaBasicExecutionPolicy', {
      policyName: 'AWSLambdaBasicExecutionPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
      ],
    }));
    const noramlStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cognito-idp:UpdateUserPoolClient',
        'cognito-idp:DescribeUserPoolClient'],
      resources: [`arn:${Aws.PARTITION}:cognito-idp:*:${Aws.ACCOUNT_ID}:userpool/*`],
    });
    cognitoPostRole.addToPolicy(noramlStatement);

    const cognitoPostFunction = new Function(this, 'CognitoPostFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME}-CognitoPost`, //Name must be specified
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - Update callback url`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'cognito-post.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './cognito-post')),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      layers: [cognitoPostLayer],
      role: cognitoPostRole,
    });
    cognitoPostFunction.node.addDependency(cognitoPostRole);

    const acmTrigger = new CustomResource(this, 'AcmTrigger', {
      serviceToken: cognitoPostFunction.functionArn,
      properties: {
        Version: SolutionInfo.SOLUTION_VERSION,
        UserPoolId: props.userPoolId,
        UserPoolClientId: props.userPoolClientId,
        CallbackUrl: props.callbackUrl,
        LogoutUrl: props.logoutUrl,
      },
    });
    acmTrigger.node.addDependency(cognitoPostFunction);
  }
}
