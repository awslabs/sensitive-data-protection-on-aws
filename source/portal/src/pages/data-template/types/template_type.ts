export const TEMPLATE_COLUMN_LIST = [
  {
    id: 'name',
    label: 'table.label.dataIdentifierName',
    filter: true,
    sortingField: 'name',
  },
  {
    id: 'description',
    label: 'table.label.description',
    filter: true,
  },
  {
    id: 'type',
    label: 'table.label.source',
    filter: false,
  },
  {
    id: 'identifier-type',
    label: 'table.label.identifierType',
    filter: false,
  },
  {
    id: 'enabled',
    label: 'table.label.enabled',
    filter: false,
  },
];

export const DEFAULT_TEMPLATE = {
  label: 'Current data classification template',
  value: '1',
};
