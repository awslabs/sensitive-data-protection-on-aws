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
import { ProviderType } from 'common/ProviderTab';
import MapMarker from 'pages/summary/comps/charts/items/MapMarker';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { RouterEnum } from 'routers/routerEnum';

interface AccountFormProps {
  provider: ProviderType;
}

const AccountForm: React.FC<AccountFormProps> = (props: AccountFormProps) => {
  const { provider } = props;
  const navigate = useNavigate();
  const [regionGeo, setRegionGeo] = useState<any[]>([]);
  const [regionList, setRegionList] = useState<SelectProps.Option[]>([]);
  const [accountId, setAccountId] = useState('');
  const [currentRegion, setCurrentRegion] = useState<SelectProps.Option | null>(
    null
  );

  const getRegionListByProvider = () => {
    if (provider.id === 2) {
      setRegionList([{ label: 'tencent', value: 'tencent' }]);
    }
    if (provider.id === 3) {
      setRegionList([{ label: 'google', value: 'google' }]);
    }
  };

  const changeRegion = (option: SelectProps.Option) => {
    setRegionGeo([
      {
        markerOffset: 25,
        name: 'Northern Virginia (US East)',
        region: 'us-east-1',
        coordinates: [-77.0469, 38.8048],
      },
    ]);
  };

  const addAccount = () => {
    navigate(RouterEnum.AccountManagement.path, {
      state: { activeTab: provider.id },
    });
  };

  useEffect(() => {
    getRegionListByProvider();
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
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                addAccount();
              }}
            >
              Add this account
            </Button>
          </SpaceBetween>
        }
      >
        <Container
          header={<Header variant="h3">Basic source information</Header>}
        >
          <SpaceBetween direction="vertical" size="xs">
            <FormField label="Source">
              <div className="add-account-logo">
                <div className="name">{provider.provider_name}</div>
                <div className="desc">{provider.description}</div>
                <div className="image">
                  <img width="100%" src={`/logos/${provider.id}.svg`} alt="" />
                </div>
              </div>
            </FormField>
            <FormField label="Account id">
              <Input
                placeholder="Account id"
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.detail.value);
                }}
              />
            </FormField>
            <FormField label="Region/Location">
              <Select
                onChange={(e) => {
                  setCurrentRegion(e.detail.selectedOption);
                  changeRegion(e.detail.selectedOption);
                }}
                placeholder="Select a region"
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
