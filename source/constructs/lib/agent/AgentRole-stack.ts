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

import { StackProps, Aws } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';

export interface AgentRoleProps extends StackProps {
  adminAccountId: string;
}

// Operator agent stack
export class AgentRoleStack extends Construct {
  constructor(scope: Construct, id: string, props: AgentRoleProps) {
    super(scope, id);

    //update the trusted entities to trusted role from user input
    const trustedRoleARN = `arn:${Aws.PARTITION}:iam::${props.adminAccountId}:role/${SolutionInfo.SOLUTION_NAME}APIRole*`;
    const roleForAdmin = new iam.Role(this, 'RoleForAdmin', {
      assumedBy: new iam.PrincipalWithConditions(new iam.AccountPrincipal(props.adminAccountId), { StringLike: { 'aws:PrincipalArn': trustedRoleARN } }),
      roleName: `${SolutionInfo.SOLUTION_NAME}RoleForAdmin-${Aws.REGION}`, //Name must be specified
    });

    roleForAdmin.attachInlinePolicy(new iam.Policy(this, 'PolicyForAdmin', {
      policyName: `${SolutionInfo.SOLUTION_NAME}PolicyForAdmin`,
      statements: [
        new iam.PolicyStatement({
          actions: [
            'iam:PassRole',
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
            'glue:GetCrawler',
            'glue:GetCrawlers',
            'glue:GetClassifier',
            'glue:GetClassifiers',
            'glue:CheckSchemaVersionValidity',
            'glue:CreateClassifier',
            'glue:GetSecurityConfiguration',
            'glue:GetSecurityConfigurations',
            'glue:StartCrawler',
            'glue:StopCrawler',
            'glue:GetConnection',
            'glue:GetConnections',
            'glue:UpdateConnection',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: [
            'glue:CreateJob',
            'glue:UpdateJob',
            'glue:DeleteJob',
            'glue:GetJob',
            'glue:CreateConnection',
            'glue:DeleteConnection',
            'glue:BatchDeleteTable',
            'glue:CreateCrawler',
            'glue:StopCrawler',
            'glue:DeleteCrawler',
            'lambda:CreateFunction',
            'lambda:DeleteFunction',
            'lambda:GetFunction',
            'lambda:InvokeFunction',
            'states:DescribeExecution',
            'states:GetExecutionHistory',
            'states:StartExecution',
            'states:StopExecution',
            'states:DescribeStateMachine',
            'states:UpdateStateMachine',
            'states:DeleteStateMachine',
            'states:CreateStateMachine',
            'states:TagResource',
            'states:ListTagsForResource',
          ],
          resources: [
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:catalog`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:database/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_NAME}-*/*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:job/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:connection/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:crawler/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:states:${Aws.REGION}:${Aws.ACCOUNT_ID}:stateMachine:${SolutionInfo.SOLUTION_NAME}-DiscoveryJob*`,
            `arn:${Aws.PARTITION}:states:${Aws.REGION}:${Aws.ACCOUNT_ID}:execution:${SolutionInfo.SOLUTION_NAME}-DiscoveryJob*:*`,
          ],
        }),
      ],
    }));
    // Copy from AmazonS3ReadOnlyAccess, do not modify
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
    // Copy from AmazonRDSReadOnlyAccess, do not modify
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
    // Copy from AWSLakeFormationDataAdmin, do not modify
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

    const glueDetectionJobRole = new iam.Role(this, 'GlueDetectionJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME}GlueDetectionJobRole-${Aws.REGION}`, //Name must be specified
    });
    glueDetectionJobRole.attachInlinePolicy(new iam.Policy(this, 'GlueDetectionJobPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME}GlueDetectionJobPolicy`,
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
          'glue:CreateDatabase',
          'glue:DeleteTable',
          'glue:DeleteTableVersion',
          'glue:DeleteDatabase',
          'glue:GetConnection',
          'glue:GetPartitions',
          'glue:UpdatePartition',
          'glue:BatchCreatePartition',
          'glue:BatchUpdatePartition',
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
      roleName: `${SolutionInfo.SOLUTION_NAME}LambdaRdsRole-${Aws.REGION}`, //Name must be specified
    });
    lambdaRdsRole.attachInlinePolicy(new iam.Policy(this, 'lambdaRdsPolicy', {
      // policyName: `${SolutionInfo.SOLUTION_NAME}lambdaRdsPolicy`,
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
  }
}
