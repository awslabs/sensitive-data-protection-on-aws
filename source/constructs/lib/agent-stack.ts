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

import { Stack, StackProps, CfnParameter, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CrawlerEventbridgeStack } from './agent/CrawlerEventbridge-stack';
import { DeleteAgentResourcesStack } from './agent/DeleteAgentResources-stack';
import { DiscoveryJobStack } from './agent/DiscoveryJob-stack';
import { RenameResourcesStack } from './agent/RenameResources-stack';
import { RoleStack } from './agent/role-stack';
import { BucketStack } from './common/bucket-stack';
import { Parameter } from './common/parameter';
import { SolutionInfo } from './common/solution-info';

// Operator agent stack
export class AgentStack extends Stack {
  public static createStack(scope: Construct, adminAccountId: string) {

    new DiscoveryJobStack(scope, 'DiscoveryJobStateMachine', {
      adminAccountId: adminAccountId,
    });

    new CrawlerEventbridgeStack(scope, 'CrawlerEventbridge', {
      adminAccountId: adminAccountId,
    });

    new RoleStack(scope, 'Role', {
      adminAccountId: adminAccountId,
    });

    new BucketStack(scope, 'AgentS3', {
      prefix: SolutionInfo.SOLUTION_AGENT_S3_BUCKET,
    });

    new DeleteAgentResourcesStack(scope, 'DeleteAgentResources', {
      adminAccountId: adminAccountId,
      queueName: `${SolutionInfo.SOLUTION_NAME}-AutoSyncData`,
    });

    new RenameResourcesStack(scope, 'RenameResources', {
      adminAccountId: adminAccountId,
    });
  }

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.templateOptions.description = SolutionInfo.AGENT_DESCRIPTION;
    Parameter.init();
    const adminAccountIdParameter = new CfnParameter(this, 'AdminAccountId', {
      type: 'String',
      description: 'The account id of Admin',
      allowedPattern: '\\d{12}',
    });
    Parameter.addToParamLabels('Admin Account ID', adminAccountIdParameter.logicalId);

    AgentStack.createStack(this, adminAccountIdParameter.valueAsString);

    this.templateOptions.metadata = {
      'AWS::CloudFormation::Interface': {
        ParameterLabels: Parameter.paramLabels,
      },
    };

    Tags.of(this).add(SolutionInfo.TAG_KEY, SolutionInfo.TAG_VALUE);
  }
}
