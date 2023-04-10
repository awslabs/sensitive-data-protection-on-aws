/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import * as path from 'path';
import { Aws } from "aws-cdk-lib";
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
import { Construct } from "constructs";
import { SolutionInfo } from '../common/solution-info';


export interface CrawlerEventbridgeProps {
  adminAccountId: string;
  queueName: string;
}

/**
 * Trigger Crawler Event in Agent Account and send SQS messages by Lambda
 */
export class CrawlerEventbridgeStack extends Construct {
  readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: CrawlerEventbridgeProps) {
    super(scope, id);
    const rule = new Rule(this, `${SolutionInfo.SOLUTION_NAME_ABBR}CrawlerEvent`, {
      eventPattern: {
        "source": ["aws.glue"],
        "detailType": ["Glue Crawler State Change"],
        "detail": {
          "state": ["Succeeded", "Failed"]
        }
      },
    });

    const lamdbaRole = new Role(this, `${SolutionInfo.SOLUTION_NAME_ABBR}RoleForCrawlerEvent`, {
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}RoleForCrawlerEvent-${Aws.REGION}`,
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });
    lamdbaRole.attachInlinePolicy(new Policy(this, 'CrawlerAWSLambdaBasicExecutionPolicy', {
      policyName: 'AWSLambdaBasicExecutionPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          resources: ["*"]
        }),
      ]})
    );
    lamdbaRole.addToPolicy(new PolicyStatement({
      resources: [
        `arn:aws-cn:sqs:${Aws.REGION}:${props.adminAccountId}:${props.queueName}`
      ],
      actions: [
        "sqs:SendMessage",
      ],
    }))

    const crawlerEventFunction = new Function(this, `${SolutionInfo.SOLUTION_NAME_ABBR}CrawlerTriggerFunction`, {
      role: lamdbaRole,
      code: Code.fromAsset(path.join(__dirname, '../../api/lambda')),
      handler: "crawler_event.lambda_handler",
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-CrawlerTrigger`,
      runtime: Runtime.PYTHON_3_9,
      memorySize: 128,
      environment: {
        ADMIN_ACCOUNT: props.adminAccountId,
        QUEUE: props.queueName,
      }
    });

    rule.addTarget(
      new LambdaFunction(crawlerEventFunction)
    );
  }
}
