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

export const nFormatter = (num: any, digits: any) => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
    : '0';
};
