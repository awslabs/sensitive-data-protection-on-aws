import { Select, SelectProps } from '@cloudscape-design/components';
import { getProviderRegions } from 'apis/account-manager/api';
import { ProviderType } from 'common/ProviderTab';
import React, { useEffect, useState } from 'react';

interface RegionSelectorProps {
  currentProvider?: ProviderType;
}

const RegionSelector: React.FC<RegionSelectorProps> = (
  props: RegionSelectorProps
) => {
  const { currentProvider } = props;
  const [regionOptionList, setRegionOptionList] = useState<
    SelectProps.Option[]
  >([]);
  const [currentRegion, setCurrentRegion] = useState<SelectProps.Option | null>(
    {
      label: 'All Regions',
      value: '',
    }
  );
  const getRegionListByProvider = async (provider_id: any) => {
    const accountData = await getProviderRegions(parseInt(provider_id));
    const tmpOptionList: SelectProps.Option[] = [
      {
        label: 'All Regions',
        value: '',
      },
    ];
    if (Array.isArray(accountData)) {
      accountData.forEach((item) => {
        tmpOptionList.push({
          label: item['region_name'],
          value: item.id,
          labelTag: item['region_alias'],
        });
      });
    }
    setRegionOptionList(tmpOptionList);
  };

  useEffect(() => {
    if (currentProvider) {
      getRegionListByProvider(currentProvider.id);
    }
  }, [currentProvider]);

  return (
    <Select
      onChange={(e) => {
        setCurrentRegion(e.detail.selectedOption);
      }}
      placeholder="Select a region"
      options={regionOptionList}
      selectedOption={currentRegion}
    />
  );
};

export default RegionSelector;
