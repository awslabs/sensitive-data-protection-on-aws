## 使用EC2配置数据库代理

<<<<<<< HEAD
### 创建并登录到代理EC2机器，配置转发端口
有一些用户的数据库Security Group设置了限制，只允许固定IP访问。这个时候，用户需要一个EC2作为Proxy来提供固定的IP。

接下来，我们将创建1个EC2实例作为数据库代理，并安装Nginx软件并设置端口转发。在做数据源连接时，SDPS连接EC2，并通过这台EC2目标对数据库进行JDBC连接。

##### Step 1:创建EC2实例
- 在EC2控制台。在SDP所在的VPC创建一台EC2机器, 作为代理服务器。
- 配置EC2的安全组（Security Group）：添加Inbound Rule，允许以下2个安全组的所有TCP进入：SDPS-CustomDB、堆栈名-RDSRDSClient

##### Step 2:在EC2上安装Nginx软件
- 将EC2的pem文件拷贝到Bastion host上，用于登陆代理服务器。
- 从你的Bastion host上，使用SSH方式登陆到EC2。例如：
  `ssh -i /path/to/your/key.pem ec2-user@ec2-private-ip`
- 依次运行下面的命令，安装并启动Nginx。
  - 安装： `sudo yum install nginx nginx-mod-stream`
  - 启动：`sudo systemctl start nginx`
  - 查看状态：`systemctl status nginx`
##### Step 3:配置Nginx软件
  - 打开配置文件：`vim /etc/nginx/nginx.conf`
  - 编辑配置文件：
```python
# 用代码替换默认的nginx.conf文件内容。您需要进行必要的调整。
=======
创建1个EC2实例作为数据库代理。安装Nginx 设置端口转发。例如:


### Step 1:安装
`sudo yum install nginx nginx-mod-stream`
### Step 2:启动
`sudo systemctl start nginx`
### Step 3:查看状态
`systemctl status nginx`
### Step 4:编辑/etc/nginx/nginx.conf文件
`sudo vim /etc/nginx/nginx.conf`  
在文件末尾添加类似以下内容
```
>>>>>>> parent of 1ae0db0e (docs for batch proxy data source creation)
stream {
    upstream backend1 {
        server 10.0.34.171:3306  max_fails=3 fail_timeout=30s; # server地址可以使用域名
    }
    server {
        listen 3306;
        proxy_connect_timeout 1s;
        proxy_pass backend1;
    }
}
```
<<<<<<< HEAD
!!! Info 数据库太多时，如何编辑配置文件？
    如果您需要配置多个端口转发，可以使用SDP **批量创建数据源**功能，并通过模版来创建Nginx配置文件。见下面附录。

##### Step 5: 重新加载配置文件
保存配置文件，并重新加载使其生效：`sudo nginx -s reload`

##### Step 7: 测试代理EC2端口转发是否生效 （可选）
在EC2上，安装telnet，并测试本机的7001端口是否可以ping通。
`sudo yum install telnet`
`telnet 127.0.0.1 7001`
如果已经正确配置，您应该看到如下log：
```java
    Trying 127.0.0.1...
    Connected to 127.0.0.1.
```
至此，您已经配置完代理服务器的配置，可以回到SDP UI上手动添加或者批量添加数据源了。

---
### 附录：批量创建从代理服务器转发的数据源

##### Step 1: 下载模版
从SDP UI上面，下载批量创建数据源的模版。

##### Step 2: 编辑excel文件
填入您所需要扫描的数据源。

| InstanceName        | SSL | Description                                                        | JDBC_URL                                     | JDBC_Databases | SecretARN | Username | Password   | AccountID            | Region         | ProviderID |
|---------------------|-----|--------------------------------------------------------------------|----------------------------------------------|----------------|-----------|----------|------------|----------------------|----------------|------------|
| test-instance-7001  | 1   | xxxx1.sql.db.com:23297 | jdbc:mysql://172.31.48.6:7001                |                |           | root     | Temp123456! | 123456789 | ap-guangzhou-1 | 4          |
| test-instance-7002  | 1   | xxxx2.sql.db.com:3306 | jdbc:mysql://172.31.48.6:7002                |                |           | root     | Temp123456! | 123456789 | ap-guangzhou-1 | 4          |



##### Step 3: 生成Nginx软件的config文件
（在本地）打开excel软件，菜单栏点击 Tools → Marco → Visual Basic Editor 功能。


点击运行按钮，会看到excel文件所在目录下生成一个config.txt文件。

```java
// 这个是一个样例。
// 通过EC2的7001端口转发至xxxx1.sql.db.com:23297数据库。
// 通过EC2的7002端口转发至xxxx2.sql.xxdb.com:3306数据库。
stream {
    upstream backend1 {
        server xxxx1.sql.db.com:23297 max_fails=3 fail_timeout=30s;
    }
    server {
        listen 7001; 
        proxy_connect_timeout 2s;
        proxy_pass backend1;
    }
    upstream backend2 {
        server xxxx2.sql.db.com:3306 max_fails=3 fail_timeout=30s;
    }
    server {
        listen 7002; 
        proxy_connect_timeout 2s;
        proxy_pass backend2;
    }
}
```
=======
### Step 5: 重新加载配置文件
`sudo nginx -s reload`
### Step 6: 为实例添加安全组
Proxy安全组添加Rule，允许以下2个安全组的所有TCP进入：`SDPS-CustomDB`、`堆栈名-RDSRDSClient`
### Step 7: （可选）本地测试代理是否生效
```
sudo yum install telnet
telnet 127.0.0.1 7001
```
>>>>>>> parent of 1ae0db0e (docs for batch proxy data source creation)
