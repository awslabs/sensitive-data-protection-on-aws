from common.enum import (
    LabelClassification
)
from catalog.crud import get_catalog_database_level_classification_by_name, get_catalog_table_level_classification_by_database
from .crud import get_labels_by_id_list, search_labels_by_name


def convert_labels(labels):
    if labels is None:
        return None
    return [{"id": label.id, "name": label.label_name} for label in labels]


# {
#     "databaseLabels":
#         {
#             "databaseName":"dbname1",
#              "labels":[
#                 {
#                     "id":1,
#                     "name":"label1"
#                 },
#                 {
#                     "id":2,
#                     "name":"label2"
#                 }
#             ]
#         },
#     "tablesLabels":[
#         {
#             "tableName":"tbname1",
#             "tableLabels":
#                 [
#                     {
#                         "id":3,
#                         "name":"label3"
#                     },
#                     {
#                         "id":4,
#                         "name":"label4"
#                     }
#                 ]
#         },
#         {
#             "tableName":"tbname2",
#             "tableLabels":
#                 [
#                     {
#                         "id":3,
#                         "name":"label3"
#                     },
#                     {
#                         "id":4,
#                         "name":"label4"
#                     }
#                 ]
#         }
#     ]
#  }
# database_name = "dbname1"
# database_labels = [{"id": 1, "name": "label1"}, {"id": 2, "name": "label2"}]
# table_labels = [{"id": 3, "name": "label3"}, {"id": 4, "name": "label4"}]
# table_label_names = {"tbname1": [3, 4], "tbname2": [3, 5]}
def build_result(database_name, database_labels, table_labels, table_label_names):
    result = {"databaseLabels": {"databaseName": database_name, "labels": database_labels}, "tablesLabels": []}
    if table_labels is None:
        return result
    for table_name, label_ids in table_label_names.items():
        labels = [{"id": label["id"], "name": label["name"]} for label in table_labels if label["id"] in label_ids]
        result["tablesLabels"].append({"tableName": table_name, "tableLabels": labels})

    return result


def get_category_labels_by_database(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    need_tabel_labels: bool
):
    database = get_catalog_database_level_classification_by_name(
        account_id,
        region,
        database_type,
        database_name
    )
    if database is None:
        return None
    database_label_ids = database.label_ids
    database_labels = {}
    if database_label_ids is not None:
        database_label_id_list = list(map(int, database_label_ids.split(',')))
        database_labels = get_labels_by_id_list(database_label_id_list)
    if need_tabel_labels is False:
        return build_result(database_name, convert_labels(database_labels), None, None)
    tables = get_catalog_table_level_classification_by_database(
        account_id,
        region,
        database_type,
        database_name
    )
    if tables is None:
        return build_result(database_name, convert_labels(database_labels), None, None)
    table_label_ids = []
    table_label_names = {}
    for table in tables:
        if table.label_ids is None:
            continue
        label_list = table.label_ids.split(',')
        label_id_list = list(map(int, label_list))
        table_label_ids.extend(label_id_list)
        table_label_names[table.table_name] = label_id_list
    table_labels = get_labels_by_id_list(table_label_ids)

    return build_result(
        database_name,
        convert_labels(database_labels),
        convert_labels(table_labels),
        table_label_names
    )


def search_labels(
        label_name: str
):
    return convert_labels(search_labels_by_name(label_name))
