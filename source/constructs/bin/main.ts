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

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { BootstraplessStackSynthesizer, CompositeECRRepositoryAspect } from 'cdk-bootstrapless-synthesizer';
import { AwsSolutionsChecks, NagPackSuppression, NagSuppressions } from 'cdk-nag';
import { AdminStack } from '../lib/admin-stack';
import { AgentStack } from '../lib/agent-stack';
import { ITStack } from '../lib/it-stack';

const app = new App();

function stackSuppressions(stacks: Stack[], suppressions: NagPackSuppression[]) {
  stacks.forEach(s => NagSuppressions.addStackSuppressions(s, suppressions, true));
}

Aspects.of(app).add(new AwsSolutionsChecks());

stackSuppressions(
  [
    new AdminStack(app, 'Admin', {
      synthesizer: synthesizer(),
    }),
    new AdminStack(app, 'AdminExistVpc', {
      synthesizer: synthesizer(),
      existingVpc: true,
    }),
    new AdminStack(app, 'AdminOnlyPrivateSubnets', {
      synthesizer: synthesizer(),
      existingVpc: true,
      onlyPrivateSubnets: true,
    }),
    new AdminStack(app, 'AdminWithIdP', {
      synthesizer: synthesizer(),
      useCognito: true,
    }),
    new AdminStack(app, 'AdminExistVpcWithIdP', {
      synthesizer: synthesizer(),
      existingVpc: true,
      useCognito: true,
    }),
    new AdminStack(app, 'AdminOnlyPrivateSubnetsWithIdP', {
      synthesizer: synthesizer(),
      existingVpc: true,
      onlyPrivateSubnets: true,
      useCognito: true,
    }),
    new ITStack(app, 'IT', {
      synthesizer: synthesizer(),
    }),
    new AgentStack(app, 'Agent', {
      synthesizer: synthesizer(),
    }),
  ],
  [
    { id: 'AwsSolutions-IAM5', reason: 'Some roles and policies need to get dynamic resources' },
    { id: 'AwsSolutions-IAM4', reason: 'these policies is used by CDK Customer Resource lambda' },
    { id: 'AwsSolutions-SF2', reason: 'Xray is not needed' },
    { id: 'AwsSolutions-S1', reason: 'These buckets dont need access log' },
    { id: 'AwsSolutions-L1', reason: 'The custom resource runtime version is not latest' },
    { id: 'AwsSolutions-RDS10', reason: 'Delete protection is not needed' },
    { id: 'AwsSolutions-EC23', reason: 'Use private subnet and has setup the port' },
    { id: 'AwsSolutions-SQS3', reason: "It is a DLQ and doesn't need another DLQ" },
    { id: 'AwsSolutions-SQS4', reason: 'It is a DLQ' },
  ],
);

if (process.env.USE_BSS) {
  Aspects.of(app).add(new CompositeECRRepositoryAspect());
}

app.synth();

function synthesizer() {
  return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}


