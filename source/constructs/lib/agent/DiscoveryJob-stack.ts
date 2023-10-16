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
    this.createUnstructuredCrawlerFunction();
    this.createUnstructuredParserRole();

    const discoveryJobRole = new Role(this, 'DiscoveryJobRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME}DiscoveryJobRole-${Aws.REGION}`, //Name must be specified
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
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: [
            'sagemaker:CreateProcessingJob',
            'sagemaker:DescribeProcessingJob',
            'sagemaker:AddTags',
            'lambda:InvokeFunction',
            'states:StartExecution',
            'states:DescribeExecution',
            'states:StopExecution',
            'sqs:SendMessage',
          ],
          resources: [
            `arn:${Aws.PARTITION}:sagemaker:${Aws.REGION}:${Aws.ACCOUNT_ID}:processing-job/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:states:${Aws.REGION}:${Aws.ACCOUNT_ID}:stateMachine:${SolutionInfo.SOLUTION_NAME}-DiscoveryJob-*`,
            `arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${props.adminAccountId}:${SolutionInfo.SOLUTION_NAME}-DiscoveryJob`,
          ],
        }),
      ],
    }));

    // State machine log group
    // const logGroup = new logs.LogGroup(this, 'LogGroup', {
    //   retention: logs.RetentionDays.ONE_MONTH,
    //   logGroupName: `/aws/vendedlogs/states/${SolutionInfo.SOLUTION_NAME}LogGroup`,
    //   removalPolicy: RemovalPolicy.DESTROY,
    // });

    let jsonDiscoveryJob = fs.readFileSync('lib/agent/DiscoveryJob.json').toString();
    jsonDiscoveryJob = Fn.sub(jsonDiscoveryJob);
    const stepFunction = new sfn.CfnStateMachine(
      this,
      'StateMachine',
      {
        roleArn: discoveryJobRole.roleArn,
        definitionString: jsonDiscoveryJob,
        stateMachineName: `${SolutionInfo.SOLUTION_NAME}-DiscoveryJob`, //Name must be specified
        // loggingConfiguration: {
        //   destinations: [{
        //     cloudWatchLogsLogGroup: {
        //       logGroupArn: logGroup.logGroupArn,
        //     },
        //   }],
        //   includeExecutionData: true,
        //   level: 'ALL',
        // },
        tags: [{ key: 'Version', value: SolutionInfo.SOLUTION_VERSION }],
      },
    );
    stepFunction.node.addDependency(discoveryJobRole);
  }

  private createSplitJobFunction() {
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

  private createUnstructuredCrawlerFunction() {
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
          resources: [`arn:${Aws.PARTITION}:s3:::${SolutionInfo.SOLUTION_AGENT_S3_BUCKET}-${Aws.ACCOUNT_ID}-${Aws.REGION}/*`],
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
      timeout: Duration.minutes(1),
      role: unstructuredCrawlerRole,
    });
  }

  private createUnstructuredParserRole() {
    const unstructuredParserRole = new Role(this, 'UnstructuredParserRole', {
      roleName: `${SolutionInfo.SOLUTION_NAME}UnstructuredParserRole-${Aws.REGION}`, //Name must be specified
      assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
    });

    // Copy from AmazonS3FullAccess, do not modify
    unstructuredParserRole.attachInlinePolicy(new Policy(this, 'AmazonS3FullAccessPolicy', {
      policyName: 'AmazonS3FullAccessPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:*',
            's3-object-lambda:*',
          ],
          resources: ['*'],
        }),
      ],
    }));
    // Copy from AmazonSageMakerFullAccess, do not modify
    unstructuredParserRole.attachInlinePolicy(new Policy(this, 'AmazonSageMakerFullAccessPolicy', {
      policyName: 'AmazonSageMakerFullAccessPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'sagemaker:*',
          ],
          notResources: [
            `arn:${Aws.PARTITION}:sagemaker:*:*:domain/*`,
            `arn:${Aws.PARTITION}:sagemaker:*:*:user-profile/*`,
            `arn:${Aws.PARTITION}:sagemaker:*:*:app/*`,
            `arn:${Aws.PARTITION}:sagemaker:*:*:flow-definition/*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'sagemaker:CreatePresignedDomainUrl',
            'sagemaker:DescribeDomain',
            'sagemaker:ListDomains',
            'sagemaker:DescribeUserProfile',
            'sagemaker:ListUserProfiles',
            'sagemaker:*App',
            'sagemaker:ListApps',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'sagemaker:*',
          ],
          resources: [`arn:${Aws.PARTITION}:sagemaker:*:*:flow-definition/*`],
          conditions: {
            StringEqualsIfExists: {
              'sagemaker:WorkteamType': [
                'private-crowd',
                'vendor-crowd',
              ],
            },
          },
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'application-autoscaling:DeleteScalingPolicy',
            'application-autoscaling:DeleteScheduledAction',
            'application-autoscaling:DeregisterScalableTarget',
            'application-autoscaling:DescribeScalableTargets',
            'application-autoscaling:DescribeScalingActivities',
            'application-autoscaling:DescribeScalingPolicies',
            'application-autoscaling:DescribeScheduledActions',
            'application-autoscaling:PutScalingPolicy',
            'application-autoscaling:PutScheduledAction',
            'application-autoscaling:RegisterScalableTarget',
            'aws-marketplace:ViewSubscriptions',
            'cloudformation:GetTemplateSummary',
            'cloudwatch:DeleteAlarms',
            'cloudwatch:DescribeAlarms',
            'cloudwatch:GetMetricData',
            'cloudwatch:GetMetricStatistics',
            'cloudwatch:ListMetrics',
            'cloudwatch:PutMetricAlarm',
            'cloudwatch:PutMetricData',
            'codecommit:BatchGetRepositories',
            'codecommit:CreateRepository',
            'codecommit:GetRepository',
            'codecommit:List*',
            'cognito-idp:AdminAddUserToGroup',
            'cognito-idp:AdminCreateUser',
            'cognito-idp:AdminDeleteUser',
            'cognito-idp:AdminDisableUser',
            'cognito-idp:AdminEnableUser',
            'cognito-idp:AdminRemoveUserFromGroup',
            'cognito-idp:CreateGroup',
            'cognito-idp:CreateUserPool',
            'cognito-idp:CreateUserPoolClient',
            'cognito-idp:CreateUserPoolDomain',
            'cognito-idp:DescribeUserPool',
            'cognito-idp:DescribeUserPoolClient',
            'cognito-idp:List*',
            'cognito-idp:UpdateUserPool',
            'cognito-idp:UpdateUserPoolClient',
            'ec2:CreateNetworkInterface',
            'ec2:CreateNetworkInterfacePermission',
            'ec2:CreateVpcEndpoint',
            'ec2:DeleteNetworkInterface',
            'ec2:DeleteNetworkInterfacePermission',
            'ec2:DescribeDhcpOptions',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DescribeRouteTables',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeSubnets',
            'ec2:DescribeVpcEndpoints',
            'ec2:DescribeVpcs',
            'ecr:BatchCheckLayerAvailability',
            'ecr:BatchGetImage',
            'ecr:CreateRepository',
            'ecr:Describe*',
            'ecr:GetAuthorizationToken',
            'ecr:GetDownloadUrlForLayer',
            'ecr:StartImageScan',
            'elastic-inference:Connect',
            'elasticfilesystem:DescribeFileSystems',
            'elasticfilesystem:DescribeMountTargets',
            'fsx:DescribeFileSystems',
            'glue:CreateJob',
            'glue:DeleteJob',
            'glue:GetJob*',
            'glue:GetTable*',
            'glue:GetWorkflowRun',
            'glue:ResetJobBookmark',
            'glue:StartJobRun',
            'glue:StartWorkflowRun',
            'glue:UpdateJob',
            'groundtruthlabeling:*',
            'iam:ListRoles',
            'kms:DescribeKey',
            'kms:ListAliases',
            'lambda:ListFunctions',
            'logs:CreateLogDelivery',
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:DeleteLogDelivery',
            'logs:Describe*',
            'logs:GetLogDelivery',
            'logs:GetLogEvents',
            'logs:ListLogDeliveries',
            'logs:PutLogEvents',
            'logs:PutResourcePolicy',
            'logs:UpdateLogDelivery',
            'robomaker:CreateSimulationApplication',
            'robomaker:DescribeSimulationApplication',
            'robomaker:DeleteSimulationApplication',
            'robomaker:CreateSimulationJob',
            'robomaker:DescribeSimulationJob',
            'robomaker:CancelSimulationJob',
            'secretsmanager:ListSecrets',
            'servicecatalog:Describe*',
            'servicecatalog:List*',
            'servicecatalog:ScanProvisionedProducts',
            'servicecatalog:SearchProducts',
            'servicecatalog:SearchProvisionedProducts',
            'sns:ListTopics',
            'tag:GetResources',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'ecr:SetRepositoryPolicy',
            'ecr:CompleteLayerUpload',
            'ecr:BatchDeleteImage',
            'ecr:UploadLayerPart',
            'ecr:DeleteRepositoryPolicy',
            'ecr:InitiateLayerUpload',
            'ecr:DeleteRepository',
            'ecr:PutImage',
          ],
          resources: [`arn:${Aws.PARTITION}:ecr:*:*:repository/*sagemaker*`],
        }),
        // From here down, there is no copy
      ],
    }));
    // Copy from AWSGlueServiceRole, do not modify
    unstructuredParserRole.attachInlinePolicy(new Policy(this, 'AWSGlueServicePolicy2', {
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
  }
}
