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
import {
  Arn,
  ArnFormat,
  Aws,
  aws_lambda as lambda,
  Duration,
  Size,
} from 'aws-cdk-lib';
import {
  PolicyStatement,
  ServicePrincipal,
  Role,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import {
  IVpc,
  Port,
  Peer,
  SecurityGroup,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import {
  Function,
  Runtime,
  Code,
  AssetCode,
  LayerVersion,
} from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { SolutionInfo } from '../common/solution-info';
import { SqsStack } from './sqs-stack';

export interface ApiProps {
  vpc: IVpc;
  bucketName: string;
  rdsClientSecurityGroup: SecurityGroup;
  // orgId: string;
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
    this.code = Code.fromAsset(path.join(__dirname, '../../api'), { exclude: ["venv"] });

    this.apiFunction = this.createFunction("API", "main.handler", props, 720);

    this.createFunction("Controller", "lambda.controller.lambda_handler",  props);

    const checkRunFunction = this.createFunction("CheckRun", "lambda.check_run.lambda_handler", props, 600);
    const checkRunRule = new events.Rule(this, 'CheckRunRule', {
      ruleName: `${SolutionInfo.SOLUTION_NAME_ABBR}-CheckRun`,
      schedule: events.Schedule.cron({ minute: '0/30' }),
    });
    checkRunRule.addTarget(new targets.LambdaFunction(checkRunFunction));

    const receiveJobInfoFunction = this.createFunction("ReceiveJobInfo", "lambda.receive_job_info.lambda_handler", props, 900);
    const discoveryJobSqsStack = new SqsStack(this, "DiscoveryJobQueue", { name: "DiscoveryJob", visibilityTimeout: 900 });
    const discoveryJobEventSource = new SqsEventSource(discoveryJobSqsStack.queue);
    receiveJobInfoFunction.addEventSource(discoveryJobEventSource);

    const updateCatalogFunction = this.createFunction("UpdateCatalog", "lambda.sync_crawler_results.lambda_handler", props, 900);
    const crawlerSqsStack = new SqsStack(this, "CrawlerQueue", { name: "Crawler", visibilityTimeout: 900});
    const crawlerEventSource = new SqsEventSource(crawlerSqsStack.queue);
    updateCatalogFunction.addEventSource(crawlerEventSource);
  }

  private createFunction(name: string, handler: string, props: ApiProps, timeout?: number) {
    const myFunction = new Function(this, `${name}Function`, {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-${name}`,
      description: `${SolutionInfo.SOLUTION_NAME} - ${name}`,
      runtime: Runtime.PYTHON_3_9,
      handler: handler,
      code: this.code,
      memorySize: 1024,
      timeout: Duration.seconds(timeout ?? 20),
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      securityGroups: [props.rdsClientSecurityGroup],
      environment: { "ProjectBucketName": props.bucketName },
      role: this.apiRole,
      layers: [this.apiLayer],
    });
    return myFunction;
  }

  private createRole(bucketName: string) {
    const apiRole = new Role(this, 'APIRole', {
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}APIRole`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    const basicStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
      ],
      resources: ["*"]
    });
    apiRole.addToPolicy(basicStatement);

    const functionStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility",
        "sqs:GetQueueUrl",
        "athena:StartQueryExecution",
        "events:EnableRule",
        "sqs:ReceiveMessage",
        "events:PutRule",
        "athena:GetQueryResults",
        "sqs:GetQueueAttributes",
        "sqs:SetQueueAttributes",
        "s3:ListBucket",
        "glue:CreateDatabase",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:CreateTable",
        "glue:UpdateTable",
        "glue:GetTable",
        "glue:GetTables",
        "glue:BatchCreatePartition",
        "glue:CreatePartition",
        "glue:UpdatePartition",
        "glue:GetPartition",
        "glue:GetPartitions",
        "glue:BatchGetPartition",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:GetBucketLocation",
        "s3:PutBucketPolicy",
        "s3:GetBucketPolicy",
        "events:TagResource",
        "events:PutTargets",
        "events:DeleteRule",
        "lambda:AddPermission",
        "secretsmanager:GetSecretValue",
        "athena:GetQueryExecution",
        "events:RemoveTargets",
        "lambda:RemovePermission",
        "events:UntagResource",
        "events:DisableRule"],
      resources: [`arn:${Aws.PARTITION}:lambda:*:${Aws.ACCOUNT_ID}:function:${SolutionInfo.SOLUTION_NAME_ABBR}-Controller`,
      `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${Aws.ACCOUNT_ID}:${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob`,
      `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${Aws.ACCOUNT_ID}:${SolutionInfo.SOLUTION_NAME_ABBR}-Crawler`,
      `arn:${Aws.PARTITION}:secretsmanager:${Aws.REGION}:${Aws.ACCOUNT_ID}:secret:${SolutionInfo.SOLUTION_NAME_ABBR}-*`,
      `arn:${Aws.PARTITION}:s3:::${bucketName}/*`,
      `arn:${Aws.PARTITION}:s3:::${bucketName}`,
      `arn:${Aws.PARTITION}:athena:*:${Aws.ACCOUNT_ID}:workgroup/primary`,
      `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_GLUE_DATABASE}/*`,
      `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:database/${SolutionInfo.SOLUTION_GLUE_DATABASE}`,
      `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:catalog`,
      `arn:${Aws.PARTITION}:events:*:${Aws.ACCOUNT_ID}:rule/${SolutionInfo.SOLUTION_NAME_ABBR}-*`,],
    })
    apiRole.addToPolicy(functionStatement);

    const allStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:CreateNetworkInterface",
        "sts:AssumeRole",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"],
      resources: ["*"],
    })
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
            `pip install -r requirements.txt ${SolutionInfo.PIP_MIRROR_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      layerVersionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-API`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_NAME} - API layer`,
    });
    return apiLayer;
  }
}