## 配置EC2数据库代理

创建1个EC2实例作为数据库代理。安装iptables 设置端口转发。例如:

'''
Step1: 安装 
> sudo yum install iptables
Step2: 启用IP转发。在Linux上，IP转发通常默认禁用。要启用它，编辑/etc/sysctl.conf文件，修改或添加以下内容
> net.ipv4.ip_forward = 1
Step3: 应用新的sysctl设置
> sudo sysctl -p /etc/sysctl.conf
Step4: 设置转发规则
> # 其他机器，只能是IP，不能是域名
> sudo iptables -t nat -A PREROUTING -p tcp --dport 444 -j DNAT --to 192.168.1.100:3000
> sudo iptables -t nat -A POSTROUTING -j MASQUERADE
Step5: 保存规则以便重启有效
> sudo service iptables save
Step6: 查看NAT规则
> sudo iptables -L -n -v --line-numbers -t nat
'''