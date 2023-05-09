# Label data catalog

Data catalog provides metadata for your data source. You can add/update labels for it to give more information of the metadata.

## Sensitive data labeling (automatic or manual)
After sensitive data job is completed, the "Privacy field" will be automatically tagged based on job result. Column-level data in data catalogs, will be labeled with data identifiers.

You can always manual update the Privacy field in data catalog. 

In the **Browse data catalogs** webpage: 

- In S3 tab, either on Bucket or Folder level, you can click the ![edit-icon](docs/../../images/edit-icon.png) to select Privacy label.
- In RDS tab, either on Instance or Table level, you can click the ![edit-icon](docs/../../images/edit-icon.png) to select Privacy label.

## Custom labeling (manual)
You can use "Custom label" field in data catalog to add business related label (e.g. Line of business, department, team, etc). 

In the **Browse data catalogs** webpage: 

- In S3 tab, either on Bucket or Folder level, you can click the ![edit-icon](docs/../../images/edit-icon.png) to select Custom label from dropdown list.
- In RDS tab, either on Instance or Table level, you can click the ![edit-icon](docs/../../images/edit-icon.png) to select Custom label from dropdown list. 

At the bottom of dropdown list, click **Manage custom label** link, there will be a pop-up window, in which you can **Add/Edit/Delete** a custom label. 



