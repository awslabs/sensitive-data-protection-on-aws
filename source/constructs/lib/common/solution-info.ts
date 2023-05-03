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

export class SolutionInfo {
  static SOLUTION_ID = 'SO8031';
  static SOLUTION_NAME = 'Sensitive Data Protection on AWS';
  static SOLUTION_NAME_ABBR = 'SDPS';
  static SOLUTION_VERSION = '@TEMPLATE_BUILD_VERSION@';
  static DESCRIPTION = `(${SolutionInfo.SOLUTION_ID}) ${SolutionInfo.SOLUTION_NAME} (Version ${SolutionInfo.SOLUTION_VERSION})`;
  static AGENT_DESCRIPTION = `(${SolutionInfo.SOLUTION_ID}-sub) ${SolutionInfo.SOLUTION_NAME} (Version ${SolutionInfo.SOLUTION_VERSION})`;
  static IT_DESCRIPTION = `(${SolutionInfo.SOLUTION_ID}-org) ${SolutionInfo.SOLUTION_NAME} (Version ${SolutionInfo.SOLUTION_VERSION})`;
  static SOLUTION_GLUE_DATABASE = 'sdps_database';
  static SOLUTION_GLUE_TABLE = 'job_detection_output_table';
  static SOLUTION_GLUE_ERROR_TABLE = 'job_detection_error_table';
  static SOLUTION_ADMIN_S3_BUCKET = 'sdps-admin';
  static TAG_NAME = 'Name';
  static TAG_KEY = 'CreatedBy';
  static TAG_VALUE = SolutionInfo.SOLUTION_NAME_ABBR;
}
