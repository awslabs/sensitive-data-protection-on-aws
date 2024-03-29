# 解决方案如何运作

本节描述了构成此解决方案的组件和 AWS 服务以及高层次系统设计。

![高层次系统设计](docs/../../images/system-design.png)
**AWS 上的敏感数据保护高层次系统设计**

如图所示，集中式敏感数据治理帐户是管理员帐户。解决方案用户（通常为安全审计员）可以在部署 **Admin** 堆栈后通过 Web 门户访问解决方案。用户可以在部署 **Agent** 堆栈并登录 Web 门户后浏览数据目录并在监控帐户中执行敏感数据检测作业。

多个监控帐户与管理员帐户连接，具有数据源访问和作业执行权限，以便管理员帐户可以在指定的监控帐户中调用作业处理器模型进行敏感数据检测。

## 管理员帐户中的模块

- **Web 门户（UI）**：解决方案管理员或普通用户可以通过 Web 门户访问解决方案。它提供安全的用户访问管理和解决方案的 Web UI。

- **数据源管理（DSM）**：DSM 负责通过数据源检测器从监控帐户中检索数据源并存储数据源结构。用户可以探索监控帐户中的数据存储，例如 S3 存储桶和 RDS 实例。

- **数据目录管理（DCM）**：DCM 可以发现 DSM 中数据源的最新模式（通常称为元数据）。该模式包括表列等信息在 RDS 数据库中以及敏感数据检测作业运行后的敏感数据检测结果。

- **作业控制器（JC）**：作业控制器负责在监控帐户中执行检测作业并将检测结果收集回管理员帐户。它可以配置作业按用户定义的时间表或根据需要运行。

- **模板配置（TC）**：检测模板存储在 TC 模型中。它包含内置模板和自定义模板。JC 可以检索模板以运行作业处理器。

- **帐户管理（AM）**：监控 AWS 帐户由 AM 模型管理。

## 监控帐户中的模块

- **作业处理器**：作业处理器是敏感数据检测的运行容器，由作业控制器调用。作业处理器将原始数据读取到检测引擎进行检测，并将分析结果和运行状态发送到作业控制器。

- **检测引擎**：检测引擎模型是具有 AI/ML 支持功能的核心敏感数据检测引擎。它从作业处理器接收数据，使用预先训练的 ML 模型或模式识别敏感数据类型。
