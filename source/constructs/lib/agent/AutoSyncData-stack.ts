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

import { Aws } from 'aws-cdk-lib';
import {
  Effect,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';


export interface AutoSyncDataProps {
  adminAccountId: string;
  queueName: string;
}

/**
 * Auto sync data in agent account and send SQS messages to notify admin account
 */
export class AutoSyncDataStack extends Construct {

  constructor(scope: Construct, id: string, props: AutoSyncDataProps) {
    super(scope, id);

    const lamdbaRole = new Role(this, `${SolutionInfo.SOLUTION_NAME_ABBR}RoleForCrawlerEvent`, {
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}RoleForAutoSyncData-${Aws.REGION}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    lamdbaRole.attachInlinePolicy(new Policy(this, 'AutoSyncDataLambdaPolicy', {
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
        `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${props.adminAccountId}:${props.queueName}`,
      ],
      actions: [
        'sqs:SendMessage',
      ],
    }));
  }
}
