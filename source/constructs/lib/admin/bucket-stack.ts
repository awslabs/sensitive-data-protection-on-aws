import { RemovalPolicy } from 'aws-cdk-lib';
import { BucketEncryption, BlockPublicAccess, Bucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';
import { Stack, StackProps, Aws} from "aws-cdk-lib";

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
