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
import path from 'path';
import {
  aws_stepfunctions as sfn,
  aws_logs as logs,
  Aws,
  Fn,
  RemovalPolicy,
  Duration,
} from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import {
  PolicyStatement,
  Role,
  ServicePrincipal,
  Policy,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import { Code, LayerVersion, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { BuildConfig } from '../common/build-config';
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

    this.createFunction();

    let jsonDiscoveryJobEntry = fs.readFileSync('lib/agent/DiscoveryJob-Entry.json').toString();
    jsonDiscoveryJobEntry = Fn.sub(jsonDiscoveryJobEntry);
    let jsonDiscoveryJobStructured = fs.readFileSync('lib/agent/DiscoveryJob-Structured.json').toString();
    jsonDiscoveryJobStructured = Fn.sub(jsonDiscoveryJobStructured);
    let jsonDiscoveryJobUnstructured = fs.readFileSync('lib/agent/DiscoveryJob-Unstructured.json').toString();
    jsonDiscoveryJobUnstructured = Fn.sub(jsonDiscoveryJobUnstructured);

    const discoveryJobRole = new Role(this, 'DiscoveryJobRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}DiscoveryJobRole-${Aws.REGION}`, //Name must be specified
    });

    // Copy from AWSGlueServiceRole, do not modify
    discoveryJobRole.attachInlinePolicy(new Policy(this, 'AWSGlueServicePolicy', {
      policyName: 'AWSGlueServicePolicy',
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

    discoveryJobRole.attachInlinePolicy(new Policy(this, 'DiscoveryJobPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME_ABBR}DiscoveryJobPolicy`,
      statements: [
        new PolicyStatement({
          actions: [
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords',
            'xray:GetSamplingRules',
            'xray:GetSamplingTargets',
            'events:*',
            'logs:*',
            'events:PutTargets',
            'events:PutRule',
            'events:DescribeRule',
          ],
          resources: ['*'],
        }),
        // new PolicyStatement({
        //   actions: [
        //     'iam:PassRole',
        //   ],
        //   resources: ['*'],
        // }),
        new PolicyStatement({
          actions: [
            'sagemaker:CreateProcessingJob',
            'sagemaker:DescribeProcessingJob',
            'lambda:InvokeFunction',
            'states:StartExecution',
            'states:DescribeExecution',
            'states:StopExecution',
            'sqs:SendMessage',
          ],
          resources: [
            `arn:${Aws.PARTITION}:sagemaker:${Aws.REGION}:${Aws.ACCOUNT_ID}:processing-job/${SolutionInfo.SOLUTION_NAME_ABBR}-*`,
            `arn:${Aws.PARTITION}:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:${SolutionInfo.SOLUTION_NAME_ABBR}-*`,
            `arn:${Aws.PARTITION}:states:${Aws.REGION}:${Aws.ACCOUNT_ID}:stateMachine:${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob-*`,
            `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${props.adminAccountId}:${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob`,
          ],
        }),
      ],
    }));

    // State machine log group
    const logGroupEntry = new logs.LogGroup(this, 'EntryLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      logGroupName: '/aws/vendedlogs/states/SDPSLogGroupEntry',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const stepFunctionEntry = new sfn.CfnStateMachine(
      this,
      'EntryStateMachine',
      {
        roleArn: discoveryJobRole.roleArn,
        definitionString: jsonDiscoveryJobEntry,
        stateMachineName: `${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob-Entry`, //Name must be specified
        // loggingConfiguration: {
        //   destinations: [{
        //     cloudWatchLogsLogGroup: {
        //       logGroupArn: logGroupEntry.logGroupArn,
        //     },
        //   }],
        //   includeExecutionData: true,
        //   level: 'ALL',
        // },
        tags: [{ key: 'Version', value: SolutionInfo.SOLUTION_VERSION }],
      },
    );
    stepFunctionEntry.node.addDependency(discoveryJobRole);

    const logGroupStructured = new logs.LogGroup(this, 'StructuredLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      logGroupName: '/aws/vendedlogs/states/SDPSLogGroupStructured',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const stepFunctionStructured = new sfn.CfnStateMachine(
      this,
      'StructuredStateMachine',
      {
        roleArn: discoveryJobRole.roleArn,
        definitionString: jsonDiscoveryJobStructured,
        stateMachineName: `${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob`, //Name must be specified
        // loggingConfiguration: {
        //   destinations: [{
        //     cloudWatchLogsLogGroup: {
        //       logGroupArn: logGroupStructured.logGroupArn,
        //     },
        //   }],
        //   includeExecutionData: true,
        //   level: 'ALL',
        // },
        tags: [{ key: 'Version', value: SolutionInfo.SOLUTION_VERSION }],
      },
    );
    stepFunctionStructured.node.addDependency(discoveryJobRole);

    const logGroupUnstructured = new logs.LogGroup(this, 'UnstructuredLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      logGroupName: '/aws/vendedlogs/states/SDPSLogGroupUnstructured',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const stepFunctionUnstructured = new sfn.CfnStateMachine(
      this,
      'UnstructuredStateMachine',
      {
        roleArn: discoveryJobRole.roleArn,
        definitionString: jsonDiscoveryJobUnstructured,
        stateMachineName: `${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob-Unstructured`, //Name must be specified
        // loggingConfiguration: {
        //   destinations: [{
        //     cloudWatchLogsLogGroup: {
        //       logGroupArn: logGroupUnstructured.logGroupArn,
        //     },
        //   }],
        //   includeExecutionData: true,
        //   level: 'ALL',
        // },
        tags: [{ key: 'Version', value: SolutionInfo.SOLUTION_VERSION }],
      },
    );
    stepFunctionUnstructured.node.addDependency(discoveryJobRole);
  }

  private createFunction() {
    const splitJobLayer = new LayerVersion(this, 'SplitJobLayer', {
      code: Code.fromAsset(path.join(__dirname, './split-job'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${BuildConfig.PIP_MIRROR_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      // layerVersionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-SplitJob`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_NAME} - SplitJob layer`,
    });

    const splitJobRole = new Role(this, 'SplitJobRole', {
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}SplitJobRole-${Aws.REGION}`, //Name must be specified
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    splitJobRole.attachInlinePolicy(new Policy(this, 'SplitJobCommonPolicy', {
      policyName: 'SplitJobPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'glue:GetTables',
          ],
          resources: ['*'],
        }),
      ],
    }));

    splitJobRole.attachInlinePolicy(new Policy(this, 'SplitJobLogPolicy', {
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

    new Function(this, 'SplitJobFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-SplitJob`, //Name must be specified
      description: `${SolutionInfo.SOLUTION_NAME} - split job`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'split_job.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './split-job')),
      timeout: Duration.minutes(1),
      layers: [splitJobLayer],
      role: splitJobRole,
    });
  }
}
