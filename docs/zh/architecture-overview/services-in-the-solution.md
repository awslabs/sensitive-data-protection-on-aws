The following AWS services are included in this solution:

| AWS service | Description |
| --- | --- |
| [Application Load Balancer](https://aws.amazon.com/alb/) | **Core**. To distribute the frontend web UI assets. |
| [Amazon ECR](https://aws.amazon.com/ecr/) | **Core**. To store Docker images. |
| [AWS Lambda](https://aws.amazon.com/lambda/) | **Core**. To serve as a target for the application load balancer. |
| [AWS Step Functions](https://aws.amazon.com/step-functions/) | **Supporting**. To be invoked for sensitive data detection. |
| [AWS Glue](https://aws.amazon.com/glue/) | **Supporting**. To take inventory of data sources. |
| [Amazon RDS](https://aws.amazon.com/rds/) | **Supporting**. To xx. |
| [Amazon SQS](https://aws.amazon.com/sqs/) | **Supporting**. To xx. |


