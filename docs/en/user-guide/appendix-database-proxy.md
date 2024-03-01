## Using EC2 to configure database agents

Create one EC2 instance as the database proxy. Install Nginx to set port forwarding. For example:


### Step 1:Install
`sudo yum install nginx nginx-mod-stream`
### Step 2:Start
`sudo systemctl start nginx`
### Step 3:View status
`systemctl status nginx`
### Step 4:Edit /etc/nginx/nginx.conf
`sudo vim /etc/nginx/nginx.conf`  
Add content similar to the following at the end of the file
```
stream {
    upstream backend1 {
        server 10.0.34.171:3306  max_fails=3 fail_timeout=30s; # Server address can use domain name
    }
    server {
        listen 3306;
        proxy_connect_timeout 1s;
        proxy_pass backend1;
    }
}
```
### Step 5: Reload configuration file
`sudo nginx -s reload`
### Step 6: Add 2 security groups to the instance
Add Rule to the Proxy security group to allow all TCP entries from the following two security groups:`SDPS-CustomDB`、`StackName-RDSRDSClient`
### Step 7: (Optional) Is the local testing agent effective
```
sudo yum install telnet
telnet 127.0.0.1 7001
```
