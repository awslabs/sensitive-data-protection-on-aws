此解决方案使用了以下 AWS 服务：

| AWS 服务 | 描述 |
| --- | --- |
| [Application Load Balancer](https://aws.amazon.com/alb/) | **核心组件**。用于分发前端 Web UI 资产。 |
| [Amazon ECR](https://aws.amazon.com/ecr/) | **核心组件**。用于存储 Docker 镜像。 |
| [AWS Lambda](https://aws.amazon.com/lambda/) | **核心组件**。作为应用程序负载均衡器的目标。 |
| [AWS Step Functions](https://aws.amazon.com/step-functions/) | **支持**。被调用以进行敏感数据检测。 |
| [AWS Glue](https://aws.amazon.com/glue/) | **支持**。用于清点数据源。 |
| [Amazon RDS](https://aws.amazon.com/rds/) | **支持**。仅需几次点击即可在云中设置、操作和扩展关系数据库。 |
| [Amazon SQS](https://aws.amazon.com/sqs/) | **支持**。让 Step Functions 向检测作业队列发送消息。 |
