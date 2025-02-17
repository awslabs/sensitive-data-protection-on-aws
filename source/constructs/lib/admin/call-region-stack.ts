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
  Aws,
  CustomResource,
  Duration,
} from 'aws-cdk-lib';

import { PolicyStatement, Effect, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  Code, Function,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { BuildConfig } from '../common/build-config';
import { SolutionInfo } from '../common/solution-info';

export interface CallRegionProps {
}

// call admin region CloudFormation
export class CallRegionStack extends Construct {
  constructor(scope: Construct, id: string, props?: CallRegionProps) {
    super(scope, id);

    // Begin call admin region
    // Create a lambda layer with required python packages.
    const callRegionLayer = new LayerVersion(this, 'CallRegionLayer', {
      code: Code.fromAsset(path.join(__dirname, './region'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${BuildConfig.PIP_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      layerVersionName: `${SolutionInfo.SOLUTION_NAME}-CallRegion`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - call admin region layer`,
    });

    const callRegionRole = new Role(this, 'CallRegionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    const noramlStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cloudformation:CreateStack',
        'cloudformation:DeleteStack',
        'ssm:GetParameters',
        'iam:CreateRole',
        'iam:DeleteRole',
        'iam:AttachRolePolicy',
        'iam:DetachRolePolicy',
        'iam:PutRolePolicy',
        'iam:DeleteRolePolicy',
        'iam:GetRole',
        'iam:PassRole',
        's3:GetObject',
        'lambda:*'],
      resources: ['*'],
    });
    const sqsStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sqs:*'],
      resources: [`arn:${Aws.PARTITION}:sqs:*:${Aws.ACCOUNT_ID}:${SolutionInfo.SOLUTION_NAME}-*`],
    });
    callRegionRole.addToPolicy(noramlStatement);
    callRegionRole.addToPolicy(sqsStatement);

    const callRegionFunction = new Function(this, 'CallRegionFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME}-CallRegion`,
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - call admin region`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'call_region.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './region')),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      layers: [callRegionLayer],
      role: callRegionRole,
    });
    callRegionFunction.node.addDependency(callRegionRole);

    const callRegionProvider = new Provider(this, 'CallRegionProvider', {
      onEventHandler: callRegionFunction,
    });

    const callRegionTrigger = new CustomResource(this, 'CallRegionTrigger', {
      serviceToken: callRegionProvider.serviceToken,
      properties: {
        Version: SolutionInfo.SOLUTION_VERSION,
      },
    });
    callRegionTrigger.node.addDependency(callRegionProvider);
  }
}
