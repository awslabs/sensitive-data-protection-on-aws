Data identifiers are rules for detecting sensitive data. First, you need to understand what type of data is defined as sensitive in your company, and the identification rules for this sensitive data. Only sensitive data that can be defined using regular expressions or AI can be identified through technical means (such as through this SDP solution).

Once you have defined these data rules (data identifiers), you also need to add them to the [data classification template](data-classification-template.md). The sensitive data scanning task will match the data in the data source with the rules in the template one by one, and then label the data catalogs with data identifiers.

## Built-in data identifiers
The solution provides built-in data identifiers, which are primarily based on privacy data rules classified by country. In the **Manage data identifier** page, in the **Built-in data identifiers** tab, you can see a list of built-in data identifiers. For a full list, please see [Appendix - Built-in data identifiers](appendix-built-in-identifiers.md).

You can you can click the ![edit-icon](docs/../../images/edit-icon.png) to create/edit the properties **Category** and **Identifier label** for these data identifiers. By default, these data identifiers has **Category** property as `PERSONAL` and **Identifier label** property as `S2`/`S3`/`S4`. You can update these properties based on your own definition for sensitive data. 

## Custom Data Identifiers

On the **Manage Data Identifier** page, under the **Custom Data Identifiers** tab, you can see a list of custom data identifiers that you have defined. The list is empty by default. You can create or remove a data identifier based on your definition of sensitive business data.

You can you can click the ![edit-icon](docs/../../images/edit-icon.png) to edit the properties **Category** and **Identifier label** for these data identifiers based on your own definition for sensitive data. For example, you can define category as `FINANCE`/`AUTO`/`GENERAL` and define data sensitivity level as `Level1`/`Level2`/`Level3`/`Level4`.

### Create and edit

To create a new data identifier, select **Create Data Identifier** or to edit a identifier, click into the identifier name.  You will be redirected to the **Data identifier detail** page. 

- When defining identification rules, if you enable both the Regex rule and Keywords rule, a data field must meet both the Regex pattern and match (fully or partially) one of the keywords to be labeled.
- You can create/edit the properties **Category** and **Identifier label** in this page.


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

