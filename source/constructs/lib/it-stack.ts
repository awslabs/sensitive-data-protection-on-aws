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

import { Aws, CfnParameter, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { AccountPrincipal, Policy, PolicyStatement, PrincipalWithConditions, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Parameter } from './common/parameter';
import { SolutionInfo } from './common/solution-info';


export class ITStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.templateOptions.description = SolutionInfo.IT_DESCRIPTION;

    const trustedRoleName = `${SolutionInfo.SOLUTION_NAME}APIRole-${Aws.REGION}`;
    const listOrganizationRoleName = `${SolutionInfo.SOLUTION_NAME}ListOrganizationRole-${Aws.REGION}`;

    const adminAccountIdParameter = new CfnParameter(this, 'AdminAccountId', {
      type: 'String',
      description: 'The account id of Admin',
      allowedPattern:
        '\\d{12}',
    });
    Parameter.addToParamLabels('Admin Account ID', adminAccountIdParameter.logicalId);
    const adminAccountId = adminAccountIdParameter.valueAsString;

    const trustedRoleARN = `arn:${Aws.PARTITION}:iam::${adminAccountId}:role/${trustedRoleName}`;

    const listOrganizationRole = new Role(this, 'ListOrganizationRole', {
      assumedBy: new PrincipalWithConditions(new AccountPrincipal(adminAccountId), { StringLike: { 'aws:PrincipalArn': trustedRoleARN } }),
      roleName: listOrganizationRoleName,
    });

    listOrganizationRole.attachInlinePolicy(new Policy(this, 'ListOrganizationPolicy', {
      statements: [
        new PolicyStatement({
          actions: [
            'organizations:ListDelegatedAdministrators',
            'organizations:DescribeOrganization',
            'cloudformation:ListStackInstances',
            'cloudformation:ListStackSets',
            'cloudformation:DescribeStackSet',
            'organizations:DescribeAccount',
          ],
          resources: [
            '*',
          ],
        }),
      ],
    }));

    Tags.of(this).add(SolutionInfo.TAG_KEY, SolutionInfo.TAG_VALUE);
  }
}
