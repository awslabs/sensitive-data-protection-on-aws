# Security Information 
When you build solutions on Amazon Web Services, security responsibilities are shared between you and Amazon Cloud. This [Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/) reduces your operational burden due to the Amazon Web Services operations, management, and control components, including host operations The physical security of the system, the virtualization layer, and the facility where the service runs. For more information on Amazon Web Services, visit Amazon Web Services [Cloud Security](http://aws.amazon.com/security/).

## IAM roles

AWS Identity and Access Management (IAM) roles allow customers to assign fine-grained access policies and permissions to services and users on AWS. This solution creates IAM roles that grant access between components of the solution.

##  Monitoring services using Amazon CloudWatch alarms

You can set up alarms to monitor and receive alerts about your AWS resources on the [alarms dashboard](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html in Amazon CloudWatch. Generally, we recommend configuring your alarms to notify you whenever a metric starts excessively over or under-utilizing a particular resource, such as high CPU or memory usage. This can be an indicator that your service is experiencing a DoS-style attack. Additionally, it may be valuable to set alarms for when your data storage container, such as RDS, approaches near 100% capacity utilization, as this could indicate a resource starvation or exhaustion-style attack.

> There would be additional cost for [CloudWatch alarms](https://aws.amazon.com/cloudwatch/pricing/).

In China regions (cn-north-1, cn-northwest-1), you can create [RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/monitoring-cloudwatch.html) and [NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway-cloudwatch.html) metrics in alarms. 

In all supported global regions, you can enable more services metrics like [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html), [SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-monitoring-using-cloudwatch.html), [ApplicationELB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html).

For example, if you want to create alarms to monitor ActiveConnectionCount in NATGateway using the CloudWatch console, please follow the steps below.

1. Sign in to the AWS Management Console and open the CloudWatch console
2. Choose **Alarms**, **All alarms**. Choose **Create an alarm**.
3. Choose **Select metric** and choose **NATGateway** in metrics.
4. Search for the metric **ActiveConnectionCount**.
5. In **Conditions**, define the alarm condition whenever ActiveConnectionCount is greater than 100. Then choose Next.
6. In the **Notification** configure CloudWatch to send you an email when the alarm state is reached.
7. Choose **Next**.
8. Enter a name and description for the alarm and **Create alarm**.
