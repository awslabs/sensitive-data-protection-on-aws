import { Construct } from 'constructs';
import { PolicyStatement, Effect, AccountRootPrincipal, AnyPrincipal } from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SolutionInfo } from '../common/solution-info';
import {
  Duration,
} from 'aws-cdk-lib';

export interface SqsProps {
  name: string;
  visibilityTimeout?: number;
}

export class SqsStack extends Construct {
  readonly queue: sqs.Queue;
  readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsProps) {
    super(scope, id);

    this.dlq = new sqs.Queue(scope, `${props.name}DLQ`, {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: Duration.days(14),
      "visibilityTimeout": Duration.hours(10),
    });
    this.queue = new sqs.Queue(scope, `${props.name}QueueActual`, {
      "queueName": `${SolutionInfo.SOLUTION_NAME_ABBR}-${props.name}`,
      "visibilityTimeout": Duration.seconds(props.visibilityTimeout ?? 30),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 50,
      },
    });
    this.queue.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.DENY,
        principals: [new AnyPrincipal()],
        actions: ["sqs:*"],
        resources: ["*"],
        conditions: {
          Bool: { "aws:SecureTransport": "false" }
        }
      })
    );
    const myselfStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "sqs:ReceiveMessage",
        "sqs:ChangeMessageVisibility",
        "sqs:GetQueueUrl",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:SetQueueAttributes"],
      resources: [this.queue.queueArn],
      principals: [new AccountRootPrincipal()]
    })
    this.queue.addToResourcePolicy(myselfStatement);
  }
}