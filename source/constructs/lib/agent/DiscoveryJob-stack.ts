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

import * as fs from 'fs';
import {
  aws_stepfunctions as sfn,
  aws_logs as logs,
  Aws,
  Fn,
  RemovalPolicy,
} from 'aws-cdk-lib';
import {
  PolicyStatement,
  Role,
  ServicePrincipal,
  Policy,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';

export interface DiscoveryJobProps {
  adminAccountId: string;
}

/**
 * Stack to provision a common State Machine to orchestrate CloudFromation Deployment Flow.
 * This flow is used as a Child flow and will notify result at the end to parent flow.
 * Therefore the input must contains a token.
 */
export class DiscoveryJobStack extends Construct {

  constructor(scope: Construct, id: string, props: DiscoveryJobProps) {
    super(scope, id);
    let jsonDiscoveryJob = fs.readFileSync('lib/agent/DiscoveryJob.json').toString();
    jsonDiscoveryJob = Fn.sub(jsonDiscoveryJob);

    const discoveryJobRole = new Role(this, 'DiscoveryJobRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}DiscoveryJobRole-${Aws.REGION}`, //Name must be specified
    });
    discoveryJobRole.attachInlinePolicy(new Policy(this, 'AWSGlueServicePolicy', {
      // policyName: 'AWSGlueServicePolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'glue:*',
            's3:GetBucketLocation',
            's3:ListBucket',
            's3:ListAllMyBuckets',
            's3:GetBucketAcl',
            'ec2:DescribeVpcEndpoints',
            'ec2:DescribeRouteTables',
            'ec2:CreateNetworkInterface',
            'ec2:DeleteNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeSubnets',
            'ec2:DescribeVpcAttribute',
            'iam:ListRolePolicies',
            'iam:GetRole',
            'iam:GetRolePolicy',
            'cloudwatch:PutMetricData',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:CreateBucket'],
          resources: [
            `arn:${Aws.PARTITION}:s3:::aws-glue-*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
          ],
          resources: [
            `arn:${Aws.PARTITION}:s3:::aws-glue-*/*`,
            `arn:${Aws.PARTITION}:s3:::*/*aws-glue-*/*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:GetObject',
          ],
          resources: [
            `arn:${Aws.PARTITION}:s3:::crawler-public*`,
            `arn:${Aws.PARTITION}:s3:::aws-glue-*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: [
            `arn:${Aws.PARTITION}:logs:*:*:/aws-glue/*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'ec2:CreateTags',
            'ec2:DeleteTags',
          ],
          conditions: {
            StringEquals: {
              'aws:TagKeys': 'aws-glue-service-resource',
            },
          },
          resources: [
            `arn:${Aws.PARTITION}:ec2:*:*:network-interface/*`,
            `arn:${Aws.PARTITION}:ec2:*:*:security-group/*`,
            `arn:${Aws.PARTITION}:ec2:*:*:instance/*`,
          ],
        }),
      ],
    }));
    discoveryJobRole.addToPolicy(new PolicyStatement({
      actions: [
        'logs:CreateLogDelivery',
        'logs:GetLogDelivery',
        'logs:UpdateLogDelivery',
        'logs:DeleteLogDelivery',
        'logs:ListLogDeliveries',
        'logs:PutResourcePolicy',
        'logs:DescribeResourcePolicies',
        'logs:DescribeLogGroups',
        'lambda:InvokeFunction',
      ],
      effect: Effect.ALLOW,
      resources: ['*'],
    }));
    discoveryJobRole.attachInlinePolicy(new Policy(this, 'DiscoveryJobPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME_ABBR}DiscoveryJobPolicy`,
      statements: [new PolicyStatement({
        actions: ['xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets'],
        resources: ['*'],
      }),
      new PolicyStatement({
        actions: ['sqs:SendMessage'],
        resources: [`arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${props.adminAccountId}:${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob`],
      })],
    }));

    // State machine log group
    const logGroup = new logs.LogGroup(this, 'SFNLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const stepFunction = new sfn.CfnStateMachine(
      this,
      'cfnStepFunction',
      {
        roleArn: discoveryJobRole.roleArn,
        definitionString: jsonDiscoveryJob,
        stateMachineName: `${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob`, //Name must be specified
        loggingConfiguration: {
          destinations: [{
            cloudWatchLogsLogGroup: {
              logGroupArn: logGroup.logGroupArn,
            },
          }],
          includeExecutionData: true,
          level: 'ALL',
        },
        tags: [{ key: 'Version', value: SolutionInfo.SOLUTION_VERSION }],
      },
    );

    stepFunction.node.addDependency(discoveryJobRole);
  }
}
