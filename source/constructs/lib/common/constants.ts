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

export class Constants {

  /**
   * Your S3 bucket must have a bucket policy that grants Elastic Load 
   * Balancing permission to write access logs to the bucket. Bucket 
   * policies are a collection of JSON statements written in the access
   *  policy language to define access permissions for your bucket. 
   * Each statement includes information about a single permission 
   * and contains a series of elements.
   * 
   * check mapping from doc https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/enable-access-logs.html#attach-bucket-policy
   */
  public static readonly ALBLogServiceAccountMapping = {
    mapping: {
      'me-south-1': {
        account: '076674570225',
      },
      'eu-south-1': {
        account: '635631232127',
      },
      'ap-northeast-1': {
        account: '582318560864',
      },
      'ap-northeast-2': {
        account: '600734575887',
      },
      'ap-northeast-3': {
        account: '383597477331',
      },
      'ap-south-1': {
        account: '718504428378',
      },
      'ap-southeast-1': {
        account: '114774131450',
      },
      'ap-southeast-2': {
        account: '783225319266',
      },
      'ca-central-1': {
        account: '985666609251',
      },
      'eu-central-1': {
        account: '054676820928',
      },
      'eu-north-1': {
        account: '897822967062',
      },
      'eu-west-1': {
        account: '156460612806',
      },
      'eu-west-2': {
        account: '652711504416',
      },
      'eu-west-3': {
        account: '009996457667',
      },
      'sa-east-1': {
        account: '507241528517',
      },
      'us-east-1': {
        account: '127311923021',
      },
      'us-east-2': {
        account: '033677994240',
      },
      'us-west-1': {
        account: '027434742980',
      },
      'us-west-2': {
        account: '797873946194',
      },
      'ap-east-1': {
        account: '754344448648',
      },
      'af-south-1': {
        account: '098369216593',
      },
      'ap-southeast-3': {
        account: '589379963580',
      },
      'cn-north-1': {
        account: '638102146993',
      },
      'cn-northwest-1': {
        account: '037604701340',
      },
    },
  };
}
