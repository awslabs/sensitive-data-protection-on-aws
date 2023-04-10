import {
  Container,
  Header,
  Icon,
  Button,
  SpaceBetween,
  FormField,
  Input,
} from '@cloudscape-design/components';
import React, { memo, useState } from 'react';
import {
  ADMIN_TEMPLATE_URL,
  AGENT_TEMPLATE_URL,
  IT_TEMPLATE_URL,
  TAB_LIST,
} from '../types/add_account_type';
import { useNavigate } from 'react-router-dom';
import { alertMsg } from 'tools/tools';
import { addAccount } from 'apis/account-manager/api';
import { RouterEnum } from 'routers/routerEnum';

const AddAccountInfo: React.FC<any> = memo((props: any) => {
  const { tagType } = props;
  const navigate = useNavigate();
  const [inputAccount, setInputAccount] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const backNavigate = () => {
    navigate(-1);
  };

  const clkDownload = async () => {
    await navigator.clipboard.writeText(ADMIN_TEMPLATE_URL);
    alertMsg('Copied to clipboard', 'success');
  };

  const clkAgentDownload = async () => {
    await navigator.clipboard.writeText(AGENT_TEMPLATE_URL);
    alertMsg('Copied to clipboard', 'success');
  };

  const clkItDownload = async () => {
    await navigator.clipboard.writeText(IT_TEMPLATE_URL);
    alertMsg('Copied to clipboard', 'success');
  };

  const addAwsAccount = async () => {
    if (!inputAccount) {
      alertMsg('Please Input AccountId', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await addAccount({ account_id: inputAccount });
      setIsLoading(false);
      alertMsg('Add Success', 'success');
      setInputAccount('');
      navigate(RouterEnum.AccountManagement.path);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <SpaceBetween direction="vertical" size="xl">
      {tagType === TAB_LIST.via.id && (
        <>
          <Container
            header={
              <Header
                variant="h2"
                description={
                  <b>
                    The CloudFormation stack is used for authroizing AWS
                    Organization
                  </b>
                }
              >
                Step1: Install agent to authorize Organization delegater
              </Header>
            }
          >
            <div className="pointer-icon" onClick={clkDownload}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                Copy [CloudFormationStack-AuthorizeOrganization] CloudFormation
                stack’s Amazon S3 URL
              </span>
            </div>
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description={
                  <b>
                    Deploy the stack in the AWS orgnization AWS account or the
                    delegated administrator AWS account.
                  </b>
                }
              >
                Step2: Authroize member accounts in Organization delegate
                administrator
              </Header>
            }
          >
            <ul>
              <li>
                Log in to the AWS account of the AWS orgnization account or the
                delegated administrator account.
              </li>
              <li>Go to the CloudFormation console of the AWS account.</li>

              <li>
                Click the <b>Create stack</b> button and choose
                <b>With new resources (standard)</b>.
              </li>
              <li>
                In the Create stack page, enter the template URL you have copied
                in Step1 in <b>Amazon S3 URL</b>.
              </li>

              <li>
                Follow the steps to create the CloudFormation stack and wait
                until the CloudFormation stack is deployed successfully.
              </li>
              <li>
                Go to the <b>Outputs</b> tab to copy the parameters.
              </li>
            </ul>
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description={
                  <b>
                    The CloudFormation stack is used for authroizing AWS
                    Organization
                  </b>
                }
              >
                Step3: Install agent stack to authorize member accounts in
                Organization
              </Header>
            }
          >
            <div className="pointer-icon" onClick={clkAgentDownload}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                Copy [CloudFormationStack-AuthorizeMembers] CloudFormation
                stack’s Amazon S3 URL
              </span>
            </div>
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description={
                  <b>
                    The CloudFormation stack is used for authroizing AWS
                    Organization
                  </b>
                }
              >
                Step4: Install agent stack to authorize member accounts in
                Organization
              </Header>
            }
          >
            <div className="pointer-icon" onClick={clkItDownload}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                Copy [CloudFormationStack-AuthorizeMembers] CloudFormation
                stack’s Amazon S3 URL
              </span>
            </div>
          </Container>
        </>
      )}
      {tagType === TAB_LIST.individual.id && (
        <>
          <Container
            header={
              <Header
                variant="h2"
                description={
                  <b>
                    The CloudFormation stack is used for authorizing AWS account
                    to be tracked in this platform.
                  </b>
                }
              >
                Step1: Copy CloudFormation template URL for agent stack
              </Header>
            }
          >
            <div className="pointer-icon" onClick={clkAgentDownload}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                Copy [CloudFormationStack-AuthorizeMembers] CloudFormation
                stack’s Amazon S3 URL
              </span>
            </div>
          </Container>
          <Container
            header={
              <Header
                variant="h2"
                description={
                  <b>
                    Install the agent stack in CloudFormation in the AWS account
                    you want to monitor.
                  </b>
                }
              >
                Step2: Install agent CloudFormation stack for AWS account
              </Header>
            }
          >
            <ul>
              <li>Go to the CloudFormation console of the AWS account.</li>
              <li>
                In <b>Stacks</b>, click the right up corner button
                <b>Create stack</b>
                and choose <b>With new resources (standard)</b>.
              </li>

              <li>
                Pasted in <b>Amazon S3 URL</b> with the link you have copied
                above.
              </li>
              <li>Follow the steps to deploy the CloudFormation stack.</li>

              <li>
                Wait until the CloudFormation stack is deployed (installed)
                successfully.
              </li>
            </ul>
          </Container>
          <Container
            header={
              <Header variant="h2">
                Step3: After successfully installed the agent stack, fill in
                back the account id
              </Header>
            }
          >
            <FormField label="AWS account id">
              <Input
                value={inputAccount}
                placeholder="AWS account id"
                onChange={(e) => setInputAccount(e.detail.value)}
              />
            </FormField>
          </Container>
        </>
      )}
      <div className="account-back-btn">
        <Button onClick={backNavigate} loading={isLoading}>
          Back
        </Button>
        {tagType === TAB_LIST.individual.id && (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={addAwsAccount}
              loading={isLoading}
              disabled={!inputAccount}
            >
              Add this account
            </Button>
          </>
        )}
      </div>
    </SpaceBetween>
  );
});

export default AddAccountInfo;
