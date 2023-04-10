export const AMPLIFY_CONFIG_JSON = '__sdps_solution_amplify_config_json__';
export const BACKEND_URL_KEY = 'BACKEND_URL';

export interface ColumnList {
  id: string;
  label: string;
  sortingField?: any;
  filter: boolean;
}

export interface FilteringOptionsTypes {
  propertyKey: string;
  value: string;
}
