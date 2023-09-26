import {
  AppLayout,
  Button,
  Checkbox,
  Container,
  ContentLayout,
  Form,
  FormField,
  Header,
  Input,
  Select,
  SelectProps,
  SpaceBetween,
  Tiles,
} from '@cloudscape-design/components';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RouterEnum } from 'routers/routerEnum';

const AddJDBCConnection = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.dataSourceConnection'),
      href: RouterEnum.DataSourceConnection.path,
    },
  ];

  const [jdbcType, setJdbcType] = useState('import');
  const [credential, setCredential] = useState('secret');
  const [sameWithGlue, setSameWithGlue] = useState(false);
  const [importGlue, setImportGlue] = useState<SelectProps.Option | null>(null);
  const [secretItem, setSecretItem] = useState<SelectProps.Option | null>(null);

  return (
    <AppLayout
      toolsHide
      content={
        <ContentLayout>
          <Container
            header={
              <Header variant="h3">Connect to custom database(JDBC)</Header>
            }
          >
            <Form
              variant="full-page"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button formAction="none" variant="link">
                    Cancel
                  </Button>
                  <Button>Test connection</Button>
                  <Button variant="primary">Save</Button>
                </SpaceBetween>
              }
            >
              <SpaceBetween direction="vertical" size="s">
                <FormField label="Select a Glue connection">
                  <Tiles
                    onChange={({ detail }) => setJdbcType(detail.value)}
                    value={jdbcType}
                    items={[
                      { label: 'Import glue connection', value: 'import' },
                      { label: 'Create new connection', value: 'new' },
                    ]}
                  />
                </FormField>

                {jdbcType === 'import' && (
                  <>
                    <FormField
                      label="Glue connection"
                      description="Choose an existing Glue connection from AWS account where the SDP platform installed."
                    >
                      <Select
                        placeholder="Please select secret"
                        selectedOption={importGlue}
                        onChange={({ detail }) =>
                          setImportGlue(detail.selectedOption)
                        }
                        options={[
                          { label: 'glue-connection-1', value: '1' },
                          { label: 'glue-connection-2', value: '2' },
                        ]}
                      />
                    </FormField>
                  </>
                )}

                <FormField label="Data store name">
                  <SpaceBetween direction="vertical" size="xs">
                    <Input
                      placeholder="data store name"
                      value=""
                      disabled={sameWithGlue}
                    />
                    {jdbcType === 'import' && (
                      <Checkbox
                        onChange={({ detail }) =>
                          setSameWithGlue(detail.checked)
                        }
                        checked={sameWithGlue}
                      >
                        Same with Glue connection name
                      </Checkbox>
                    )}
                  </SpaceBetween>
                </FormField>

                {jdbcType === 'new' && (
                  <>
                    <FormField
                      label="Glue connection name (auto-assigned)"
                      description="Create a new Glue connection from AWS account where the SDP platform is installed"
                    >
                      <Input
                        value="sdps-source:google-accountid:12345666-custom-data-store-jdbc"
                        disabled
                      />
                    </FormField>
                    <>
                      <FormField label="JDBC URL">
                        <Input placeholder="jdbc:xxx.xxx" value="" />
                      </FormField>
                      <FormField label="JDBC Driver Class name - optional">
                        <Input placeholder="jdbc:xxx.xxx" value="" />
                      </FormField>
                      <FormField label="JDBC Driver S3 path - optional">
                        <Input placeholder="s3://xxxx" value="" />
                      </FormField>
                    </>

                    <FormField label="Credentials">
                      <Tiles
                        onChange={({ detail }) => setCredential(detail.value)}
                        value={credential}
                        items={[
                          { label: 'Secret Manager', value: 'secret' },
                          { label: 'Username/Password', value: 'password' },
                        ]}
                      />
                    </FormField>

                    {credential === 'secret' && (
                      <FormField label="Secrets">
                        <Select
                          placeholder="Please select secret"
                          selectedOption={secretItem}
                          onChange={({ detail }) =>
                            setSecretItem(detail.selectedOption)
                          }
                          options={[
                            { label: 'sdps-secret-1', value: '1' },
                            { label: 'sdps-secret-2', value: '2' },
                          ]}
                        />
                      </FormField>
                    )}

                    {credential === 'password' && (
                      <>
                        <FormField label="Username">
                          <Input placeholder="db-name" value="" />
                        </FormField>
                        <FormField label="Password">
                          <Input placeholder="******" value="" />
                        </FormField>
                      </>
                    )}
                  </>
                )}
              </SpaceBetween>
            </Form>
          </Container>
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={
        <Navigation activeHref={RouterEnum.DataSourceConnection.path} />
      }
      navigationWidth={290}
    />
  );
};

export default AddJDBCConnection;
