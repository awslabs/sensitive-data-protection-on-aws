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

import { Stack, StackProps, Aws, CfnParameter, aws_s3 as s3, Tags } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CrawlerEventbridgeStack } from './agent/CrawlerEventbridge-stack';
import { DeleteAgentResourcesStack } from './agent/DeleteAgentResources-stack';
import { DiscoveryJobStack } from './agent/DiscoveryJob-stack';
import { SolutionInfo } from './common/solution-info';

// Operator agent stack
export class AgentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.templateOptions.description = SolutionInfo.AGENT_DESCRIPTION;

    const trustedRoleName = `${SolutionInfo.SOLUTION_NAME_ABBR}APIRole`;

    const adminAccountIdParameter = new CfnParameter(this, 'AdminAccountId', {
      type: 'String',
      description: 'The account id of Admin',
      allowedPattern:
        '\\d{12}',
    });
    const adminAccountId = adminAccountIdParameter.valueAsString;

    new DiscoveryJobStack(this, 'DiscoveryJobStateMachine', {
      adminAccountId: adminAccountId,
    });

    new CrawlerEventbridgeStack(this, 'CrawlerEventbridge', {
      adminAccountId: adminAccountId,
      queueName: `${SolutionInfo.SOLUTION_NAME_ABBR}-Crawler`,
    });

    //update the trusted entities to trusted role from user input
    const trustedRoleARN = `arn:${Aws.PARTITION}:iam::${adminAccountId}:role/${trustedRoleName}*`;
    const roleForAdmin = new iam.Role(this, 'RoleForAdmin', {
      assumedBy: new iam.PrincipalWithConditions(new iam.AccountPrincipal(adminAccountId), { StringLike: { 'aws:PrincipalArn': trustedRoleARN } }),
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}RoleForAdmin-${Aws.REGION}`,
    });

    roleForAdmin.attachInlinePolicy(new iam.Policy(this, 'PolicyForAdmin', {
      policyName: `${SolutionInfo.SOLUTION_NAME_ABBR}PolicyForAdmin`,
      statements: [new iam.PolicyStatement({
        actions: [
          'glue:CreateJob',
          'iam:PassRole',
          'glue:GetJob',
          'lambda:CreateFunction',
          'lambda:DeleteFunction',
          'lambda:GetFunction',
          'lambda:InvokeFunction',
          'ec2:CreateVpcEndpoint',
          'ec2:DeleteVpcEndpoints',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeNatGateways',
          'ec2:DescribeVpcEndpoints',
          'ec2:DescribeRouteTables',
          'secretsmanager:ListSecrets',
          'secretsmanager:GetSecretValue',
          'kms:Decrypt',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      }),
      new iam.PolicyStatement({
        actions: [
          'states:DescribeExecution',
          'states:GetExecutionHistory',
          'states:StartExecution',
          'states:StopExecution',
          'states:UpdateStateMachine',
          'states:DeleteStateMachine',
          'states:CreateStateMachine',
          'states:TagResource',
        ],
        resources: [
          `arn:${Aws.PARTITION}:states:*:${Aws.ACCOUNT_ID}:stateMachine:${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob`,
          `arn:${Aws.PARTITION}:states:*:${Aws.ACCOUNT_ID}:execution:${SolutionInfo.SOLUTION_NAME_ABBR}-DiscoveryJob:*`,
        ],
      })],
    }));

    //attach necessary policy to the role
    roleForAdmin.attachInlinePolicy(new iam.Policy(this, 'AmazonS3ReadOnlyAccessPolicy', {
      policyName: 'AmazonS3ReadOnlyAccessPolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:Get*',
            's3:List*',
            's3-object-lambda:Get*',
            's3-object-lambda:List*',
          ],
          resources: ['*'],
        }),
      ],
    }));
    roleForAdmin.attachInlinePolicy(new iam.Policy(this, 'AmazonRDSReadOnlyAccessPolicy', {
      policyName: 'AmazonRDSReadOnlyAccessPolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds:Describe*',
            'rds:ListTagsForResource',
            'ec2:DescribeAccountAttributes',
            'ec2:DescribeAvailabilityZones',
            'ec2:DescribeInternetGateways',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeSubnets',
            'ec2:DescribeVpcAttribute',
            'ec2:DescribeVpcs',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cloudwatch:GetMetricStatistics',
            'logs:DescribeLogStreams',
            'logs:GetLogEvents',
          ],
          resources: ['*'],
        }),
      ],
    }));
    roleForAdmin.attachInlinePolicy(new iam.Policy(this, 'AWSLakeFormationDataAdminPolicy', {
      policyName: 'AWSLakeFormationDataAdmin',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'lakeformation:*',
            'cloudtrail:DescribeTrails',
            'cloudtrail:LookupEvents',
            'glue:GetDatabase',
            'glue:GetDatabases',
            'glue:CreateDatabase',
            'glue:UpdateDatabase',
            'glue:DeleteDatabase',
            'glue:GetConnections',
            'glue:SearchTables',
            'glue:GetTable',
            'glue:CreateTable',
            'glue:UpdateTable',
            'glue:DeleteTable',
            'glue:GetTableVersions',
            'glue:GetPartitions',
            'glue:GetTables',
            'glue:GetWorkflow',
            'glue:ListWorkflows',
            'glue:BatchGetWorkflows',
            'glue:DeleteWorkflow',
            'glue:GetWorkflowRuns',
            'glue:StartWorkflowRun',
            'glue:GetWorkflow',
            's3:ListBucket',
            's3:GetBucketLocation',
            's3:ListAllMyBuckets',
            's3:GetBucketAcl',
            'iam:ListUsers',
            'iam:ListRoles',
            'iam:GetRole',
            'iam:GetRolePolicy',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            'lakeformation:PutDataLakeSettings',
          ],
          resources: ['*'],
        }),
      ],
    }));
    const policy = new iam.Policy(this, 'senstive-data-glue-policy', {
      policyName: 'senstive-data-glue-policy',
      statements: [
        new iam.PolicyStatement({
          actions: [
            'logs:GetLogRecord',
            'glue:GetConnection',
            'glue:CreateConnection',
            'glue:DeleteConnection',
            'glue:GetCrawlers',
            'glue:GetClassifiers',
            'glue:CheckSchemaVersionValidity',
            'glue:CreateClassifier',
            'logs:GetLogDelivery',
            'logs:ListLogDeliveries',
            'glue:GetSecurityConfiguration',
            'glue:CreateJob',
            'glue:GetJobBookmark',
            'glue:StopCrawlerSchedule',
            'logs:DescribeQueryDefinitions',
            'glue:GetClassifier',
            'logs:DescribeResourcePolicies',
            'logs:DescribeDestinations',
            'glue:GetCustomEntityType',
            'logs:DescribeQueries',
            'glue:GetJobs',
            'glue:GetTriggers',
            'logs:StopQuery',
            'logs:TestMetricFilter',
            'glue:GetSecurityConfigurations',
            'logs:PutQueryDefinition',
            'glue:CreateCrawler',
            'glue:GetMapping',
            'logs:CreateLogDelivery',
            'glue:UpdateCrawlerSchedule',
            'glue:GetDevEndpoints',
            'logs:DescribeExportTasks',
            'glue:GetDataflowGraph',
            'logs:GetQueryResults',
            'glue:StartCrawlerSchedule',
            'glue:BatchGetCustomEntityTypes',
            'glue:GetPlan',
            'glue:GetCrawlerMetrics',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: [
            'glue:BatchCreatePartition',
            'glue:SearchTables',
            'glue:CreatePartitionIndex',
            'glue:GetCrawler',
            'glue:GetDataCatalogEncryptionSettings',
            'glue:GetTableVersions',
            'glue:GetPartitions',
            'glue:UpdateTable',
            'logs:DescribeSubscriptionFilters',
            'logs:StartQuery',
            'logs:DescribeMetricFilters',
            'glue:UpdateCrawler',
            'glue:GetSchema',
            'glue:GetResourcePolicy',
            'logs:CreateLogStream',
            'glue:GetTrigger',
            'glue:GetUserDefinedFunction',
            'glue:GetColumnStatisticsForTable',
            'glue:GetJobRun',
            'glue:GetResourcePolicies',
            'logs:FilterLogEvents',
            'glue:GetUserDefinedFunctions',
            'glue:GetSchemaByDefinition',
            'glue:UpdateDatabase',
            'glue:GetTables',
            'glue:CreateTable',
            'glue:DeleteCrawler',
            'glue:GetSchemaVersionsDiff',
            'glue:UpdateSchema',
            'glue:BatchStopJobRun',
            'glue:CreateConnection',
            'logs:CreateLogGroup',
            'glue:GetPartitionIndexes',
            'logs:PutMetricFilter',
            'glue:GetPartition',
            'glue:BatchGetJobs',
            'glue:CreateSchema',
            'glue:StartJobRun',
            'glue:DeletePartition',
            'glue:GetJob',
            'logs:ListTagsLogGroup',
            'glue:GetConnections',
            'logs:DescribeLogStreams',
            'glue:BatchDeletePartition',
            'glue:StopCrawler',
            'glue:DeleteJob',
            'glue:GetCatalogImportStatus',
            'glue:DeletePartitionIndex',
            'iam:PassRole',
            'glue:GetTableVersion',
            'glue:GetConnection',
            'glue:StartCrawler',
            'glue:UpdateJob',
            'glue:CreatePartition',
            'glue:UpdatePartition',
            'glue:BatchUpdatePartition',
            'logs:DescribeLogGroups',
            'glue:BatchGetPartition',
            'glue:GetDatabases',
            'glue:GetTags',
            'glue:GetTable',
            'glue:GetDatabase',
            'glue:BatchGetCrawlers',
            'glue:GetSchemaVersion',
            'glue:BatchGetTriggers',
            'glue:CreateDatabase',
            'logs:GetLogGroupFields',
            'glue:GetColumnStatisticsForPartition',
            'glue:GetJobRuns',
          ],
          resources: [
            `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:table/*/*`,
            `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:database/*`,
            `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:job/*`,
            `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:catalog`,
            `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:trigger/*`,
            `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:schema/*`,
            `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:crawler/*`,
            `arn:${Aws.PARTITION}:logs:*:${Aws.ACCOUNT_ID}:log-group:*`,
            `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:role/*`,
          ],
        }),
        new iam.PolicyStatement({
          actions: [
            'logs:GetLogEvents',
            'logs:PutLogEvents',
          ],
          resources: [
            `arn:${Aws.PARTITION}:logs:*:${Aws.ACCOUNT_ID}:log-group:*:log-stream:*`,
          ],
        }),
      ],
    });

    roleForAdmin.attachInlinePolicy(policy);

    const glueDetectionJobRole = new iam.Role(this, 'GlueDetectionJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}GlueDetectionJobRole-${Aws.REGION}`,
    });
    glueDetectionJobRole.attachInlinePolicy(new iam.Policy(this, 'GlueDetectionJobPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME_ABBR}GlueDetectionJobPolicy`,
      statements: [new iam.PolicyStatement({
        actions: [
          'lakeformation:*',
          's3:ListBucket',
          's3:GetObject',
          's3:PutObject',
          'glue:CreateTable',
          'glue:UpdateTable',
          'glue:GetDatabase',
          'glue:GetTables',
          'glue:GetTable',
          'glue:GetConnection',
          'glue:GetPartitions',
          'glue:BatchCreatePartition',
          'glue:BatchGetPartition',
          'glue:BatchGetCustomEntityTypes',
          'ec2:DescribeVpcEndpoints',
          'ec2:DescribeRouteTables',
          'ec2:CreateNetworkInterface',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeSubnets',
          'ec2:DescribeVpcAttribute',
          'secretsmanager:GetSecretValue',
          'kms:Decrypt',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      }),
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [`arn:${Aws.PARTITION}:logs:*:*:/aws-glue/*`],
      }),
      new iam.PolicyStatement({
        actions: [
          'ec2:CreateTags',
          'ec2:DeleteTags',
        ],
        resources: [
          `arn:${Aws.PARTITION}:ec2:*:*:network-interface/*`,
          `arn:${Aws.PARTITION}:ec2:*:*:security-group/*`,
          `arn:${Aws.PARTITION}:ec2:*:*:instance/*`,
        ],
        conditions: {
          'ForAllValues:StringEquals': {
            'aws:TagKeys': [
              'aws-glue-service-resource',
            ],
          },
        },
      })],
    }));

    const lambdaRdsRole = new iam.Role(this, 'LambdaRdsRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}LambdaRdsRole-${Aws.REGION}`,
    });
    lambdaRdsRole.attachInlinePolicy(new iam.Policy(this, 'lambdaRdsPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME_ABBR}lambdaRdsPolicy`,
      statements: [new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
          'ec2:AssignPrivateIpAddresses',
          'ec2:UnassignPrivateIpAddresses',
        ],
        resources: ['*'],
      })],
    }));

    new DeleteAgentResourcesStack(this, 'DeleteAgentResources', {
      adminAccountId: adminAccountId,
    });

    Tags.of(this).add(SolutionInfo.TAG_KEY, SolutionInfo.TAG_VALUE);
  }
}
