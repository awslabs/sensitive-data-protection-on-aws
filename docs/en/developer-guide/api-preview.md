This document only lists the main operation interfaces for each module. For more details, please refer to [OPENAPI](../openapi.json)

## APIs Related to Data Sources
| url | Function | Rate Limit (requests per second) |
|--------------------|-------------------|-------|
| /data-source/add_account | Add Account | 10 |
| /data-source/delete_account | Delete Account | 10 |
| /data-source/add-jdbc-conn | Add Data Source | 10 |
| /data-source/update-jdbc-conn | Edit Data Source | 10 |
| /data-source/delete-jdbc | Delete Data Source | 10 |


## APIs Related to Job
| url | Function | Rate Limit (requests per second) |
|--------------------|-------------------|-------|
| /discovery-jobs | Create Job | 10 |
| /discovery-jobs/{job_id}/start | Start Job | 10 |

## APIs Related to Identifier
| url | Function | Rate Limit (requests per second) |
|--------------------|-------------------|-------|
| /template/identifiers | Create Recognition Rule | 10 |
| /template/template-mappings | Add Recognition Rule to Template | 10 |