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

import { RemovalPolicy, Aws } from 'aws-cdk-lib';
import { BucketEncryption, BlockPublicAccess, Bucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';

export interface BucketProps {
  encryption?: BucketEncryption;
  enforceSSL?: boolean;
  autoDeleteObjects?: boolean;
  removalPolicy?: RemovalPolicy;
}


export class BucketStack extends Construct {
  public readonly bucket: Bucket;

  constructor(scope: Construct, id: string, props?: BucketProps) {
    super(scope, id);

    this.bucket = new Bucket(this, 'Bucket', {
      bucketName: `${SolutionInfo.SOLUTION_ADMIN_S3_BUCKET}-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: props?.encryption ?? BucketEncryption.S3_MANAGED,
      enforceSSL: props?.enforceSSL ?? true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: props?.autoDeleteObjects ?? true,
      removalPolicy: props?.removalPolicy ?? RemovalPolicy.DESTROY,
    });
  }
}
