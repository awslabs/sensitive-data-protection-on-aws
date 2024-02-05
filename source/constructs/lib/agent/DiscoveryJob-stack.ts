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
  agentBucketName: string;
}

/**
 * Stack to provision a common State Machine to orchestrate CloudFromation Deployment Flow.
 * This flow is used as a Child flow and will notify result at the end to parent flow.
 * Therefore the input must contains a token.
 */
export class DiscoveryJobStack extends Construct {

  constructor(scope: Construct, id: string, props: DiscoveryJobProps) {
    super(scope, id);

    this.createSplitJobFunction();
    this.createUnstructuredCrawlerFunction(props);
    this.createUnstructuredParserRole(props);

    const discoveryJobRole = new Role(this, 'DiscoveryJobRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME}DiscoveryJobRole-${Aws.REGION}`, //Name must be specified
    });

    const discoveryJobPolicy = new Policy(this, 'DiscoveryJobPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME}DiscoveryJobPolicy`,
      statements: [
        new PolicyStatement({
          actions: [
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords',
            'xray:GetSamplingRules',
            'xray:GetSamplingTargets',
            'logs:*',
            'events:PutTargets',
            'events:PutRule',
            'events:DescribeRule',
            'iam:PassRole',
            'ec2:DescribeSubnets',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeVpcEndpoints',
            'ec2:DescribeRouteTables',
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: [
            'sagemaker:CreateProcessingJob',
            'sagemaker:DescribeProcessingJob',
            'sagemaker:AddTags',
            'lambda:InvokeFunction',
            'ssm:GetParameter',
            'sqs:SendMessage',
            'glue:GetCrawler',
            'glue:StartCrawler',
            'glue:StopCrawler',
            'glue:StartJobRun',
            'glue:StopJobRun',
            'glue:TagResource',
          ],
          resources: [
            `arn:${Aws.PARTITION}:sagemaker:${Aws.REGION}:${Aws.ACCOUNT_ID}:processing-job/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/${SolutionInfo.SOLUTION_NAME}-AgentBucketName`,
            `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${props.adminAccountId}:${SolutionInfo.SOLUTION_NAME}-DiscoveryJob`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:job/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:crawler/${SolutionInfo.SOLUTION_NAME}-*`,
          ],
        }),
      ],
    });
    discoveryJobRole.attachInlinePolicy(discoveryJobPolicy);

    // State machine log group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      logGroupName: `/aws/vendedlogs/states/${SolutionInfo.SOLUTION_NAME}LogGroup`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    let jsonDiscoveryJob = fs.readFileSync('lib/agent/DiscoveryJob.json').toString();
    jsonDiscoveryJob = Fn.sub(jsonDiscoveryJob);
    const stepFunction = new sfn.CfnStateMachine(
      this,
      'StateMachine',
      {
        roleArn: discoveryJobRole.roleArn,
        definitionString: jsonDiscoveryJob,
        stateMachineName: `${SolutionInfo.SOLUTION_NAME}-DiscoveryJob`, //Name must be specified
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
    // Must add DependsOn discoveryJobPolicy
    stepFunction.node.addDependency(discoveryJobPolicy, discoveryJobRole);
  }

  private createSplitJobFunction() {
    const splitJobLayer = new LayerVersion(this, 'SplitJobLayer', {
      code: Code.fromAsset(path.join(__dirname, './split-job'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${BuildConfig.PIP_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      // layerVersionName: `${SolutionInfo.SOLUTION_NAME}-SplitJob`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - SplitJob layer`,
    });

    const splitJobRole = new Role(this, 'SplitJobRole', {
      roleName: `${SolutionInfo.SOLUTION_NAME}SplitJobRole-${Aws.REGION}`, //Name must be specified
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
          resources: [`arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*/*`],
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
      functionName: `${SolutionInfo.SOLUTION_NAME}-SplitJob`, //Name must be specified
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - split job`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'split_job.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './split-job')),
      timeout: Duration.minutes(1),
      layers: [splitJobLayer],
      role: splitJobRole,
    });
  }

  private createUnstructuredCrawlerFunction(props: DiscoveryJobProps) {
    const unstructuredCrawlerRole = new Role(this, 'UnstructuredCrawlerRole', {
      roleName: `${SolutionInfo.SOLUTION_NAME}UnstructuredCrawlerRole-${Aws.REGION}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    unstructuredCrawlerRole.attachInlinePolicy(new Policy(this, 'UnstructuredCrawlerCommonPolicy', {
      policyName: 'UnstructuredCrawlerCommonPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:ListBucket',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:PutObject',
          ],
          resources: [`arn:${Aws.PARTITION}:s3:::${props.agentBucketName}/*`],
        }),
      ],
    }));

    unstructuredCrawlerRole.attachInlinePolicy(new Policy(this, 'UnstructuredCrawlerLogPolicy', {
      policyName: 'UnstructuredCrawlerLogPolicy',
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

    new Function(this, 'UnstructuredCrawlerFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME}-UnstructuredCrawler`, //Name must be specified
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - Unstructured Crawler`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'UnstructuredCrawler.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './unstructured-crawler')),
      timeout: Duration.minutes(15),
      role: unstructuredCrawlerRole,
    });
  }

  private createUnstructuredParserRole(props: DiscoveryJobProps) {
    const unstructuredParserRole = new Role(this, 'UnstructuredParserRole', {
      roleName: `${SolutionInfo.SOLUTION_NAME}UnstructuredParserRole-${Aws.REGION}`, //Name must be specified
      assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
    });

    unstructuredParserRole.attachInlinePolicy(new Policy(this, 'UnstructuredParsePolicy', {
      policyName: 'UnstructuredParsePolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:ListBucket',
            's3:GetObject',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'glue:CreateDatabase',
            'glue:GetDatabase',
            'glue:CreateTable',
            'glue:DeleteTable',
            'glue:DeleteTableVersion',
            'glue:UpdateTable',
            'glue:GetTables',
            'glue:GetTable',
            's3:PutObject',
          ],
          resources: [
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:database/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*/*`,
            `arn:${Aws.PARTITION}:s3:::${props.agentBucketName}/*`,
          ],
        }),
      ],
    }));
  }
}
