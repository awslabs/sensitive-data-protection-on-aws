import {
  Button,
  Checkbox,
  ExpandableSection,
  Form,
  FormField,
  Input,
  // S3ResourceSelector,
  Select,
  SelectProps,
  SpaceBetween,
  Tiles,
} from '@cloudscape-design/components';
import S3ResourceSelector from '@cloudscape-design/components/s3-resource-selector';
import {
  listGlueConnection,
  importGlueConnection,
  getSecrets,
  queryNetworkInfo,
  queryBuckets,
  createConnection,
} from 'apis/data-source/api';
import RightModal from 'pages/right-modal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { alertMsg } from 'tools/tools';
import { i18ns } from '../types/s3_selector_config';
import { DropdownStatusProps } from '@cloudscape-design/components/internal/components/dropdown-status';

interface JDBCConnectionProps {
  providerId: number;
  accountId: string;
  region: string;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const JDBCConnection: React.FC<JDBCConnectionProps> = (
  props: JDBCConnectionProps
) => {
  const { t } = useTranslation();
  const { showModal, setShowModal } = props;
  const [jdbcType, setJdbcType] = useState('import');
  const [expanded, setExpanded] = useState(true);
  const [connections, setConnections] = useState([] as any[]);
  const [credential, setCredential] = useState('secret');
  const [loading, setLoading] = useState('loading' as DropdownStatusProps.StatusType);
  // const [vpc, setVpc] = useState(null);
  const importOriginalData = {
    instance_id: '',
    account_id: props.accountId,
    region: props.region,
    account_provider_id: props.providerId,
  };

  const newOriginalData = {
    instance_id: '',
    account_provider_id: props.providerId,
    account_id: props.accountId,
    region: props.region,
    description: '',
    jdbc_connection_url: '',
    jdbc_enforce_ssl: 'false',
    // kafka_ssl_enabled:'',
    master_username: '',
    password: '',
    secret: '',
    skip_custom_jdbc_cert_validation: 'false',
    custom_jdbc_cert: '',
    custom_jdbc_cert_string: '',
    network_availability_zone: '',
    network_subnet_id: '',
    network_sg_id: '',
    creation_time: '',
    last_updated_time: '',
    jdbc_driver_class_name: '',
    jdbc_driver_jar_uri: '',
  };
  const [jdbcConnectionData, setJdbcConnectionData] = useState({
    createType: 'import',
    import: importOriginalData,
    new: newOriginalData,
  });
  const [disabled, setDisabled] = useState(true);
  const [credentialType, setCredentialType] = useState('secret_manager');
  const [secretOption, setSecretOption] = useState([] as any);
  const [vpcOption, setVpcOption] = useState([] as any);
  const [subnetOption, setSubnetOption] = useState([] as any);
  const [sgOption, setSgOption] = useState([] as any);
  const [network, setNetwork] = useState([] as any);
  const [buckets, setBuckets] = useState([] as any);
  const [vpc, setVpc] = useState<SelectProps.Option | null>(null);
  const [subnet, setSubnet] = useState<SelectProps.Option | null>(null);
  const [sg, setSg] = useState<SelectProps.Option | null>(null);

  const [importGlue, setImportGlue] = useState<SelectProps.Option | null>(null);
  const [secretItem, setSecretItem] = useState<SelectProps.Option | null>(null);

  useEffect(() => {
    if (credentialType === 'secret_manager') {
      loadAccountSecrets();
    }
  }, [credentialType]);

  useEffect(() => {
    if (
      jdbcConnectionData.createType === 'import' &&
      jdbcConnectionData.import.instance_id !== ''
    ) {
      setDisabled(false);
    }

    if (jdbcConnectionData.createType === 'new') {
      // load network info
      loadNetworkInfo();
      // listBuckets()
    }
  }, [importGlue]);

  useEffect(() => {
    if (jdbcConnectionData.new.jdbc_enforce_ssl === 'false') {
      let temp = jdbcConnectionData.new;
      temp = {
        ...temp,
        skip_custom_jdbc_cert_validation: 'false',
        custom_jdbc_cert: '',
        custom_jdbc_cert_string: '',
      };
      setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
    }
  }, [jdbcConnectionData.new.jdbc_enforce_ssl]);

  useEffect(() => {
    listBuckets();
  }, []);

  // useEffect(()=>{
  //   console.log(jdbcConnectionData)
  // },[jdbcConnectionData.new])

  useEffect(() => {
    // if (props.providerId !== 1) {
    //   setJdbcType('new');
    //   // load network info
    //   loadNetworkInfo();
    // } else {
      try {
        glueConnection();
        setLoading('finished')
      } catch (error) {
        setConnections([]);
      }
    // }
  }, []);

  useEffect(() => {
    if (jdbcConnectionData.createType === 'import') {
      jdbcConnectionData.import.instance_id !== '' && setDisabled(false);
    } else {
      if (
        jdbcConnectionData.new.instance_id !== '' &&
        jdbcConnectionData.new.jdbc_connection_url !== '' &&
        (jdbcConnectionData.new.secret !== '' ||
          (jdbcConnectionData.new.master_username !== '' &&
            jdbcConnectionData.new.password !== '')) &&
        jdbcConnectionData.new.network_sg_id !== '' &&
        jdbcConnectionData.new.network_subnet_id !== '' &&
        vpc !== null
      ) {
        setDisabled(false);
      }
    }
  }, [
    jdbcConnectionData,
    jdbcConnectionData.new,
    jdbcConnectionData.import,
    vpc,
  ]);
  // options={[{label: network[0], value: network[0]}]}
  const loadNetworkInfo = async () => {
    const requestParam = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region,
    };
    try {
      const vpcOptions: any[] = [];
      const res: any = await queryNetworkInfo(requestParam);
      const vpcs = res?.vpcs;
      vpcs.forEach((item: any) => {
        vpcOptions.push({ label: item.vpcId, value: item.vpcId, description: item.vpcName });
      });
      setNetwork(vpcs);
      setVpcOption(vpcOptions);
      if(props.providerId !== 1){
         setVpc(vpcOptions[0])
         const subnet = vpcs[0].subnets[0];
         setSubnet({
          label: subnet.subnetId,
          value: subnet.subnetId,
          description: subnet.subnetName,
         })
      // let tempSubnet = jdbcConnectionData.new;
      // tempSubnet = { ...tempSubnet, network_subnet_id: subnet.subnetId };
      // setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
        // subnets.forEach((item: any) => {
        //   subnetOptions.push({
        //     label: item.subnetId,
        //     value: item.subnetId,
        //     description: item.arn,
        //   });
        // });
    
        const securityGroup = vpcs[0].securityGroups[0];
        setSg({
          label: securityGroup.securityGroupId,
          value: securityGroup.securityGroupId,
          description: securityGroup.securityGroupName,
        })
        let temp = jdbcConnectionData.new;
        temp = { ...temp, network_subnet_id: subnet.subnetId, network_sg_id: securityGroup.securityGroupId };
        setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
        // securityGroups.forEach((item: any) => {
        //   sgOptions.push({
        //     label: item.securityGroupId,
        //     value: item.securityGroupId,
        //     description: item.securityGroupName,
        //   });
        // });
        // console.log("vpcOptions is"+vpcOptions)
      }
    } catch (error) {
      alertMsg(t('loadNetworkError'), 'error');
    }
  };

  const loadAccountSecrets = async () => {
    const requestParam = {
      provider: props.providerId,
      account: props.accountId,
      region: props.region,
    };
    const secretsResult: any = await getSecrets(requestParam);
    if (secretsResult && secretsResult.length > 0) {
      const tempOptList = secretsResult.map((item: { Name: any; ARN: any }) => {
        return {
          label: item.Name,
          value: item.Name,
          tags: [item.ARN],
        };
      });
      setSecretOption(tempOptList);
    } else {
      setSecretOption([]);
    }
  };

  const glueConnection = async () => {
    const requestParam = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region,
    };
    const connectionList: any[] = [];
    const disableConnectionList: any[] = [];
    // const jdbcConnectionData =
    const res = await listGlueConnection(requestParam);
    (res as any[]).forEach((item) => {
      const times = item.CreationTime.split('.')[0].split('T');
      if(item.usedBy){
        const str = t('datasource:jdbc.importComment')
        // const tag = item.usedBy.split('-')
        disableConnectionList.push({
          label: item.Name,
          value: item.Name,
          iconName: 'share',
          // description: item.Description || '-',
          labelTag: times[0] + ' ' + times[1],
          tags:[item.Description, str + item.usedBy]
        });
      } else {
        connectionList.push({
          label: item.Name,
          value: item.Name,
          iconName: 'share',
          description: item.Description || '-',
          labelTag: times[0] + ' ' + times[1],
        });
      }
    });
    if(disableConnectionList.length >0 && connectionList.length >0 ){
      setConnections([{label: t('datasource:jdbc.importEnabled') ?? '',options: connectionList},{disabled: true, label: t('datasource:jdbc.importDisabled') ?? '',options: disableConnectionList}]);
    } else if(disableConnectionList.length >0){
      setConnections([{disabled: true, label: t('datasource:jdbc.importDisabled') ?? '',options: disableConnectionList}]);
    } else {
      setConnections(connectionList)
    }
    
  };

  const addJdbcConnection = async () => {
    if (jdbcConnectionData.createType === 'import') {
      try {
        await importGlueConnection(jdbcConnectionData.import);
        alertMsg(t('successImport'), 'success');
        props.setShowModal(false);
      } catch (error) {
        alertMsg(error + '', 'error');
      }
    } else {
      try {
        await createConnection(jdbcConnectionData.new);
        alertMsg(t('successAdd'), 'success');
        props.setShowModal(false);
      } catch (error) {
        alertMsg(error + '', 'error');
      }
    }
  };

  const changeConnectionName = (detail: any) => {
    // console.log(detail)
    let temp = jdbcConnectionData.new;
    temp = { ...temp, instance_id: detail };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeRequiredSSL = (detail: any) => {
    // console.log(detail)
    let temp = jdbcConnectionData.new;
    temp = { ...temp, jdbc_enforce_ssl: detail ? 'true' : 'false' };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeDescription = (detail: any) => {
    // console.log(detail)
    let temp = jdbcConnectionData.new;
    temp = { ...temp, description: detail };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeJDBCUrl = (detail: any) => {
    // console.log(detail)
    let temp = jdbcConnectionData.new;
    temp = { ...temp, jdbc_connection_url: detail };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeVPC = (detail: any) => {
    const subnetOptions: any[] = [];
    const sgOptions: any[] = [];
    setVpc(detail);
    // console.log("detail is ",detail.value)
    const subnets = network.filter(
      (item: any) => item.vpcId === detail.value
    )[0].subnets;
    subnets.forEach((item: any) => {
      subnetOptions.push({
        label: item.subnetId,
        value: item.subnetId,
        description: item.subnetName
      });
    });

    const securityGroups = network.filter(
      (item: any) => item.vpcId === detail.value
    )[0].securityGroups;
    securityGroups.forEach((item: any) => {
      sgOptions.push({
        label: item.securityGroupId,
        value: item.securityGroupId,
        description: item.securityGroupName,
      });
    });
    // console.log("hahahaha is ",network)

    setSubnetOption(subnetOptions);
    setSgOption(sgOptions);
  };

  const changeSubnet = (detail: any) => {
    console.log("detail is "+detail)
    setSubnet(detail);
    let temp = jdbcConnectionData.new;
    temp = { ...temp, network_subnet_id: detail.value };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeSG = (detail: any) => {
    setSg(detail);
    let temp = jdbcConnectionData.new;
    temp = { ...temp, network_sg_id: detail.value };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeSecret = (detail: any) => {
    setSecretItem(detail);
    let temp = jdbcConnectionData.new;
    temp = { ...temp, secret: detail.value };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const listBuckets = async () => {
    const requestParam = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region,
    };
    const res = await queryBuckets(requestParam);
    setBuckets(res);
  };

  const changeJDBCcertificate = (detail: any) => {
    let temp = jdbcConnectionData.new;
    temp = { ...temp, custom_jdbc_cert: detail.resource.uri };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeSkipCerValid = (detail: any) => {
    // console.log("skip!!!",detail)
    let temp = jdbcConnectionData.new;
    temp = {
      ...temp,
      skip_custom_jdbc_cert_validation: detail ? 'true' : 'false',
    };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeJDBCCertString = (detail: any) => {
    let temp = jdbcConnectionData.new;
    temp = { ...temp, custom_jdbc_cert_string: detail };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeDriverClassName = (detail: any) => {
    let temp = jdbcConnectionData.new;
    temp = { ...temp, jdbc_driver_class_name: detail };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeDriverPath = (detail: any) => {
    let temp = jdbcConnectionData.new;
    temp = { ...temp, jdbc_driver_jar_uri: detail.resource.uri };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changeUserName = (detail: any) => {
    let temp = jdbcConnectionData.new;
    temp = { ...temp, master_username: detail };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const changePassword = (detail: any) => {
    let temp = jdbcConnectionData.new;
    temp = { ...temp, password: detail };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
  };

  const resetCredentials = () => {
    let temp = jdbcConnectionData.new;
    temp = { ...temp, password: '', master_username: '', secret: '' };
    setJdbcConnectionData({ ...jdbcConnectionData, new: temp });
    setSecretItem(null);
  };

  return (
    <RightModal
      className="detail-modal"
      setShowModal={(show) => {
        setShowModal(show);
      }}
      showModal={showModal}
      header={t('datasource:jdbc.addConnection')}
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
              <Button
                variant="primary"
                disabled={disabled}
                onClick={() => {
                  addJdbcConnection();
                }}
              >
                {t('button.save')}
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween direction="vertical" size="s">
            <FormField stretch label={t('datasource:jdbc.selectGlue')}>
              <Tiles
                onChange={({ detail }) => {
                  const data = jdbcConnectionData;
                  data.import = importOriginalData;
                  data.new = newOriginalData;
                  data.createType = detail.value;
                  setJdbcConnectionData(data);
                  setImportGlue(null);
                  setJdbcType(detail.value);
                  setDisabled(true);
                  if (detail.value === 'new') {
                    loadNetworkInfo();
                  }
                }}
                value={jdbcType}
                items={[
                  {
                    label: t('datasource:jdbc.importGlue'),
                    value: 'import',
                    // disabled: props.providerId !== 1,
                  },
                  { label: t('datasource:jdbc.createNew'), value: 'new' },
                ]}
              />
            </FormField>

            {jdbcType === 'import' && (
              <>
                <FormField
                  stretch
                  label={t('datasource:jdbc.glueConnection')}
                  description={t('datasource:jdbc.glueConnectionDesc')}
                >
                  <Select
                    placeholder={t('datasource:jdbc.gcPlaceholder') ?? ''}
                    selectedOption={importGlue}
                    onChange={({ detail }) => {
                      const temp = jdbcConnectionData;
                      temp.import.instance_id =
                        detail.selectedOption.value || '';
                      setJdbcConnectionData(temp);
                      setImportGlue(detail.selectedOption);
                    }}
                    options={connections}
                    loadingText={t('datasource:jdbc.loadingConnections') ?? ''}
                    statusType={loading}
                    empty={t('datasource:jdbc.emptyConnections') ?? ''}
                  />
                </FormField>
              </>
            )}

            {jdbcType === 'new' && (
              <>
                <FormField
                  stretch
                  label={t('datasource:jdbc.connectionName')}
                  description={t('datasource:jdbc.connectionNameDesc')}
                >
                  <Input
                    onChange={(e) => changeConnectionName(e.detail.value)}
                    value={jdbcConnectionData.new.instance_id}
                  />
                </FormField>
                <FormField
                  description={t('datasource:jdbc.sslConnectionDesc')}
                  label={t('datasource:jdbc.sslConnection')}
                >
                  <Checkbox
                    checked={
                      jdbcConnectionData.new.jdbc_enforce_ssl !== 'false'
                    }
                    onChange={({ detail }) => {
                      changeRequiredSSL(detail.checked);
                    }}
                  >
                    {t('datasource:jdbc.requireSSL')}
                  </Checkbox>
                </FormField>
                {jdbcConnectionData.new.jdbc_enforce_ssl !== 'false' && (
                  <>
                    <FormField
                      label={t('datasource:jdbc.customJDBCCert')}
                      description={t('datasource:jdbc.chooseCert')}
                      constraintText={t('datasource:jdbc.useS3Format')}
                      errorText=""
                      stretch={true}
                    >
                      <S3ResourceSelector
                        onChange={({ detail }) =>
                          // setResource(detail.resource)
                          changeJDBCcertificate(detail)
                        }
                        resource={{
                          uri: jdbcConnectionData.new.custom_jdbc_cert,
                        }}
                        objectsIsItemDisabled={(item) => !item.IsFolder}
                        fetchBuckets={() => {
                          return Promise.resolve(buckets);
                        }}
                        fetchObjects={() => Promise.resolve([])}
                        fetchVersions={() => Promise.resolve([])}
                        i18nStrings={i18ns}
                        selectableItemsTypes={['buckets', 'objects']}
                      />
                    </FormField>
                    <FormField
                      description={t('datasource:jdbc.certValidationDesc')}
                      label={t('datasource:jdbc.certValidation')}
                    >
                      <Checkbox
                        checked={
                          jdbcConnectionData.new
                            .skip_custom_jdbc_cert_validation !== 'false'
                        }
                        onChange={({ detail }) => {
                          changeSkipCerValid(detail.checked);
                        }}
                      >
                        {t('datasource:jdbc.skipValidation')}
                      </Checkbox>
                    </FormField>
                    <FormField
                      description={t(
                        'datasource:jdbc.customJDBCCertStringDesc'
                      )}
                      label={t('datasource:jdbc.customJDBCCertString')}
                      constraintText={t(
                        'datasource:jdbc.customJDBCCertConstraint'
                      )}
                    >
                      <Input
                        onChange={(e) => changeJDBCCertString(e.detail.value)}
                        value={jdbcConnectionData.new.custom_jdbc_cert_string}
                      />
                    </FormField>
                  </>
                )}

                <FormField
                  stretch
                  label={t('datasource:jdbc.description')}
                  description={t('datasource:jdbc.descriptionDesc')}
                >
                  <Input
                    onChange={(e) => changeDescription(e.detail.value)}
                    value={jdbcConnectionData.new.description}
                  />
                </FormField>
                <>
                  <FormField
                    stretch
                    label={t('datasource:jdbc.jdbcURL')}
                    description={t('datasource:jdbc.jdbcURLDesc')}
                    constraintText={t('datasource:jdbc.jdbcURLConstraint')}
                  >
                    <Input
                      onChange={(e) => changeJDBCUrl(e.detail.value)}
                      placeholder="jdbc:xxx.xxx"
                      value={jdbcConnectionData.new.jdbc_connection_url}
                    />
                  </FormField>
                  <FormField
                    stretch
                    label={t('datasource:jdbc.jdbcClassName')}
                    constraintText={t('datasource:jdbc.jdbcClassNameDesc')}
                  >
                    <Input
                      onChange={(e) => changeDriverClassName(e.detail.value)}
                      value={jdbcConnectionData.new.jdbc_driver_class_name}
                    />
                  </FormField>
                  <FormField
                    stretch
                    label={t('datasource:jdbc.jdbcS3Path')}
                    constraintText={t('datasource:jdbc.jdbcS3PathDesc')}
                  >
                    <S3ResourceSelector
                      onChange={({ detail }) => changeDriverPath(detail)}
                      resource={{
                        uri: jdbcConnectionData.new.jdbc_driver_jar_uri,
                      }}
                      objectsIsItemDisabled={(item) => !item.IsFolder}
                      fetchBuckets={() => {
                        return Promise.resolve(buckets);
                      }}
                      fetchObjects={() => Promise.resolve([])}
                      fetchVersions={() => Promise.resolve([])}
                      i18nStrings={i18ns}
                      selectableItemsTypes={['buckets', 'objects']}
                    />
                  </FormField>
                </>

                <FormField stretch label={t('datasource:jdbc.credential')}>
                  <Tiles
                    onChange={({ detail }) => {
                      resetCredentials();
                      setCredential(detail.value);
                      setDisabled(true)
                    }}
                    value={credential}
                    items={[
                      {
                        label: t('datasource:jdbc.secretManager'),
                        value: 'secret',
                      },
                      {
                        label: t('datasource:jdbc.userPwd'),
                        value: 'password',
                      },
                    ]}
                  />
                </FormField>

                {credential === 'secret' && (
                  <FormField stretch label={t('datasource:jdbc.secret')}>
                    <Select
                      placeholder={t('datasource:jdbc.selectSecret') ?? ''}
                      selectedOption={secretItem}
                      onChange={
                        ({ detail }) => changeSecret(detail.selectedOption)
                        // setSecretItem(detail.selectedOption)
                      }
                      options={secretOption}
                    />
                  </FormField>
                )}

                {credential === 'password' && (
                  <>
                    <FormField stretch label={t('datasource:jdbc.username')}>
                      <Input
                        value={jdbcConnectionData.new.master_username}
                        onChange={({ detail }) => {
                          changeUserName(detail.value);
                        }}
                      />
                    </FormField>
                    <FormField stretch label={t('datasource:jdbc.password')}>
                      <Input
                        type="password"
                        value={jdbcConnectionData.new.password}
                        onChange={({ detail }) => {
                          changePassword(detail.value);
                        }}
                      />
                    </FormField>
                  </>
                )}
                <ExpandableSection
                  headerText={t('datasource:jdbc.networkOption')}
                  onChange={() => setExpanded(!expanded)}
                  expanded={expanded}
                  headerDescription={t('datasource:jdbc.networkDesc') ?? ''}
                >
                  <FormField
                    stretch
                    label={t('datasource:jdbc.vpc')}
                    description={t('datasource:jdbc.vpcDesc')}
                  >
                    <Select
                      placeholder={t('datasource:jdbc.chooseVPC') ?? ''}
                      selectedOption={vpc}
                      onChange={({ detail }) =>
                        changeVPC(detail.selectedOption)
                      }
                      options={vpcOption}
                      disabled={props.providerId !== 1}
                      // options={[{label: network[0], value: network[0]}]}
                    />
                  </FormField>
                  <FormField
                    stretch
                    label={t('datasource:jdbc.subnet')}
                    description={t('datasource:jdbc.subnetDesc')}
                  >
                    <Select
                      placeholder={t('datasource:jdbc.chooseSubnet') ?? ''}
                      selectedOption={subnet}
                      onChange={({ detail }) =>
                        changeSubnet(detail.selectedOption)
                      }
                      options={subnetOption}
                      disabled={props.providerId !== 1}
                    />
                  </FormField>
                  <FormField
                    stretch
                    label={t('datasource:jdbc.sg')}
                    description={t('datasource:jdbc.sgDesc') ?? ''}
                  >
                    <Select
                      placeholder={t('datasource:jdbc.chooseSG') ?? ''}
                      selectedOption={sg}
                      onChange={({ detail }) => changeSG(detail.selectedOption)}
                      options={sgOption}
                      disabled={props.providerId !== 1}
                    />
                  </FormField>
                </ExpandableSection>
              </>
            )}
          </SpaceBetween>
        </Form>
      </div>
    </RightModal>
  );
};

export default JDBCConnection;
