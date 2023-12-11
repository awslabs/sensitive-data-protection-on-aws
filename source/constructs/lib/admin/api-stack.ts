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
  Duration,
  Tags,
} from 'aws-cdk-lib';
import {
  IVpc,
  SecurityGroup,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import {
  PolicyStatement,
  ServicePrincipal,
  Role,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import {
  Function,
  Runtime,
  Code,
  AssetCode,
  LayerVersion,
  FunctionOptions,
} from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import { SqsStack } from './sqs-stack';
import { BuildConfig } from '../common/build-config';
import { SolutionInfo } from '../common/solution-info';

export interface ApiProps {
  readonly vpc: IVpc;
  readonly bucketName: string;
  readonly rdsClientSecurityGroup: SecurityGroup;
  readonly oidcIssuer: string;
  readonly oidcClientId: string;
}


export class ApiStack extends Construct {
  readonly apiFunction: Function;
  private apiRole: Role;
  private apiLayer: LayerVersion;
  private code: AssetCode;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    this.apiRole = this.createRole(props.bucketName);
    this.apiLayer = this.createLayer();
    this.code = Code.fromAsset(path.join(__dirname, '../../api'), { exclude: ['venv', 'pytest'] });

    this.createFunction('Controller', 'lambda.controller.lambda_handler', props, 20, `${SolutionInfo.SOLUTION_NAME}-Controller`);

    this.apiFunction = this.createFunction('API', 'main.handler', props, 900);

    const checkRunFunction = this.createFunction('CheckRun', 'lambda.check_run.lambda_handler', props, 600);
    const checkRunRule = new events.Rule(this, 'CheckRunRule', {
      // ruleName: `${SolutionInfo.SOLUTION_NAME}-CheckRun`,
      schedule: events.Schedule.cron({ minute: '0/30' }),
    });
    checkRunRule.addTarget(new targets.LambdaFunction(checkRunFunction));
    Tags.of(checkRunRule).add(SolutionInfo.TAG_KEY, SolutionInfo.TAG_VALUE);

    const receiveJobInfoFunction = this.createFunction('ReceiveJobInfo', 'lambda.receive_job_info.lambda_handler', props, 900);
    const discoveryJobSqsStack = new SqsStack(this, 'DiscoveryJobQueue', { name: 'DiscoveryJob', visibilityTimeout: 900 });
    const discoveryJobEventSource = new SqsEventSource(discoveryJobSqsStack.queue);
    receiveJobInfoFunction.addEventSource(discoveryJobEventSource);

    const updateCatalogFunction = this.createFunction('UpdateCatalog', 'lambda.sync_crawler_results.lambda_handler', props, 900);
    const crawlerSqsStack = new SqsStack(this, 'CrawlerQueue', { name: 'Crawler', visibilityTimeout: 900 });
    const crawlerEventSource = new SqsEventSource(crawlerSqsStack.queue);
    updateCatalogFunction.addEventSource(crawlerEventSource);

    const autoSyncDataFunction = this.createFunction('AutoSyncData', 'lambda.auto_sync_data.lambda_handler', props, 900);
    // Set delivery delay to 10 minutes to wait for agent stack to be deleted
    const autoSyncDataSqsStack = new SqsStack(this, 'AutoSyncDataQueue', { name: 'AutoSyncData', visibilityTimeout: 900 });
    const autoSyncDataEventSource = new SqsEventSource(autoSyncDataSqsStack.queue);
    autoSyncDataFunction.addEventSource(autoSyncDataEventSource);

    this.createFunction('RefreshAccount', 'lambda.refresh_account.lambda_handler', props, 60, `${SolutionInfo.SOLUTION_NAME}-RefreshAccount`);
  }

  private createFunction(name: string, handler: string, props: ApiProps, timeout?: number, functionName?: string) {
    const myFunction = new Function(this, `${name}Function`, {
      // functionName: `${SolutionInfo.SOLUTION_NAME}-${name}`,
      functionName: functionName,
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - ${name}`,
      runtime: Runtime.PYTHON_3_9,
      handler: handler,
      code: this.code,
      memorySize: 3008,
      timeout: Duration.seconds(timeout ?? 20),
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      securityGroups: [props.rdsClientSecurityGroup],
      environment: {
        ProjectBucketName: props.bucketName,
        Version: SolutionInfo.SOLUTION_VERSION,
        OidcIssuer: props.oidcIssuer,
        OidcClientId: props.oidcClientId,
      },
      role: this.apiRole,
      layers: [this.apiLayer],
    });
    Tags.of(myFunction).add(SolutionInfo.TAG_NAME, name);
    return myFunction;
  }

  private createRole(bucketName: string) {
    const apiRole = new Role(this, 'APIRole', {
      roleName: `${SolutionInfo.SOLUTION_NAME}APIRole-${Aws.REGION}`, //Name must be specified
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    const basicStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    });
    apiRole.addToPolicy(basicStatement);

    const functionStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sqs:DeleteMessage',
        'sqs:ChangeMessageVisibility',
        'sqs:GetQueueUrl',
        'athena:StartQueryExecution',
        'events:EnableRule',
        'sqs:SendMessage',
        'sqs:ReceiveMessage',
        'events:PutRule',
        'athena:GetQueryResults',
        'sqs:GetQueueAttributes',
        'sqs:SetQueueAttributes',
        's3:ListBucket',
        'glue:CreateDatabase',
        'glue:GetDatabase',
        'glue:GetDatabases',
        'glue:CreateTable',
        'glue:UpdateTable',
        'glue:GetTable',
        'glue:GetTables',
        'glue:BatchCreatePartition',
        'glue:BatchDeletePartition',
        'glue:CreatePartition',
        'glue:UpdatePartition',
        'glue:DeletePartition',
        'glue:GetPartition',
        'glue:GetPartitions',
        'glue:BatchGetPartition',
        's3:PutObject',
        's3:DeleteObject',
        's3:GetObject',
        's3:GetBucketLocation',
        's3:PutBucketPolicy',
        's3:GetBucketPolicy',
        'events:TagResource',
        'events:PutTargets',
        'events:DeleteRule',
        'lambda:AddPermission',
        'secretsmanager:GetSecretValue',
        'athena:GetQueryExecution',
        'events:RemoveTargets',
        'lambda:RemovePermission',
        'events:UntagResource',
        'events:DisableRule'],
      resources: [`arn:${Aws.PARTITION}:lambda:*:${Aws.ACCOUNT_ID}:function:*`,
        `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${Aws.ACCOUNT_ID}:${SolutionInfo.SOLUTION_NAME}-DiscoveryJob`,
        `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${Aws.ACCOUNT_ID}:${SolutionInfo.SOLUTION_NAME}-Crawler`,
        `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${Aws.ACCOUNT_ID}:${SolutionInfo.SOLUTION_NAME}-AutoSyncData`,
        `arn:${Aws.PARTITION}:secretsmanager:${Aws.REGION}:${Aws.ACCOUNT_ID}:secret:${SolutionInfo.SOLUTION_NAME}-*`,
        `arn:${Aws.PARTITION}:s3:::${bucketName}/*`,
        `arn:${Aws.PARTITION}:s3:::${bucketName}`,
        `arn:${Aws.PARTITION}:athena:*:${Aws.ACCOUNT_ID}:workgroup/primary`,
        `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_GLUE_DATABASE}/*`,
        `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:database/${SolutionInfo.SOLUTION_GLUE_DATABASE}`,
        `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:catalog`,
        `arn:${Aws.PARTITION}:events:*:${Aws.ACCOUNT_ID}:rule/${SolutionInfo.SOLUTION_NAME}-*`],
    });
    apiRole.addToPolicy(functionStatement);

    const allStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'sts:AssumeRole',
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface',
        'ec2:DescribeSecurityGroups',
        'ec2:DescribeVpcs',
        'ec2:DescribeSubnets',
        'ec2:DescribeNatGateways',
        'ec2:DescribeAvailabilityZones',
        'secretsmanager:GetSecretValue',
      ],
      resources: ['*'],
    });
    apiRole.addToPolicy(allStatement);

    return apiRole;
  }

  private createLayer() {
    const apiLayer = new LayerVersion(this, 'APILayer', {
      code: Code.fromAsset(path.join(__dirname, '../../api'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${BuildConfig.PIP_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      // layerVersionName: `${SolutionInfo.SOLUTION_NAME}-API`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - API layer`,
    });
    return apiLayer;
  }
}