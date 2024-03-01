## 使用EC2配置数据库代理

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
### Step 5: 重新加载配置文件
`sudo nginx -s reload`
### Step 6: 为实例添加安全组
Proxy安全组添加Rule，允许以下2个安全组的所有TCP进入：`SDPS-CustomDB`、`堆栈名-RDSRDSClient`
### Step 7: （可选）本地测试代理是否生效
```
sudo yum install telnet
telnet 127.0.0.1 7001
```
