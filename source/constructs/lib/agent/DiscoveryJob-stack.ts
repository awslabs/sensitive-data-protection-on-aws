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

import {
  aws_stepfunctions as sfn,
  aws_logs as logs,
  Aws
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as fs from 'fs';
import {
  PolicyStatement,
  Role,
  ServicePrincipal,
  Policy,
  Effect,
} from 'aws-cdk-lib/aws-iam';

export interface SfnFlowProps {
  projectName: string;
  adminAccountId: string;
}

/**
 * Stack to provision a common State Machine to orchestrate CloudFromation Deployment Flow.
 * This flow is used as a Child flow and will notify result at the end to parent flow.
 * Therefore the input must contains a token.
 */
export class DiscoveryJobStack extends Construct {
  readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: SfnFlowProps) {
    super(scope, id);
    var jsonDiscoveryJob = fs.readFileSync("lib/agent/DiscoveryJob.json").toString();

    const discoveryJobRole = new Role(this, 'DiscoveryJobRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      roleName: `${props.projectName}DiscoveryJobRole-${Aws.REGION}`
    });
    discoveryJobRole.attachInlinePolicy(new Policy(this, 'AWSGlueServicePolicy', {
      policyName: 'AWSGlueServicePolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:CreateBucket",
            "s3:DeleteObject",
          ],
          resources: ["arn:aws-cn:s3:::*"]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "glue:*",
            "s3:GetBucketLocation",
            "s3:ListBucket",
            "s3:ListAllMyBuckets",
            "s3:GetBucketAcl",
            "ec2:DescribeVpcEndpoints",
            "ec2:DescribeRouteTables",
            "ec2:CreateNetworkInterface",
            "ec2:DeleteNetworkInterface",
            "ec2:DescribeNetworkInterfaces",
            "ec2:DescribeSecurityGroups",
            "ec2:DescribeSubnets",
            "ec2:DescribeVpcAttribute",
            "iam:ListRolePolicies",
            "iam:GetRole",
            "iam:GetRolePolicy",
            "cloudwatch:PutMetricData",
          ],
          resources: ["*"]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          resources: [
            "arn:aws-cn:logs:*:*:/aws-glue/*"
          ]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "ec2:CreateTags",
            "ec2:DeleteTags"
          ],
          conditions: {
            StringEquals: {
              'aws:TagKeys': "aws-glue-service-resource"
            }
          },
          resources: [
            "arn:aws-cn:ec2:*:*:network-interface/*",
            "arn:aws-cn:ec2:*:*:security-group/*",
            "arn:aws-cn:ec2:*:*:instance/*"
          ]
        }), 
      ]
    }));
    discoveryJobRole.addToPolicy(new PolicyStatement({
      actions: [
        "logs:CreateLogDelivery",
        "logs:GetLogDelivery",
        "logs:UpdateLogDelivery",
        "logs:DeleteLogDelivery",
        "logs:ListLogDeliveries",
        "logs:PutResourcePolicy",
        "logs:DescribeResourcePolicies",
        "logs:DescribeLogGroups",
        "lambda:InvokeFunction",
      ],
      effect: Effect.ALLOW,
      resources: ['*'],
    }));
    discoveryJobRole.attachInlinePolicy(new Policy(this, 'DiscoveryJobPolicy', {
      policyName: `${props.projectName}DiscoveryJobPolicy`,
      statements: [new PolicyStatement({
        actions: ["xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
        ],
        resources: ["*"],
      }),
      new PolicyStatement({
        actions: ["sqs:SendMessage",
        ],
        resources: [`arn:${Aws.PARTITION}:sqs:${Aws.REGION}:${props.adminAccountId}:${props.projectName}-DiscoveryJob`],
      })],
    }));

    // State machine log group
    const logGroup = new logs.LogGroup(this, "SFNLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
    });
    const stepFunction = new sfn.CfnStateMachine(
      this,
      "cfnStepFunction",
      {
        roleArn: discoveryJobRole.roleArn,
        definitionString: jsonDiscoveryJob,
        stateMachineName: `${props.projectName}-DiscoveryJob`,
        loggingConfiguration: {
          destinations: [{
            cloudWatchLogsLogGroup: {
              logGroupArn: logGroup.logGroupArn,
            },
          }],
          includeExecutionData: true,
          level: 'ALL',
        },
      }
    );

    stepFunction.node.addDependency(discoveryJobRole);
    this.stateMachineArn = stepFunction.attrArn;
  }
}
