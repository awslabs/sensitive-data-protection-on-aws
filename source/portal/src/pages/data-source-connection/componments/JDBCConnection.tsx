import {
  Button,
  Checkbox,
  Form,
  FormField,
  Input,
  Select,
  SelectProps,
  SpaceBetween,
  Tiles,
} from '@cloudscape-design/components';
import RightModal from 'pages/right-modal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface JDBCConnectionProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const JDBCConnection: React.FC<JDBCConnectionProps> = (
  props: JDBCConnectionProps
) => {
  const { t } = useTranslation();
  const { showModal, setShowModal } = props;
  const [jdbcType, setJdbcType] = useState('import');
  const [credential, setCredential] = useState('secret');
  const [sameWithGlue, setSameWithGlue] = useState(false);
  const [importGlue, setImportGlue] = useState<SelectProps.Option | null>(null);
  const [secretItem, setSecretItem] = useState<SelectProps.Option | null>(null);

  return (
    <RightModal
      className="detail-modal"
      setShowModal={(show) => {
        setShowModal(show);
      }}
      showModal={showModal}
      header="Add JDBC Connection"
      showFolderIcon={true}
    >
      <div className="add-jdbc-container">
        <Form
          variant="full-page"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setShowModal(false);
                }}
                formAction="none"
                variant="link"
              >
                {t('button.cancel')}
              </Button>
              <Button>Test connection</Button>
              <Button variant="primary">{t('button.save')}</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween direction="vertical" size="s">
            <FormField stretch label="Select a Glue connection">
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
                  stretch
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

            <FormField stretch label="Data store name">
              <SpaceBetween direction="vertical" size="xs">
                <Input
                  placeholder="data store name"
                  value=""
                  disabled={sameWithGlue}
                />
                {jdbcType === 'import' && (
                  <Checkbox
                    onChange={({ detail }) => setSameWithGlue(detail.checked)}
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
                  stretch
                  label="Glue connection name (auto-assigned)"
                  description="Create a new Glue connection from AWS account where the SDP platform is installed"
                >
                  <Input
                    value="sdps-source:google-accountid:12345666-custom-data-store-jdbc"
                    disabled
                  />
                </FormField>
                <>
                  <FormField stretch label="JDBC URL">
                    <Input placeholder="jdbc:xxx.xxx" value="" />
                  </FormField>
                  <FormField stretch label="JDBC Driver Class name - optional">
                    <Input placeholder="jdbc:xxx.xxx" value="" />
                  </FormField>
                  <FormField stretch label="JDBC Driver S3 path - optional">
                    <Input placeholder="s3://xxxx" value="" />
                  </FormField>
                </>

                <FormField stretch label="Credentials">
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
                  <FormField stretch label="Secrets">
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
                    <FormField stretch label="Username">
                      <Input placeholder="db-name" value="" />
                    </FormField>
                    <FormField stretch label="Password">
                      <Input placeholder="******" value="" />
                    </FormField>
                  </>
                )}
              </>
            )}
          </SpaceBetween>
        </Form>
      </div>
    </RightModal>
  );
};

export default JDBCConnection;
