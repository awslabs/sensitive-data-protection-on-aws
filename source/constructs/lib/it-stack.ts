import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CfnParameter } from 'aws-cdk-lib';
import { SolutionInfo } from './common/solution-info';


export class ITStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.templateOptions.description = SolutionInfo.IT_DESCRIPTION;

    const trustedRoleName = `${SolutionInfo.SOLUTION_NAME_ABBR}GetStacksetInstanceLambdaRole`;

    const adminAccountId = new CfnParameter(this, "AdminAccountId", {
      type: "String",
      description: "The account id of Admin",
      allowedPattern:
        "\\d{12}",
    });

    const trustedRoleARN = `arn:${cdk.Aws.PARTITION}:iam::${adminAccountId.valueAsString}:role/${trustedRoleName}`;

    const listOrganizationRole = new iam.Role(this, 'ListOrganizationRole', {
      assumedBy: new iam.ArnPrincipal(trustedRoleARN),
      roleName: `${SolutionInfo.SOLUTION_NAME_ABBR}ListOrganizationRole`
    });

    listOrganizationRole.attachInlinePolicy(new iam.Policy(this, 'ListOrganizationPolicy', {
      policyName: `${SolutionInfo.SOLUTION_NAME_ABBR}ListOrganizationPolicy`,
      statements: [
        new iam.PolicyStatement({
          actions: [
            "organizations:ListDelegatedAdministrators",
            "organizations:DescribeOrganization",
            "cloudformation:ListStackInstances",
            "organizations:DescribeAccount"
          ],
          resources: [
            "*"
          ],
        })
      ],
    }));
  }
}
