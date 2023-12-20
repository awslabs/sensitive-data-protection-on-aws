# Security Information 
When you build systems on AWS infrastructure, security responsibilities are shared between you and AWS. This [Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/) reduces your operational burden because AWS operates, manages, and controls the components including the host operating system, the virtualization layer, and the physical security of the facilities in which the services operate. For more information about AWS security, visit [AWS Cloud Security](http://aws.amazon.com/security/).

## IAM roles

AWS Identity and Access Management (IAM) roles allow customers to assign fine-grained access policies and permissions to services and users on AWS. This solution creates IAM roles that grant access between components of the solution.

##  Monitoring services using Amazon CloudWatch alarms

You can set up alarms to monitor and receive alerts about your AWS resources on the [alarms dashboard](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html) in Amazon CloudWatch. Generally, we recommend configuring your alarms to notify you whenever a metric starts excessively over or under-utilizes a particular resource, such as high CPU or memory usage. This can be an indicator that your service is experiencing a DoS-style attack. Additionally, it may be necessary to set alarms when your data storage container, such as RDS, approaches near 100% capacity utilization, because this could indicate a resource starvation or exhaustion-style attack.

!!! Warning "Warning"
    
    There could be additional cost for [CloudWatch alarms](https://aws.amazon.com/cloudwatch/pricing/).

In AWS China Regions (cn-north-1 and cn-northwest-1), you can create [RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/monitoring-cloudwatch.html) and [NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway-cloudwatch.html) metrics in alarms. 

In AWS Regions, you can enable more services metrics like [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html), [SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-monitoring-using-cloudwatch.html), [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html).

For example, if you want to create alarms to monitor ActiveConnectionCount in NATGateway using the CloudWatch console, follow the steps below.

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Access the CloudWatch console.
3. In the navigation pane, choose **All alarms** under **Alarms**, and then choose **Create alarm**.
4. Choose **Select metric**, and choose **NATGateway** in metrics.
5. Search for the metric **ActiveConnectionCount**, click it and select it.
6. Choose **Select metric**.
7. In **Conditions**, define the alarm condition whenever ActiveConnectionCount is greater than 100. Then choose **Next**.
6. In the **Notification**, configure CloudWatch to send you an email when the alarm state is triggered.
7. Choose **Next**.
8. Enter a name and description for the alarm and **Create alarm**.


##  Enabling access logging for the Admin account S3 bucket

After deploying the solution, you can enable access logs for the Admin account's S3 bucket to detect and prevent security issues. Enabling logging allows Amazon S3 to deliver access logs to a destination bucket of your choice. The destination bucket must be within the same AWS Region and AWS account as the Admin account's S3 bucket.

If you want to enable access logging for the Admin account S3 bucket using the S3 console, follow the steps below.

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Access the S3 console.
3. Find the S3 bucket after the CloudFormation stack deployment, the bucket name is start with the CloudFormation stack name.
4. Click on the "Properties" tab.
5. Scroll down to the "Server access logging" section and click on "Edit".
6. Choose the option "Enable" to enable access logging for the S3 bucket.
7. In the "Target bucket" field, select the bucket where you want to store the access logs.
8. Click on "Save" to enable access logging for the S3 bucket.