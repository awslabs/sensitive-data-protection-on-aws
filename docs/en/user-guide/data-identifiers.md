# Step 2: Define Classification and Grading Templates

## Concept
- Data identifiers are specific rules for detecting certain sensitive data, such as identifiers for ID cards, email addresses, names, etc.
- A template is a collection of data identifiers. Templates will be used in sensitive data discovery jobs.

!!! Info "Best Practices"
    You need to understand what kind of data is defined as sensitive in your company and the identification rules for these sensitive data. Only those sensitive data that can be defined by regular expressions or AI can be identified by technical means (e.g., using the SDP solution). After defining data identifiers, you need to add them to a template. When running a sensitive data scanning task, it will match the data in the data source against the rules in the template and mark them in the data catalog.

## View and Edit Built-in Data Identifiers

The solution provides built-in data identifiers, which are mainly based on national privacy data rules.

On the **Manage Data Identification Rules** page, in the **Built-in Data Identifiers** tab, you can see a list of built-in data identifiers. For the complete list, please refer to [Appendix - Built-in Data Identifiers](appendix-built-in-identifiers.md).

You can click ![edit-icon](docs/../../images/edit-icon.png) to edit and adjust the data grading classification. By default, these data identifiers have a `PERSONAL` category attribute and `S2`/`S3`/`S4` identifier label attributes. You can update these attributes according to your sensitive data.

![edit-icon](docs/../../images/cn-identifier-list.png) 

## Create and Edit Custom Data Identifiers
On the **Manage Data Identification Rules** page, in the **Custom Data Identifiers** tab, you can see your defined list of custom data identifiers. By default, this list is empty. You can create or delete data identifiers based on business-sensitive data.

You can click ![edit-icon](docs/../../images/edit-icon.png) to edit and adjust the data grading classification. For example, you can define the category as `FINANCE`/`AUTO`/`GENERAL`, and set the data sensitivity level to `Level1`/`Level2`/`Level3`/`Level4`.

To create a new data identifier, select **Create Text-based Data Identifier**.
![edit-icon](docs/../../images/cn-custom-identifier-create.png)

On the data identifier creation page, you can define rules for sensitive data scanning, as detailed in the following table.
![edit-icon](docs/../../images/cn-custom-identifier.png) 

| Parameter                    | Required | Description                                                                                                   |
|------------------------------|----------|---------------------------------------------------------------------------------------------------------------|
| **Name**                     | Yes      | The name of the data identifier, used for automatic marking when sensitive data is scanned.                   |
| **Description**              | Optional | Additional explanation of the identifier, helpful for understanding its use and context.                      |
| **Identification Rules**     | Yes      | Defines the rules for identifying data, which can be based on column name keywords, regular expressions, or a combination of both. |
| **Identifier Attributes**    | Optional | Allows for classification and grading of identifiers, e.g., by industry (Finance, Game, Personal, etc.) or security level (S1, S2, S3, etc.). |
| **Advanced Rules: Exclude Keywords** | Optional | Defines column name keywords that should not be marked as sensitive data.                                    |
| **Advanced Rules: Unstructured Data** | Optional | Applicable for specific security levels (like S3), includes settings for the frequency of rule occurrence and the number of characters between keywords and regular expressions. |

## Add Data Identifiers to Template

1. In the left menu, select **Define Classification Template**.
2. Choose **Add Data Identifier**. You will see a sidebar displaying all data identifiers.
3. Select one or more data identifiers and choose **Add to Template**.
![edit-icon](docs/../../images/cn-identifier-to-template.png) 



## Example: how data identifiers are labeled in data catalog after sensitive data discovery job.

Assume we want to detect sensitive data in this table named **"PizzaOrderTable"**

| id | user_name      | email_address        | order_id   |
|----|----------------|----------------------|------------|
| 1  | aaa_frankzhu   | frankzhu@mail.com    | 12344536   |
| 2  | aaa_zheng      | zhm@mail.com         | 12344536   |
| 3  | aaa_patrickpark| ppark@example.com    | 12344536   |
| 4  | aaa_kyle       | kyle@qq.com          | 1230000    |

For example, we define 5 custom data identifiers:

| Identifier Name | Regex                                              | Keyword                                       |
|-----------------|----------------------------------------------------|-----------------------------------------------|
| OrderInfo1      | OrderInfo1                                         | order                                         |
| OrderInfo2      | (disabled)                                         | _id                                           |
| UserEmail       | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | (disabled)                                    |
| EmailAddress    | (disabled)                                         | themail, email-address, email_address         |
| UserPrefix      | aaa_                                               | user                                          |
 
 Assume all the above identifiers were added in classification template, and then we started a discovery job. "PizzaOrderTable" data catalog result is as below:

| Column         | Identifiers             | Privacy       |
|----------------|-------------------------|---------------|
| id             | N/A                     | Non-PII       |
| user_name      | UserPrefix              | Contain-PII   |
| email_address  | UserEmail, EmailAddress | Contain-PII   |
| order_id       | OrderInfo2              | Contain-PII   |

**Explanation for Identifiers:**

- The identifier "OrderInfo1" is not matched because the regex does not match the data pattern.
- The identifier "OrderInfo2" is labeled on the "order_id" column because the keyword "_id" partially matches the column name "order_id".
- The identifier "UserEmail" is labeled on the "email_address" column because the regex matches the data pattern of the "email_address" column values.
- The identifier "EmailAddress" is labeled on the "email_address" column because one of the keywords "email_address" matches the column name.
- The identifier "UserPrefix" is labeled on the "user_name" column because both the regex and keywords match.

**Explanation for Privacy labels:**

- Columns "user_name", "email_address", and "order_id" are labeled as (Contain-PII) privacy label because identifiers are matched.
- Column "id" is labeled as (Non-PII) privacy label because no identifier is matched.

