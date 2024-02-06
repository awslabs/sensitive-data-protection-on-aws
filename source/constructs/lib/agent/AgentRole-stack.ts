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
            'ec2:DescribeNatGateways',
            'ec2:DescribeVpcEndpoints',
            'ec2:DescribeRouteTables',
            'secretsmanager:ListSecrets',
            'secretsmanager:GetSecretValue',
            'kms:Decrypt',
            'kms:DescribeKey',
            'glue:CheckSchemaVersionValidity',
            'glue:CreateClassifier',
            'glue:Get*',
            'glue:BatchGet*',
            'lakeformation:*',
            's3:List*',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: [
            'glue:CreateJob',
            'glue:DeleteJob',
            'glue:UpdateJob',
            'glue:CreateConnection',
            'glue:DeleteConnection',
            'glue:UpdateConnection',
            'glue:BatchDeleteTable',
            'glue:CreateCrawler',
            'glue:DeleteCrawler',
            'glue:UpdateCrawler',
            'glue:StartCrawler',
            'glue:StopCrawler',
            'glue:CreateDatabase',
            'glue:DeleteDatabase',
            'glue:UpdateDatabase',
            'glue:TagResource',
            'lambda:CreateFunction',
            'lambda:DeleteFunction',
            'lambda:GetFunction',
            'lambda:InvokeFunction',
            'states:DescribeExecution',
            'states:GetExecutionHistory',
            'states:StartExecution',
            'states:StopExecution',
            'states:CreateStateMachine',
            'states:DeleteStateMachine',
            'states:UpdateStateMachine',
            'states:DescribeStateMachine',
            'states:TagResource',
            'states:ListTagsForResource',
          ],
          resources: [
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:catalog`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:database/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*/*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:userDefinedFunction/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*/*`,
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

    const glueDetectionJobRole = new iam.Role(this, 'GlueDetectionJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      roleName: `${SolutionInfo.SOLUTION_NAME}GlueDetectionJobRole-${Aws.REGION}`, //Name must be specified
    });
    glueDetectionJobRole.attachInlinePolicy(new iam.Policy(this, 'GlueDetectionJobPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME}GlueDetectionJobPolicy`,
      statements: [
        new iam.PolicyStatement({
          actions: [
            's3:ListBucket',
            's3:GetObject',
            's3:PutObject', // Put object in Admin Bucket.When installing Agent Stack independently, do not know the Admin Bucket name.
            'glue:Get*',
            'glue:BatchGet*',
            'ec2:DescribeSubnets',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeVpcEndpoints',
            'ec2:DescribeRouteTables',
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
            'secretsmanager:GetSecretValue',
            'kms:Decrypt',
            'kms:DescribeKey',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: [
            'glue:CreateTable',
            'glue:DeleteTable',
            'glue:DeleteTableVersion',
            'glue:UpdateTable',
            'glue:CreateDatabase',
            'glue:UpdatePartition',
            'glue:BatchCreatePartition',
            'glue:BatchUpdatePartition',
            'glue:TagResource',
          ],
          resources: [
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:catalog`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:database/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*/*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:userDefinedFunction/${SolutionInfo.SOLUTION_NAME.toLowerCase()}-*/*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:job/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:connection/${SolutionInfo.SOLUTION_NAME}-*`,
            `arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:crawler/${SolutionInfo.SOLUTION_NAME}-*`,
          ],
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
        }),
      ],
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
