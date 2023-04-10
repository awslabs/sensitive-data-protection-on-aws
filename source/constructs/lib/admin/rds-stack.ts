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

import * as path from 'path';
import {
  Aws, CustomResource, Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  Port,
  Peer,
  SecurityGroup,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import {
  Code, Function,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  DatabaseSecret, MysqlEngineVersion,
} from 'aws-cdk-lib/aws-rds';
import { Provider } from 'aws-cdk-lib/custom-resources';
import {
  SecretRotation,
  SecretRotationApplication,
 } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { SolutionInfo } from '../common/solution-info';

export interface RdsProps {
  vpc: IVpc;
}

/**
 * Stack to Admin RDS database instance
 */
export class RdsStack extends Construct {
  readonly clientSecurityGroup: SecurityGroup;
  static dbPort = 6306;
  static excludeCharacters = ' %+:;{}/@"';//Only printable ASCII characters besides '/', '@', '"', ' ' may be used

  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id);

    this.clientSecurityGroup = new SecurityGroup(this, 'RDSClientSecurityGroup', {
      securityGroupName: "RDSClient",
      vpc: props.vpc,
      description: 'connet to RDS',
    });
    const rdsSecurityGroup = new SecurityGroup(this, 'RDSSecurityGroup', {
      securityGroupName: "RDS",
      vpc: props.vpc,
      description: 'RDS',
    });
    rdsSecurityGroup.addIngressRule(
      Peer.securityGroupId(this.clientSecurityGroup.securityGroupId),
      Port.tcp(RdsStack.dbPort),
      'Allow RDS client',
    );

    const secretName = `${SolutionInfo.SOLUTION_NAME_ABBR}`;
    const dbSecret = new DatabaseSecret(this, "Secret", {
      username: "root",
      secretName: secretName,
      excludeCharacters: RdsStack.excludeCharacters,
    });

    const databaseInstance = new DatabaseInstance(this, 'DatabaseInstance', {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_5_7,
      }),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE3,
        InstanceSize.MEDIUM,
      ),
      databaseName: "sdps", //Do not modify the value
      // instanceIdentifier: `${SolutionInfo.SOLUTION_NAME_ABBR}`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      securityGroups: [rdsSecurityGroup],
      port: RdsStack.dbPort,
      credentials: Credentials.fromSecret(dbSecret),
      iamAuthentication: true,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(7),
      storageEncrypted: true,
      publiclyAccessible: false,
      removalPolicy: RemovalPolicy.DESTROY,
      multiAz: true,
      // multiAz: false,
      deletionProtection: false,
    });

    const secretRotation = new SecretRotation(this, 'SecretRotation', {
      application: SecretRotationApplication.MYSQL_ROTATION_SINGLE_USER,
      secret: dbSecret,
      target: databaseInstance,
      vpc: props.vpc,
      excludeCharacters: RdsStack.excludeCharacters,
    });

    // Begin initDatabase
    // Create a lambda layer with required python packages.
    const initDababaseLayer = new LayerVersion(this, 'InitDatabaseLayer', {
      code: Code.fromAsset(path.join(__dirname, './database'), {
        bundling: {
          image: Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            `pip install -r requirements.txt ${SolutionInfo.PIP_MIRROR_PARAMETER} -t /asset-output/python`,
          ],
        },
      }),
      layerVersionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-InitDatabase`,
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: `${SolutionInfo.SOLUTION_NAME} - init database layer`,
    });

    const initDatabaseFunction = new Function(this, 'InitDatabaseFunction', {
      functionName: `${SolutionInfo.SOLUTION_NAME_ABBR}-InitDatabase`,
      description: `${SolutionInfo.SOLUTION_NAME} - init database`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'init_db.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './database')),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      vpc: props.vpc,
      securityGroups: [this.clientSecurityGroup],
      environment: {"SecretId": secretName},
      layers: [initDababaseLayer],
    });
    dbSecret.grantRead(initDatabaseFunction);
    initDatabaseFunction.node.addDependency(databaseInstance);

    const initDabaseProvider = new Provider(this, 'InitDabaseProvider', {
      onEventHandler: initDatabaseFunction,
    });

    const initDatabaseTrigger = new CustomResource(this, 'InitDatabaseTrigger', {
      serviceToken: initDabaseProvider.serviceToken,
      properties: {
        SolutionNameAbbr: SolutionInfo.SOLUTION_NAME_ABBR,
      },
    });
    initDatabaseTrigger.node.addDependency(initDabaseProvider);
  }
}
