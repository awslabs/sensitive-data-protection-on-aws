在 **运行敏感数据发现作业** 页面上，单击特定作业以打开窗口。在 **作业历史记录** 标签页中，选择特定作业，然后选择 **下载报告** 以 Excel 格式（.xlsx）下载报告。

在报告中，每个数据源都在单独的工作表（标签）中。例如，敏感数据发现作业针对 S3 和 RDS 运行：

S3 工作表为：

| account_id | region | s3_bucket | s3_location | column_name | identifiers | sample_data |
| --- | --- | --- | --- | --- | --- | --- |
| 177416885226 | cn-northwest-1 | sdps-beta-member | s3://sdps-beta-member/ | col1 | [{identifier=CHINESE-NAME, score=0.6680557137733704}] | [cn_****, 魏**, 梁*, , , , 尹**, 汉*, , 鲁**] |
| 177416885226 | cn-northwest-1 | sdps-beta-member | s3://sdps-beta-member/ | col2 | [{identifier=ADDRESS, score=0.6929563446207209}] | [cn_*******, , 海南省省直辖县***************, 湖北省武汉市************, , 贵州省六盘***********, 湖北省随州市************, 上海市市辖区嘉***************, 山西省忻州**********, 贵州省铜仁市***********] |

RDS 工作表为：

| account_id | region | rds_instance_id | table_name | column_name | identifiers | sample_data |
| --- | --- | --- | --- | --- | --- | --- |
| 640463273335 | cn-northwest-1 | db-instance-2 | orderpaymentdb_orderpaymenttable | cn_bank_card | [{identifier=BANK-CARD-NUMBER, score=0.5269872423945045}] | [62426***********, 62061***********, 627582************, 625612***********, 624299************, 3462*********, 627119************, 426927***********, 620930************, 62385***********] |
| 640463273335 | cn-northwest-1 | db-instance-1-instance-1 | shipmenttrackingdb_shipmenttable | cn_car_license | [{identifier=ADDRESS, score=0.10789832248611221}, {identifier=NUMBER-PLATE, score=1.0}] | [津JE****, 琼WM****, 豫RU****, 藏GK****, 黑YR****, 沪VK****, 京R7****, 晋D3****, 苏T *****, 渝C1****] |