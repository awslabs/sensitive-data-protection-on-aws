## Configuring Database Proxy on EC2

### Create and log in to the proxy EC2 machine, configure forwarding ports
Some users' database Security Groups have restrictions that only allow fixed IP access. In this case, users need an EC2 as a Proxy to provide a fixed IP.

Next, we will create an EC2 instance as a database proxy, install Nginx software, and set up port forwarding. When making a data source connection, SDPS connects to EC2 and makes a JDBC connection to the database through this EC2.

<<<<<<< HEAD
##### Step 1: Create an EC2 Instance
- In the EC2 console. Create an EC2 in the VPC where SDP is located, to be used as a proxy server.
- Configure the EC2 Security Group: Add an Inbound Rule, allowing all TCP entries from the following two security groups: SDPS-CustomDB, Stack Name-RDSRDSClient

##### Step 2: Install Nginx software on EC2
- Copy the EC2's .pem file to the Bastion host for logging into the proxy server.
- From your Bastion host, log in to EC2 using SSH, for example:
  `ssh -i /path/to/your/key.pem ec2-user@ec2-private-ip`
- Run the following commands in sequence to install and start Nginx.
  - Installation: `sudo yum install nginx nginx-mod-stream`
  - Start: `sudo systemctl start nginx`
  - Check status: `systemctl status nginx`

##### Step 3: Configure Nginx software
  - Open the configuration file: `vim /etc/nginx/nginx.conf`
  - Edit the configuration file:
```python
# Replace the default nginx.conf file content with code. You need to make necessary adjustments.
=======
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
>>>>>>> parent of 1ae0db0e (docs for batch proxy data source creation)
stream {
    upstream backend1 {
        server 10.0.34.171:3306  max_fails=3 fail_timeout=30s; 
        # You need to modify the server address to the IP:Port of your target database, you can also use DomainName:Port format.
    }
    server {
        listen 7001; # This EC2 port is used for forwarding requests (Port)
        proxy_connect_timeout 2s;
        proxy_timeout 3s;
        proxy_pass backend1;
    }
}
```
!!! Info How to edit the configuration file when there are many databases?
    If you need to configure multiple port forwarding, you can use the SDP **batch create data source** feature, and create the Nginx configuration file through the template. See below Appendix.

##### Step 5: Reload the configuration file
Save the configuration file and reload it to take effect: `sudo nginx -s reload`

##### Step 7: Test if the proxy EC2 port forwarding is effective (Optional)
On EC2, install telnet, and test if the local 7001 port can be pinged.
`sudo yum install telnet`
`telnet 127.0.0.1 7001`
If configured correctly, you should see the following log:
```java
    Trying 127.0.0.1...
    Connected to 127.0.0.1.
```
Now, you have completed the configuration of the proxy server, you can go back to the SDP UI to manually add or batch add data sources.

---
### Appendix: Batch create data sources forwarded from the proxy server

##### Step 1: Download the template
From the SDP UI, download the template for batch creating data sources.

##### Step 2: Edit the excel file
Fill in the data sources you need to scan.

| InstanceName        | SSL | Description                                                        | JDBC_URL                                     | JDBC_Databases | SecretARN | Username | Password   | AccountID            | Region         | ProviderID |
|---------------------|-----|--------------------------------------------------------------------|----------------------------------------------|----------------|-----------|----------|------------|----------------------|----------------|------------|
| test-instance-7001  | 1   | xxxx1.sql.db.com:23297 | jdbc:mysql://172.31.48.6:7001                |                |           | root     | Temp123456! | 123456789 | ap-guangzhou-1 | 4          |
| test-instance-7002  | 1   | xxxx2.sql.db.com:3306 | jdbc:mysql://172.31.48.6:7002                |                |           | root     | Temp123456! | 123456789 | ap-guangzhou-1 | 4          |

##### Step 3: Generate the Nginx software's config file
(On your local machine) Open the Excel software, in the menu bar click Tools → Macro → Visual Basic Editor.

Click the run button, and a config.txt file will be generated in the directory where the Excel file is located.

```java
// This is a sample.
// Forward through EC2's 7001 port to xxxx1.sql.db.com:23297 database.
// Forward through EC2's 7002 port to xxxx2.sql.xxdb.com:3306 database.
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