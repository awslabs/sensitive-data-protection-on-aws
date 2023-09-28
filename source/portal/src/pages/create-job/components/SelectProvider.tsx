import {
  Container,
  FormField,
  Header,
  SpaceBetween,
  Tiles,
  TilesProps,
} from '@cloudscape-design/components';
import { getSourceProviders } from 'apis/data-source/api';
import { ProviderType } from 'common/ProviderTab';
import { getSourceTypeByProvider } from 'enum/common_types';
import React, { useEffect, useState } from 'react';

const SelectProvider = () => {
  const [provider, setProvider] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [providerOptionList, setProviderOptionList] = useState<
    TilesProps.TilesDefinition[]
  >([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState<
    TilesProps.TilesDefinition[]
  >([]);

  const getProviders = async () => {
    const providers: any = await getSourceProviders();
    const tmpProviderList: TilesProps.TilesDefinition[] = [];
    providers.forEach((element: ProviderType) => {
      tmpProviderList.push({
        label: element.provider_name,
        description: element.description,
        image: (
          <img
            width="70%"
            src={`/logos/${element.id}.svg`}
            alt={element.provider_name}
          />
        ),
        value: element.id.toString(),
      });
    });
    if (providers.length > 0) {
      setProvider(tmpProviderList[0].value);
    }
    setProviderOptionList(tmpProviderList);
  };

  useEffect(() => {
    const sourceOptionList = getSourceTypeByProvider(provider).map((e) => {
      return {
        ...e,
        image: (
          <img
            width="50%"
            src={`/logos/source/${
              e.value.startsWith('jdbc') ? 'db' : e.value
            }.svg`}
            alt={e.label}
          />
        ),
      };
    });
    setDataSourceOptionList(sourceOptionList);
    if (sourceOptionList.length > 0) {
      setDataSource(sourceOptionList[0].value);
    }
  }, [provider]);

  useEffect(() => {
    getProviders();
  }, []);

  return (
    <Container header={<Header variant="h2">Cloud Provider</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <FormField stretch label="Source">
          <Tiles
            onChange={({ detail }) => setProvider(detail.value)}
            value={provider}
            columns={4}
            items={providerOptionList}
          />
        </FormField>

        <FormField stretch label="Data store">
          <Tiles
            onChange={({ detail }) => setDataSource(detail.value)}
            value={dataSource}
            columns={4}
            items={dataSourceOptionList}
          />
        </FormField>
      </SpaceBetween>
    </Container>
  );
};

export default SelectProvider;
