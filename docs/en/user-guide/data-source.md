# Connect to data source
When using SDPS, the first step is to onboard AWS accounts to this SDPS platform. To do so, you need to deploy an "Agent CloudFormation Stack" in the AWS account.

> For the permissions required by the agent stack, please refer to this [Appendix: Permissions for agent cloudformation stack](appendix-agent-stack.md).

## Add AWS accounts (manually)
On the **Connect to data source** webpage, click the **“Add new account(s)”** button. Go to the **Individual account** tab and follow the instructions to install the Agent CloudFormation Stack.

After successfully deploying the stack, fill in the account Id of the AWS account.

Go back to the **Connect to data source** webpage, and you will see that the AWS account has been added to the SDPS platform. You can click on a specific AWS account ID to see account details.

## Add AWS accounts (automatically)
If you have too many AWS accounts (e.g., 20+), you may want to use AWS Organization to automatically install and uninstall the agent CloudFormation stacks. For more details, refer to [Appendix: Add AWS accounts via Organization](appendix-organization.md).

After successfully deploying the stack, fill in the account Id of the Organization delegator account.

Go back to the **Connect to data source** webpage, and you will see a list of AWS accounts added to the SDPS platform. You can click on a specific AWS account ID to see account details.