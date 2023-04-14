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

export class BuildConfig {
  static BuildInChina = false;
  static InternetFacing = false;
  static PortalRepository = 'arn:aws-cn:ecr:cn-northwest-1:753680513547:repository/aws-sensitive-data-protection';
  static PortalTag = undefined;
  static PIP_MIRROR_PARAMETER = '';
  static PIP_MIRROR_CHINA_URL = 'https://opentuna.cn/pypi/web/simple';
}