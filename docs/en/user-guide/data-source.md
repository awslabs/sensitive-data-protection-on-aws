# Connect to data source
The first step for using Sensitive Data Protection is to onboard AWS accounts. To do so, you need to deploy an "Agent CloudFormation Stack" in the AWS account.

For the permissions required by the agent stack, refer to [Appendix: Permissions for agent Cloudformation stack](appendix-permissions.md).

## Add AWS accounts (individually)

1. Sign in to the solution's web portal.
2. Choose **Connect to data source** in the **Summary** area. Alternatively, choose **Connect to data source** from the left navigation pane. 
3. Choose **Add new account(s)** to open the **Individual account** tab.
4. Follow the instructions in **Step1** and **Step2** to install the Agent CloudFormation Stack.
5. After successfully deploying the stack, fill in the account ID of the AWS account.
6. Choose **Add this account**.
7. Go back to the **Connect to data source** page. You will see that the AWS account has been added. 

You can also click one specific AWS account ID to check account details.

## Add AWS accounts (via Organization)
For multiple AWS accounts, you can use AWS Organization to automatically install and uninstall the agent CloudFormation stacks. For more details, refer to [Appendix: Add AWS accounts via Organization](appendix-organization.md).

After successfully deploying the stack, fill in the account ID of the Organization delegator account.

Go back to the **Connect to data source** page, and you will see a list of AWS accounts added. You can click one specific AWS account ID to check account details.