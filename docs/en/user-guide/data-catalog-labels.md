# Tagging Data Catalog

The data catalog provides metadata for your data sources. You can add/update tags to provide more metadata information.

## Sensitive Data Tagging (Automatic or Manual)
After the completion of a sensitive data job, "Privacy Fields" will be automatically tagged based on the job results. Column-level data in the data catalog will be tagged using data identifiers.

You can always manually update the privacy fields in the data catalog.

On the **Browse Data Catalog** page:

- In the S3 tab, at either the bucket or folder level, you can click ![edit-icon](docs/../../images/edit-icon.png) to select privacy tags from a dropdown list.
- In the RDS/Glue/JDBC tabs, at either the instance or table level, you can click ![edit-icon](docs/../../images/edit-icon.png) to select privacy tags from a dropdown list.

## Custom Tagging (Manual)
You can add business-related tags (such as business line, department, team, etc.) using the "Custom Tags" field in the data catalog.

On the **Browse Data Catalog** page:

- In the S3 tab, at either the bucket or folder level, you can click ![edit-icon](docs/../../images/edit-icon.png) to select custom tags from a dropdown list.
- In the RDS/Glue/JDBC tabs, at either the instance or table level, you can click ![edit-icon](docs/../../images/edit-icon.png) to select custom tags from a dropdown list.

At the bottom of the dropdown list, click the **Manage Custom Tags** link, which will open a window where you can **Add/Edit/Delete** custom tags.
