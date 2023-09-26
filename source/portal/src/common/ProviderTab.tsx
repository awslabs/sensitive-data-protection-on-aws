import { Tabs } from '@cloudscape-design/components';
import { getSourceProviders } from 'apis/data-source/api';
import React, { useEffect, useState } from 'react';

export interface ProviderType {
  status: number;
  id: number;
  provider_name: string;
  create_by: string;
  modify_by: string;
  description: string;
  version: string;
  create_time: string;
  modify_time: string;
}

interface ProviderTabProps {
  changeProvider: (id: ProviderType) => void;
  loadingProvider: (loading: boolean) => void;
}

const ProviderTab: React.FC<ProviderTabProps> = (props: ProviderTabProps) => {
  const { changeProvider, loadingProvider } = props;
  const [providers, setProviders] = useState([]);
  const [providerTabList, setProviderTabList] = useState([]);

  const getProviders = async () => {
    loadingProvider(true);
    const providers: any = await getSourceProviders({});
    const tmpTabList: any = [];
    providers.forEach((element: ProviderType) => {
      tmpTabList.push({
        label: element.provider_name,
        id: element.id,
      });
    });
    if (providers.length > 0) {
      changeProvider(providers[0]);
    }
    setProviders(providers);
    setProviderTabList(tmpTabList);
    loadingProvider(false);
  };

  useEffect(() => {
    getProviders();
  }, []);

  return (
    <div>
      <Tabs
        disableContentPaddings
        tabs={providerTabList}
        onChange={(e) => {
          changeProvider(
            providers.find(
              (element: ProviderType) =>
                element.id.toString() === e.detail.activeTabId.toString()
            ) ?? providers[0]
          );
        }}
      />
    </div>
  );
};

export default ProviderTab;
