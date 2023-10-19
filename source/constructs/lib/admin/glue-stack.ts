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

import path from 'path';
import { Stack, aws_s3 as s3, Aws, Size, Duration, CustomResource, Tags } from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import {
  CfnDatabase, CfnTable,
} from 'aws-cdk-lib/aws-glue';
import { Effect, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, LayerVersion, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as S3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { BuildConfig } from '../common/build-config';
import { SolutionInfo } from '../common/solution-info';


export interface GlueProps {
  bucket: Bucket;
}

/**
 * Stack to Admin Glue database and table
 */
export class GlueStack extends Construct {

  constructor(scope: Construct, id: string, props: GlueProps) {
    super(scope, id);

    const gcr_solution_bucket = Bucket.fromBucketName(this, 'aws-gcr-solutions-bucket', 'aws-gcr-solutions');
    new S3Deployment.BucketDeployment(this, 'DeploymentMlAsset', {
      memoryLimit: 512,
      ephemeralStorageSize: Size.gibibytes(1),
      sources: [S3Deployment.Source.bucket(gcr_solution_bucket, 'aws-sensitive-data-protection/1.0.0/resource/python-module.zip')],
      destinationBucket: props.bucket,
      destinationKeyPrefix: 'job/ml-asset/python-module',
    });

    new S3Deployment.BucketDeployment(this, 'DeploymentScript', {
      memoryLimit: 512,
      ephemeralStorageSize: Size.gibibytes(1),
      sources: [S3Deployment.Source.asset('config/job/script')],
      destinationBucket: props.bucket,
      destinationKeyPrefix: 'job/script',
      extract: false,
    });

    // When upgrading, files with template as the prefix will be deleted
    // Therefore, the initial template file will no longer be deployed.
    // new S3Deployment.BucketDeployment(this, 'DeploymentTemplate', {
    //   memoryLimit: 512,
    //   ephemeralStorageSize: Size.gibibytes(1),
    //   sources: [S3Deployment.Source.asset('config/template')],
    //   destinationBucket: props.bucket,
    //   destinationKeyPrefix: 'template',
    // });

    const databaseInput: CfnDatabase.DatabaseInputProperty = {
      name: `${SolutionInfo.SOLUTION_GLUE_DATABASE}`,
    };

    const databaserResource = new CfnDatabase(this, 'Resource', {
      catalogId: Stack.of(this).account,
      databaseInput,
    });

    const table_name = `${SolutionInfo.SOLUTION_GLUE_TABLE}`;

    new CfnTable(this, 'Table', {
      catalogId: databaserResource.catalogId,
      databaseName: databaserResource.ref,

      tableInput: {
        name: table_name,
        description: 'Save SDPS glue detection data',
        partitionKeys: [{ name: 'year', type: 'smallint' },
          { name: 'month', type: 'smallint' },
          { name: 'day', type: 'smallint' }],
        parameters: {
          classification: 'parquet',
          has_encrypted_data: 'Unencrypted',
        },
        storageDescriptor: {
          location: `s3://${props.bucket.bucketName}/glue-database/${table_name}/`,
          compressed: true,
          columns: [
            { name: 'job_id', type: 'string' },
            { name: 'run_id', type: 'string' },
            { name: 'run_database_id', type: 'string' },
            { name: 'account_id', type: 'string' },
            { name: 'region', type: 'string' },
            { name: 'database_type', type: 'string' },
            { name: 'database_name', type: 'string' },
            { name: 'table_name', type: 'string' },
            { name: 'column_name', type: 'string' },
            { name: 'identifiers', type: 'array<struct<identifier:string,score:double>>' },
            { name: 'sample_data', type: 'array<string>' },
            { name: 'table_size', type: 'int' },
            { name: 's3_location', type: 'string' },
            { name: 's3_bucket', type: 'string' },
            { name: 'rds_instance_id', type: 'string' },
            { name: 'privacy', type: 'int' },
            { name: 'update_time', type: 'timestamp' },
          ],
          inputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
          },
        },
        tableType: 'EXTERNAL_TABLE',
      },
    });


    const detect_error_table_name = `${SolutionInfo.SOLUTION_GLUE_ERROR_TABLE}`;
    new CfnTable(this, 'ErrorTable', {
      catalogId: databaserResource.catalogId,
      databaseName: databaserResource.ref,

      tableInput: {
        name: detect_error_table_name,
        description: 'Save SDPS glue detection error data',

        parameters: {
          classification: 'parquet',
          has_encrypted_data: 'Unencrypted',
        },
        storageDescriptor: {
          location: `s3://${props.bucket.bucketName}/glue-database/${detect_error_table_name}/`,
          compressed: true,
          columns: [
            { name: 'job_id', type: 'string' },
            { name: 'run_id', type: 'string' },
            { name: 'run_database_id', type: 'string' },
            { name: 'account_id', type: 'string' },
            { name: 'region', type: 'string' },
            { name: 'database_type', type: 'string' },
            { name: 'database_name', type: 'string' },
            { name: 'table_name', type: 'string' },
            { name: 's3_location', type: 'string' },
            { name: 's3_bucket', type: 'string' },
            { name: 'rds_instance_id', type: 'string' },
            { name: 'error_message', type: 'string' },
            { name: 'update_time', type: 'timestamp' },
          ],
          inputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
          },
        },
        tableType: 'EXTERNAL_TABLE',
      },
    });

    this.addPartition(props);
  }

  private addPartition(props: GlueProps) {
    // Create a lambda layer with required python packages.
    const addPartitionLayer = new LayerVersion(this, 'AddPartitionLayer', {
      code: Code.fromAsset(path.join(__dirname, './glue'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${BuildConfig.PIP_MIRROR_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      // layerVersionName: `${SolutionInfo.SOLUTION_NAME}-AddPartition`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - add partition generated by the program layer`,
    });

    const addPartitionRole = new Role(this, 'AddPartitionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    addPartitionRole.attachInlinePolicy(new Policy(this, 'AWSLambdaBasicExecutionPolicy', {
      policyName: 'AWSLambdaBasicExecutionPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
      ],
    }));
    const noramlStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['glue:GetTable',
        'glue:BatchCreatePartition',
        'glue:CreatePartition'],
      resources: [`arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:table/${SolutionInfo.SOLUTION_GLUE_DATABASE}/*`,
        `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:database/${SolutionInfo.SOLUTION_GLUE_DATABASE}`,
        `arn:${Aws.PARTITION}:glue:*:${Aws.ACCOUNT_ID}:catalog`],
    });
    addPartitionRole.addToPolicy(noramlStatement);

    const addPartitionFunction = new Function(this, 'AddPartitionFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME}-AddPartition`, //Name must be specified
      description: `${SolutionInfo.SOLUTION_FULL_NAME} - add partition generated by the program`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'add_partition.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './glue')),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      layers: [addPartitionLayer],
      role: addPartitionRole,
      environment: {
        ProjectBucketName: props.bucket.bucketName,
      },
    });
    addPartitionFunction.node.addDependency(addPartitionRole);

    const addPartitionTrigger = new CustomResource(this, 'AddPartitionTrigger', {
      serviceToken: addPartitionFunction.functionArn,
      properties: {
        Version: SolutionInfo.SOLUTION_VERSION,
      },
    });
    addPartitionTrigger.node.addDependency(addPartitionFunction);

    const addPartitionRule = new events.Rule(this, 'AddPartitionRule', {
      // ruleName: `${SolutionInfo.SOLUTION_NAME}-AddPartition`,
      schedule: events.Schedule.cron({ minute: '1', hour: '0' }),
    });
    addPartitionRule.addTarget(new targets.LambdaFunction(addPartitionFunction));
    Tags.of(addPartitionRule).add(SolutionInfo.TAG_KEY, SolutionInfo.TAG_VALUE);
  }
}
