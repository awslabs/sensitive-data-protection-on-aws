import {
  Container,
  FormField,
  Header,
  SpaceBetween,
  Spinner,
  Tiles,
  TilesProps,
} from '@cloudscape-design/components';
import { getSourceProviders } from 'apis/data-source/api';
import { ProviderType } from 'common/ProviderTab';
import { getSourceTypeByProvider } from 'enum/common_types';
import { IJobType } from 'pages/data-job/types/job_list_type';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SelectProviderProps {
  jobData: IJobType;
  changeProvider: (providerId: string) => void;
  changeDataSource: (sourceId: string) => void;
}

const SelectProvider: React.FC<SelectProviderProps> = (
  props: SelectProviderProps
) => {
  const { t } = useTranslation();
  const { jobData, changeProvider, changeDataSource } = props;
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [providerOptionList, setProviderOptionList] = useState<
    TilesProps.TilesDefinition[]
  >([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState<
    TilesProps.TilesDefinition[]
  >([]);

  const getProviders = async () => {
    setLoadingProvider(true);
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
      if (jobData.provider_id) {
        changeProvider(jobData.provider_id.toString());
      } else {
        changeProvider(tmpProviderList[0].value);
      }
    }
    setProviderOptionList(tmpProviderList);
    setLoadingProvider(false);
  };

  useEffect(() => {
    const sourceOptionList = getSourceTypeByProvider(jobData.provider_id).map(
      (e) => {
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
      }
    );
    setDataSourceOptionList(sourceOptionList);
    if (sourceOptionList.length > 0) {
      // has data source
      if (jobData.database_type) {
        changeDataSource(jobData.database_type);
      } else {
        changeDataSource(sourceOptionList[0].value);
      }
    }
  }, [jobData.provider_id]);

  useEffect(() => {
    getProviders();
  }, []);

  return (
    <Container
      header={<Header variant="h2">{t('job:create.selectProvider')}</Header>}
    >
      {loadingProvider ? (
        <Spinner />
      ) : (
        <SpaceBetween direction="vertical" size="l">
          <FormField stretch label={t('job:create.provider')}>
            <Tiles
              onChange={({ detail }) => changeProvider(detail.value)}
              value={jobData.provider_id}
              columns={4}
              items={providerOptionList}
            />
          </FormField>

          <FormField stretch label={t('job:create.dataSource')}>
            <Tiles
              onChange={({ detail }) => changeDataSource(detail.value)}
              value={jobData.database_type}
              columns={4}
              items={dataSourceOptionList}
            />
          </FormField>
        </SpaceBetween>
      )}
    </Container>
  );
};

export default SelectProvider;
