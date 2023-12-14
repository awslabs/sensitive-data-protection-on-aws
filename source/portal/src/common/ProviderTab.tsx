import { Tabs } from '@cloudscape-design/components';
import { getSourceProviders } from 'apis/data-source/api';
import { getJDBCTypeByProviderId } from 'enum/common_types';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  jdbc_type: string;
}

interface ProviderTabProps {
  changeProvider: (id: ProviderType) => void;
  loadingProvider: (loading: boolean) => void;
}

const ProviderTab: React.FC<ProviderTabProps> = (props: ProviderTabProps) => {
  const { changeProvider, loadingProvider } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const [activatedId, setActivatedId] = useState('');
  const [providers, setProviders] = useState([]);
  const [providerTabList, setProviderTabList] = useState([]);
  const queryParams = new URLSearchParams(location.search);
  const defaultProvider = queryParams.get('provider');

  const getProviders = async () => {
    loadingProvider(true);
    const providers: any = await getSourceProviders();
    const tmpTabList: any = [];
    providers.forEach((element: ProviderType) => {
      if (element.id !== 4) {
        tmpTabList.push({
          label: element.provider_name,
          id: element.id.toString(),
          jdbc_type: getJDBCTypeByProviderId(element.id),
        });
      }
    });
    if (providers.length > 0) {
      // has default provider
      if (defaultProvider) {
        const defaultObj = providers.find(
          (item: any) => item.id === parseInt(defaultProvider)
        );
        console.info('defaultObj:', defaultObj);
        changeProvider(defaultObj);
        setActivatedId(defaultProvider);
      } else {
        setActivatedId(providers?.[0]?.id?.toString());
        changeProvider(providers[0]);
      }
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
        activeTabId={activatedId}
        onChange={(e) => {
          const queryParams = new URLSearchParams();
          // if (!queryParams.has("provider")) {
          //   // URL没有provider，不进行任何操作
          //   return;
          // }
          // 如果存在，则修改参数的值
          queryParams.set('provider', e.detail.activeTabId);
          //将新的查询字符串push到历史堆栈中
          navigate(location.pathname + '?' + queryParams.toString());
          // window.history.replaceState(null, '', `?${queryParams.toString()}`);
          setActivatedId(e.detail.activeTabId);
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
