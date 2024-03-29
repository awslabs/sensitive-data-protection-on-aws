On the **Run sensitive data discovery job** page, click into a specific job to open a window. In the **Job history** tab, choose a specific job, and choose **Download report** to download report in Excel format (.xlsx). 

In the report, each data source is in a separate sheet (tab). For example, a sensitive data discovery job runs for S3 and RDS:

The S3 sheet is:

| account_id | region | s3_bucket | s3_location | column_name | identifiers | sample_data |
| --- | --- | --- | --- | --- | --- | --- |
| 177416885226 | cn-northwest-1 | sdps-beta-member | s3://sdps-beta-member/ | col1 | [{identifier=CHINESE-NAME, score=0.6680557137733704}] | [cn_****, 魏**, 梁*, , , , 尹**, 汉*, , 鲁**] |
| 177416885226 | cn-northwest-1 | sdps-beta-member | s3://sdps-beta-member/ | col2 | [{identifier=ADDRESS, score=0.6929563446207209}] | [cn_*******, , 海南省省直辖县***************, 湖北省武汉市************, , 贵州省六盘***********, 湖北省随州市************, 上海市市辖区嘉***************, 山西省忻州**********, 贵州省铜仁市***********] |

The RDS sheet is:

| account_id | region | rds_instance_id | table_name | column_name | identifiers | sample_data |
| --- | --- | --- | --- | --- | --- | --- |
| 640463273335 | cn-northwest-1 | db-instance-2 | orderpaymentdb_orderpaymenttable | cn_bank_card | [{identifier=BANK-CARD-NUMBER, score=0.5269872423945045}] | [62426***********, 62061***********, 627582************, 625612***********, 624299************, 3462*********, 627119************, 426927***********, 620930************, 62385***********] |
| 640463273335 | cn-northwest-1 | db-instance-1-instance-1 | shipmenttrackingdb_shipmenttable | cn_car_license | [{identifier=ADDRESS, score=0.10789832248611221}, {identifier=NUMBER-PLATE, score=1.0}] | [津JE****, 琼WM****, 豫RU****, 藏GK****, 黑YR****, 沪VK****, 京R7****, 晋D3****, 苏T *****, 渝C1****] |