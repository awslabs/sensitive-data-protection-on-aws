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
  CfnParameter,
  Duration,
  Stack,
  StackProps,
} from 'aws-cdk-lib';

import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import {
  Code, Function,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import { SqsStack } from './admin/sqs-stack';
import { SolutionInfo } from './common/solution-info';


// Admin region stack
// The actually executed CloudFormation
export class AdminRegionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.templateOptions.description = SolutionInfo.DESCRIPTION;

    const adminRegion = new CfnParameter(this, 'AdminRegion', {
      type: 'String',
      description: 'The region of admin account.',
    });

    const crawlerSqsStack = new SqsStack(this, 'CrawlerQueue', { name: 'Crawler' });
    const discoveryJobSqsStack = new SqsStack(this, 'DiscoveryJobQueue', { name: 'DiscoveryJob' });

    const forwardMessageFunction = new Function(this, 'ForwardMessageFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-Forward-Message`,
      description: `${SolutionInfo.SOLUTION_NAME} - Forward message`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'forward_message.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, '../api/lambda')),
      memorySize: 1024,
      timeout: Duration.seconds(20),
      environment: { AdminRegion: adminRegion.valueAsString },
    });
    const crawlerEventSource = new SqsEventSource(crawlerSqsStack.queue);
    forwardMessageFunction.addEventSource(crawlerEventSource);
    const discoveryJobEventSource = new SqsEventSource(discoveryJobSqsStack.queue);
    forwardMessageFunction.addEventSource(discoveryJobEventSource);

    const functionStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sqs:*'],
      resources: [`arn:${Aws.PARTITION}:sqs:${adminRegion.valueAsString}:${Aws.ACCOUNT_ID}:${SolutionInfo.SOLUTION_NAME_ABBR}-*`],
    });
    forwardMessageFunction.addToRolePolicy(functionStatement);
  }
}
