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
  Aws, CustomResource, Duration,
} from 'aws-cdk-lib';
import { PolicyStatement, Effect, Role, ServicePrincipal, Policy } from 'aws-cdk-lib/aws-iam';
import {
  Code, Function,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { BuildConfig } from '../common/build-config';
import { SolutionInfo } from '../common/solution-info';

export interface DeleteResourcesProps {
}

// Update/delete resources generated by the program
// If the name is modified, a deletion event will be triggered during upgrade.
// Therefore, the name DeleteResources is retained, but there are actually update events
export class DeleteResourcesStack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a lambda layer with required python packages.
    const deleteAdminResourcesLayer = new LayerVersion(this, 'DeleteAdminResourcesLayer', {
      code: Code.fromAsset(path.join(__dirname, './delete-resources'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${BuildConfig.PIP_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      // layerVersionName: `${SolutionInfo.SOLUTION_NAME}-DeleteResources`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - delete resources generated by the program layer`,
    });

    const deleteAdminResourcesRole = new Role(this, 'DeleteAdminResourcesRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    deleteAdminResourcesRole.attachInlinePolicy(new Policy(this, 'AWSLambdaBasicExecutionPolicy', {
      // policyName: 'AWSLambdaBasicExecutionPolicy',
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
      actions: [
        'events:DeleteRule',
        'events:ListRules',
        'events:RemoveTargets',
        'events:ListTagsForResource',
        'lambda:InvokeFunction',
      ],
      resources: [
        `arn:${Aws.PARTITION}:events:*:${Aws.ACCOUNT_ID}:rule/*`,
        `arn:${Aws.PARTITION}:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:${SolutionInfo.SOLUTION_NAME}-Controller`,
      ],
    });
    deleteAdminResourcesRole.addToPolicy(noramlStatement);

    const deleteAdminResourcesFunction = new Function(this, 'DeleteAdminResourcesFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME}-DeleteAdminResources`, //Name must be specified
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - delete resources generated by the program`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'delete_resources.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './delete-resources')),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      layers: [deleteAdminResourcesLayer],
      role: deleteAdminResourcesRole,
      environment: {
        SolutionName: SolutionInfo.SOLUTION_NAME,
      },
    });
    deleteAdminResourcesFunction.node.addDependency(deleteAdminResourcesRole);

    const deleteAdminResourcesTrigger = new CustomResource(this, 'DeleteAdminResourcesTrigger', {
      serviceToken: deleteAdminResourcesFunction.functionArn,
      properties: {
        Version: SolutionInfo.SOLUTION_VERSION,
      },
    });
    deleteAdminResourcesTrigger.node.addDependency(deleteAdminResourcesFunction);
  }
}
