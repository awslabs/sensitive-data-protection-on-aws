# Sensitive Data Protection Solution on AWS

The Sensitive Data Protection Solution is an AWS Solution that provides a self-service web application allowing enterprise customers to build data catalog discover, protect, and visualize sensitive data, such as PII and classified data, across multiple AWS accounts.

***

## Building your CDK Project

After initializing the repository, make any desired code changes. As you work through the development process, the following commands might be useful for
periodic testing and/or formal testing once development is completed. These commands are CDK-related and should be run at the /source level of your project.

CDK commands:
- `cdk init` - creates a new, empty CDK project that can be used with your AWS account.
- `cdk synth` - synthesizes and prints the CloudFormation template generated from your CDK project to the CLI.
- `cdk deploy` - deploys your CDK project into your AWS account. Useful for validating a full build run as well as performing functional/integration testing
of the solution architecture.

Additional scripts related to building, testing, and cleaning-up assets may be found in the package.json file or in similar locations for your selected CDK language. You can also run `cdk -h` in the terminal for details on additional commands.

***

## Running Unit Tests

The `/source/run-all-tests.sh` script is the centralized script for running all unit, integration, and snapshot tests for both the CDK project as well as any associated Lambda functions or other source code packages.

- Note: It is the developer's responsibility to ensure that all test commands are called in this script, and that it is kept up to date.

This script is called from the solution build scripts to ensure that specified tests are passing while performing build, validation and publishing tasks via the pipeline.

***

## Building Project Distributable
* Configure the bucket name of your target Amazon S3 distribution bucket
```
export DIST_OUTPUT_BUCKET=my-bucket-name # bucket where customized code will reside
export SOLUTION_NAME=my-solution-name
export VERSION=my-version # version number for the customized code
export REGION=aws-region-code # e.g. us-east-1
```
_Note:_ You would have to create an S3 bucket with the prefix 'my-bucket-name-<aws_region>'; aws_region is where you are testing the customized solution. Also, the assets in bucket should be publicly accessible.

* Now build the distributable:
```
chmod +x ./build-s3-dist.sh
./build-s3-dist.sh $DIST_OUTPUT_BUCKET $SOLUTION_NAME $VERSION
```

* Deploy the distributable to an Amazon S3 bucket in your account. _Note:_ you must have the AWS Command Line Interface installed.
```
aws s3 cp ./dist/ s3://$DIST_OUTPUT_BUCKET-$REGION/$SOLUTION_NAME/$VERSION/ --recursive --acl bucket-owner-full-control --profile aws-cred-profile-name
```

* Get the link of the solution template uploaded to your Amazon S3 bucket.
* Deploy the solution to your account by launching a new AWS CloudFormation stack using the link of the solution template in Amazon S3.

***

## Building Open-Source Distributable

* Run the following command to build the open-source project:
```
chmod +x ./build-open-source-dist.sh
./build-open-source-dist.sh $SOLUTION_NAME
```

* Validate that the assets within the output folder are accurate and that there are no missing files.

***

## Collection of operational metrics
This solution collects anonymous operational metrics to help AWS improve the quality and features of the solution. For more information, including how to disable this capability, please see the [implementation guide](deep link into the documentation with specific information about the metrics and how to opt-out).

***

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://www.apache.org/licenses/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
