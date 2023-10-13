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
import { Aws } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import {
  PolicyStatement,
  Role,
  ServicePrincipal,
  Policy,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import {
  Code,
  Function,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';


export interface CrawlerEventbridgeProps {
  adminAccountId: string;
}

/**
 * Trigger Crawler Event in Agent Account and send SQS messages by Lambda
 */
export class CrawlerEventbridgeStack extends Construct {

  constructor(scope: Construct, id: string, props: CrawlerEventbridgeProps) {
    super(scope, id);
    const rule = new Rule(this, `${SolutionInfo.SOLUTION_NAME}CrawlerEvent`, {
      eventPattern: {
        source: ['aws.glue'],
        detailType: ['Glue Crawler State Change'],
        detail: {
          state: ['Succeeded', 'Failed'],
        },
      },
    });

    const lamdbaRole = new Role(this, `${SolutionInfo.SOLUTION_NAME}RoleForCrawlerEvent`, {
      roleName: `${SolutionInfo.SOLUTION_NAME}RoleForCrawlerEvent-${Aws.REGION}`, //Name must be specified
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    lamdbaRole.attachInlinePolicy(new Policy(this, 'CrawlerAWSLambdaBasicExecutionPolicy', {
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
    }),
    );
    lamdbaRole.addToPolicy(new PolicyStatement({
      resources: [
        `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${props.adminAccountId}:${SolutionInfo.SOLUTION_NAME}-Crawler`,
      ],
      actions: [
        'sqs:SendMessage',
      ],
    }));

    const crawlerEventFunction = new Function(this, `${SolutionInfo.SOLUTION_NAME}CrawlerTriggerFunction`, {
      role: lamdbaRole,
      code: Code.fromAsset(path.join(__dirname, '../../api/lambda')),
      handler: 'crawler_event.lambda_handler',
      functionName: `${SolutionInfo.SOLUTION_NAME}-CrawlerTrigger`, //Name must be specified
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - CrawlerTrigger`,
      runtime: Runtime.PYTHON_3_9,
      memorySize: 128,
      environment: {
        SolutionName: SolutionInfo.SOLUTION_NAME,
        AdminAccountId: props.adminAccountId,
      },
    });

    rule.addTarget(
      new LambdaFunction(crawlerEventFunction),
    );
  }
}
