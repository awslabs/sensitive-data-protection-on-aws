-- source
alter table source_account change column aws_account_id account_id varchar(255);
alter table source_account change column aws_account_alias account_alias varchar(255);
alter table source_account change column aws_account_email account_email varchar(255);
alter table source_account change column delegated_aws_account_id delegated_account_id varchar(64);
alter table source_account add total_jdbc_instance int default 0 after connect_rds_instance;
alter table source_account add connected_jdbc_instance int default 0 after total_jdbc_instance;
alter table source_account add account_provider varchar(64) default 'aws' after id;
