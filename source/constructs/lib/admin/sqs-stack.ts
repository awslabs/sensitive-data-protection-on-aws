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
  Duration,
} from 'aws-cdk-lib';
import { PolicyStatement, Effect, AccountRootPrincipal, AnyPrincipal } from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';

export interface SqsProps {
  name: string;
  visibilityTimeout?: number;
}

export class SqsStack extends Construct {
  readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsProps) {
    super(scope, id);

    const dlq = new sqs.Queue(scope, `${props.name}DLQ`, {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: Duration.days(14),
      visibilityTimeout: Duration.hours(10),
    });
    this.queue = new sqs.Queue(scope, `${props.name}QueueActual`, {
      queueName: `${SolutionInfo.SOLUTION_NAME}-${props.name}`, //Name must be specified
      visibilityTimeout: Duration.seconds(props.visibilityTimeout ?? 30),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 50,
      },
    });
    this.queue.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.DENY,
        principals: [new AnyPrincipal()],
        actions: ['sqs:*'],
        resources: ['*'],
        conditions: {
          Bool: { 'aws:SecureTransport': 'false' },
        },
      }),
    );
    const myselfStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'sqs:ReceiveMessage',
        'sqs:ChangeMessageVisibility',
        'sqs:GetQueueUrl',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
        'sqs:SetQueueAttributes',
      ],
      resources: [this.queue.queueArn],
      principals: [new AccountRootPrincipal()],
    });
    this.queue.addToResourcePolicy(myselfStatement);
  }
}