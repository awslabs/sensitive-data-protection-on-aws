/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
    CfnDatabase, CfnTable
} from 'aws-cdk-lib/aws-glue';
import { Construct } from 'constructs';
import { Stack,  aws_s3 as s3, Aws, Size } from 'aws-cdk-lib';
import { SolutionInfo } from '../common/solution-info';
import * as S3Deployment from "aws-cdk-lib/aws-s3-deployment";
import { Bucket } from 'aws-cdk-lib/aws-s3';


export interface GlueProps {
    bucket: Bucket;
}

/**
 * Stack to Admin Glue database and table
 */
export class GlueStack extends Construct {

    constructor(scope: Construct, id: string, props: GlueProps) {
        super(scope, id);

        const gcr_solution_bucket = Bucket.fromBucketName(this, "aws-gcr-solutions-bucket", "aws-gcr-solutions");
        const deploymentMlAsset = new S3Deployment.BucketDeployment(this, "DeploymentMlAsset", {
            memoryLimit: 512,
            ephemeralStorageSize: Size.gibibytes(1),
            sources: [S3Deployment.Source.bucket(gcr_solution_bucket, "aws-sensitive-data-protection/0.8.0/resource/python-module.zip")],
            destinationBucket: props.bucket,
            destinationKeyPrefix: "job/ml-asset/python-module",
        });

        const deploymentScript = new S3Deployment.BucketDeployment(this, "DeploymentScript", {
            memoryLimit: 512,
            ephemeralStorageSize: Size.gibibytes(1),
            sources: [S3Deployment.Source.asset("config/job/script")],
            destinationBucket: props.bucket,
            destinationKeyPrefix: "job/script",
        });

        const deploymentTemplate = new S3Deployment.BucketDeployment(this, "DeploymentTemplate", {
            memoryLimit: 512,
            ephemeralStorageSize: Size.gibibytes(1),
            sources: [S3Deployment.Source.asset("config/template")],
            destinationBucket: props.bucket,
            destinationKeyPrefix: "template",
        });

        let databaseInput: CfnDatabase.DatabaseInputProperty = {
            name: `${SolutionInfo.SOLUTION_GLUE_DATABASE}`,
        };

        const databaserResource = new CfnDatabase(this, 'Resource', {
            catalogId: Stack.of(this).account,
            databaseInput,
        });
        
        const table_name = `${SolutionInfo.SOLUTION_GLUE_TABLE}`

        const tableResource = new CfnTable(this, 'Table', {
            catalogId: databaserResource.catalogId,
            databaseName: databaserResource.ref,

            tableInput: {
                name: table_name,
                description: "Save SDPS glue detection data",

                partitionKeys: [{name: "year", type: "smallint"}
                    , {name: "month", type: "smallint"}
                    , {name: "day", type: "smallint"}],

                parameters: {
                    classification: "parquet",
                    has_encrypted_data: "Unencrypted",
                },
                storageDescriptor: {
                location: `s3://${props.bucket.bucketName}/glue-database/${table_name}/` ,
                compressed: true,
                columns: [{name: "column_name", type: "string"}
                    , {name: "identifiers", type: "array<struct<identifier:string,score:double>>"}
                    , {name: "sample_data", type: "array<string>"}
                    , {name: "account_id", type: "string"}
                    , {name: "job_id", type: "string"}
                    , {name: "run_id", type: "string"}
                    , {name: "run_database_id", type: "string"}
                    , {name: "database_name", type: "string"}
                    , {name: "database_type", type: "string"}
                    , {name: "table_name", type: "string"}
                    , {name: "region", type: "string"}
                    , {name: "update_time", type: "timestamp"}
                    , {name: "s3_location", type: "string"}
                    , {name: "s3_bucket", type: "string"}
                    , {name: "rds_instance_id", type: "string"}
                    , {name: "privacy", type: "int"}],
                inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
                outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
                serdeInfo: {
                    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
                },
                },
                tableType: 'EXTERNAL_TABLE',
            },
            });
            

        const detect_error_table_name = `${SolutionInfo.SOLUTION_GLUE_ERROR_TABLE}`
        const errorTableResource = new CfnTable(this, 'ErrorTable', {
            catalogId: databaserResource.catalogId,
            databaseName: databaserResource.ref,

            tableInput: {
                name: detect_error_table_name,
                description: "Save SDPS glue detection error data",

                parameters: {
                    classification: "parquet",
                    has_encrypted_data: "Unencrypted",
                },
                storageDescriptor: {
                location: `s3://${props.bucket.bucketName}/glue-database/${detect_error_table_name}/` ,
                compressed: true,
                columns: [{name: "account_id", type: "string"}
                    , {name: "region", type: "string"}
                    , {name: "job_id", type: "string"}
                    , {name: "run_id", type: "string"}
                    , {name: "run_database_id", type: "string"}
                    , {name: "database_name", type: "string"}
                    , {name: "database_type", type: "string"}
                    , {name: "table_name", type: "string"}
                    , {name: "update_time", type: "timestamp"}
                    , {name: "s3_location", type: "string"}
                    , {name: "s3_bucket", type: "string"}
                    , {name: "rds_instance_id", type: "string"}
                    , {name: "error_message", type: "string"}],
                inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
                outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
                serdeInfo: {
                    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
                },
                },
                tableType: 'EXTERNAL_TABLE',
            },
            });

    }
}
