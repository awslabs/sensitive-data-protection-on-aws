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
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
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

// Move it to admin stack
const syncDataSourceParam = new cdk.CfnParameter(this, "DataSourceSyncFrequency", {
  type: "String",
  allowedValues: ["Hourly", "Daily", "Weekly", "Monthly"],
  description: "Frequency of syncing data source automatically"
});

/**
 * Sync data source in a fixed period
 */
export class SyncDataSourceStack extends Construct {
  readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: CrawlerEventbridgeProps) {
    super(scope, id);
    const stackName = 'SyncDataSource'

    const lamdbaRole = new Role(this, `${SolutionInfo.SOLUTION_NAME_ABBR}${stackName}Role`, {
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}RoleForCrawlerEvent-${Aws.REGION}`,
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });
    lamdbaRole.attachInlinePolicy(new Policy(this, `${SolutionInfo.SOLUTION_NAME_ABBR}${stackName}Policy`, {
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

    const syncDataSourceLambda = new Function(this, `${SolutionInfo.SOLUTION_NAME_ABBR}${stackName}Function`, {
      role: lamdbaRole,
      code: Code.fromAsset(path.join(__dirname, '../../api/lambda')),
      handler: "sync_data_source.lambda_handler",
      runtime: Runtime.PYTHON_3_9,
      memorySize: 256,
      // environment: {
      //   ADMIN_ACCOUNT: props.adminAccountId,
      //   QUEUE: props.queueName,
      // }
    });

    const rule = new Rule(this, `${SolutionInfo.SOLUTION_NAME_ABBR}${stackName}Rule`, {
      schedule: Schedule.expression("cron(0 23 * * ? *)"),
    });
    rule.addTarget(new LambdaFunction(syncDataSourceLambda));

  }
}
