export interface ConfigItem {
  config_key: string;
  config_value: string;
}

export interface ConfigSubnet {
  subnet_id: string;
  name: string;
  available_ip_address_count: number;
}
