import {
  Button,
  Container,
  Form,
  FormField,
  Header,
  Input,
  Select,
  SelectProps,
  SpaceBetween,
} from '@cloudscape-design/components';
import { getProviderRegions, addAccount } from 'apis/account-manager/api';
import { ProviderType } from 'common/ProviderTab';
import MapMarker from 'pages/summary/comps/charts/items/MapMarker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { RouterEnum } from 'routers/routerEnum';

interface AccountFormProps {
  provider: ProviderType;
}

const AccountForm: React.FC<AccountFormProps> = (props: AccountFormProps) => {
  const { provider } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const list: any[] = [];
  const [regionGeo, setRegionGeo] = useState<any[]>([]);
  const [coorMap, setCoorMap] = useState<Map<string, string>>();
  const [regionList, setRegionList] = useState<SelectProps.Option[]>([]);
  const [accountId, setAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<SelectProps.Option | null>(
    null
  );

  const coorMapTemp = new Map();
  const getRegionListByProvider = async (provider_id: any) => {
    provider_id = parseInt(provider_id) === 4 ? 1 : provider_id;
    const accountData = await getProviderRegions(parseInt(provider_id));
    if (Array.isArray(accountData)) {
      accountData.forEach((item) => {
        list.push({
          label: item['region_name'],
          id: item['id'],
          labelTag: item['region_alias'],
        });
        coorMapTemp.set(item['region_name'], item['region_cord']);
      });
    }
    setRegionList(list);
    setCoorMap(coorMapTemp);
  };

  const changeRegion = (option: SelectProps.Option) => {
    setRegionGeo([
      {
        markerOffset: 25,
        name: option.labelTag,
        region: option.label,
        coordinates: [
          coorMap?.get(option.label || '')?.split(',')[0],
          coorMap?.get(option.label || '')?.split(',')[1],
        ],
      },
    ]);
  };

  const addAccountButton = async () => {
    setIsLoading(true);
    try {
      await addAccount({
        account_provider: provider.id,
        account_id: accountId,
        region: currentRegion?.label,
      });
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }

    navigate(`${RouterEnum.AccountManagement.path}?provider=${provider.id}`);
  };

  useEffect(() => {
    //  console.log()
    getRegionListByProvider(provider.id);
    //  const list: any[] = [];
  }, []);

  return (
    <div className="mt-20 account-map">
      <Form
        variant="full-page"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              formAction="none"
              variant="link"
              onClick={() => {
                navigate(-1);
              }}
            >
              {t('button.cancel')}
            </Button>
            <Button
              loading={isLoading}
              disabled={isLoading || accountId.length < 1}
              variant="primary"
              onClick={() => {
                addAccountButton();
              }}
            >
              {t('button.addThisAccount')}
            </Button>
          </SpaceBetween>
        }
      >
        <Container
          header={<Header variant="h3">{t('account:add.basicInfo')}</Header>}
        >
          <SpaceBetween direction="vertical" size="xs">
            <FormField label={t('account:add.provider')}>
              <div className="add-account-logo">
                <div className="name">{provider.provider_name}</div>
                <div className="desc">{provider.description}</div>
                <div className="image">
                  <img width="100%" src={`/logos/${provider.id}.svg`} alt="" />
                </div>
              </div>
            </FormField>
            <FormField label={t('account:add.accountId')}>
              <Input
                placeholder={t('account:add.accountIdPlaceholder') ?? ''}
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.detail.value);
                }}
              />
            </FormField>
            <FormField label={t('account:add.regionLocation')}>
              <Select
                onChange={(e) => {
                  setCurrentRegion(e.detail.selectedOption);
                  changeRegion(e.detail.selectedOption);
                }}
                placeholder={t('account:add.regionLocationPlaceholder') ?? ''}
                options={regionList}
                selectedOption={currentRegion}
              />
              {currentRegion && (
                <ComposableMap>
                  <Geographies geography="/geo.json">
                    {({ geographies }: any) =>
                      geographies.map((geo: any) => (
                        <Geography key={geo.rsmKey} geography={geo} />
                      ))
                    }
                  </Geographies>
                  {regionGeo?.map(
                    ({ name, region, coordinates, markerOffset }, index) => (
                      <MapMarker
                        key={index}
                        coordinates={coordinates}
                        name={region}
                        markerOffset={markerOffset}
                        showPopover={(e) => {
                          console.info(e);
                        }}
                        markerMouseover={(e) => {
                          console.info(e);
                        }}
                      />
                    )
                  )}
                </ComposableMap>
              )}
            </FormField>
          </SpaceBetween>
        </Container>
      </Form>
    </div>
  );
};

export default AccountForm;
