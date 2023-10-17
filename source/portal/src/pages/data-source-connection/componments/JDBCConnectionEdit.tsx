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
import S3ResourceSelector from "@cloudscape-design/components/s3-resource-selector";
import {
  listGlueConnection,
  getSecrets,
  queryNetworkInfo,
  queryBuckets,
  createConnection,
  queryConnectionDetails
} from 'apis/data-source/api';
import RightModal from 'pages/right-modal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { alertMsg, showHideSpinner } from 'tools/tools';
import { i18ns } from '../types/s3_selector_config';

interface JDBCConnectionProps {
  providerId: number;
  accountId: string;
  region: string;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const JDBCConnectionEdit: React.FC<JDBCConnectionProps> = (
  props: JDBCConnectionProps
) => {
  const { t } = useTranslation();
  const { showModal, setShowModal } = props;
  // const [jdbcType, setJdbcType] = useState('import');
  const [connections, setConnections] = useState([] as any[]);
  const [credential, setCredential] = useState('secret');
  // const [vpc, setVpc] = useState(null);

  const originalData = {
    instance_id:'',
    account_provider_id: props.providerId,
    account_id: props.accountId,
    region: props.region,
    description:'',
    jdbc_connection_url:'',
    jdbc_enforce_ssl:'false',
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
    jdbc_driver_jar_uri: ''
  }
  const [jdbcConnectionData, setJdbcConnectionData] = useState(originalData);
  const [disabled, setDisabled] = useState(true)
  const [credentialType, setCredentialType] = useState('secret_manager')
  const [secretOption, setSecretOption] = useState([] as any);
  const [network, setNetwork] = useState([] as any);
  const [buckets, setBuckets] = useState([] as any);
  const [vpc, setVpc] = useState<SelectProps.Option | null>(null);
  const [subnet, setSubnet] = useState<SelectProps.Option | null>(null);
  const [sg, setSg] = useState<SelectProps.Option | null>(null);
  const [secretItem, setSecretItem] = useState<SelectProps.Option | null>(null);

  useEffect(() => {
    if (credentialType === 'secret_manager') {
      loadAccountSecrets();
    }
  }, [credentialType]);

  useEffect(()=>{
    if(jdbcConnectionData.jdbc_enforce_ssl==='false'){
      let temp = jdbcConnectionData;
    temp={...temp,skip_custom_jdbc_cert_validation:'false',custom_jdbc_cert:'',custom_jdbc_cert_string:''};
    // setJdbcConnectionData({...jdbcConnectionData, new:temp});
    }
  },[jdbcConnectionData.jdbc_enforce_ssl])

  useEffect(()=>{
      listBuckets()
      getConnectionDetails()
  },[])

  // useEffect(()=>{
  //   console.log(jdbcConnectionData)
  // },[jdbcConnectionData])

  useEffect(()=>{

    console.log("")

    // if(props.providerId !== 1){
    //   setJdbcType('new')
    //   // load network info
    //   loadNetworkInfo()
    // } else {
    //   try {
    //     glueConnection()
    //   } catch (error) {
    //     setConnections([]);
    //   }
    // }
  },[])

  useEffect(()=>{
      if(jdbcConnectionData.instance_id!=='' &&
         jdbcConnectionData.jdbc_connection_url !=='' &&
         (jdbcConnectionData.secret !== '' || 
          (jdbcConnectionData.master_username !== '' && 
           jdbcConnectionData.password !=='')) &&
         jdbcConnectionData.network_sg_id !=='' &&
         jdbcConnectionData.network_subnet_id !=='' &&
         vpc !== null
         ){
        setDisabled(false)
      }
    },[jdbcConnectionData,jdbcConnectionData,vpc,]
  )

  const loadNetworkInfo = async ()=>{
    const requestParam = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region
    }
    const res= await queryNetworkInfo(requestParam);
    setNetwork(res)
    // console.log("network is", res)
  }

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

  const glueConnection =async()=>{
    const requestParam = {
      account_id: props.accountId,
      region: props.region,
    };
    const connectionList:any[] = [];
    // const jdbcConnectionData = 
    const res= await listGlueConnection(requestParam);
    (res as any[]).forEach((item) => {
      const times = item.CreationTime.split('.')[0].split('T')
      connectionList.push({
        label: item.Name,
        value: item.Name,
        iconName: 'share',
        description: item.Description||'-',
        labelTag: times[0]+' '+times[1]
      })
    })
    setConnections(connectionList)
  }

  const updateJdbcConnection =async()=>{
    try{
      await createConnection(jdbcConnectionData)
      alertMsg(t('successAdd'), 'success');
      props.setShowModal(false)
    } catch(error){
      alertMsg(t('failAdd'), 'error');
    }
  }

  const changeConnectionName = (detail:any)=>{
    // console.log(detail)
    let temp = jdbcConnectionData;
    temp={...temp,instance_id:detail};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeRequiredSSL =(detail:any)=>{
    // console.log(detail)
    let temp = jdbcConnectionData;
    temp={...temp,jdbc_enforce_ssl:detail?'true':'false'};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeDescription =(detail:any)=>{
    // console.log(detail)
    let temp = jdbcConnectionData;
    temp={...temp,description:detail};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeJDBCUrl =(detail:any)=>{
    // console.log(detail)
    let temp = jdbcConnectionData;
    temp={...temp,jdbc_connection_url:detail};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeVPC =(detail:any)=>{
    setVpc(detail)
  }

  const changeSubnet =(detail:any)=>{
    setSubnet(detail)
    let temp = jdbcConnectionData;
    temp={...temp,network_subnet_id:detail.value};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeSG =(detail:any)=>{
    setSg(detail)
    let temp = jdbcConnectionData;
    temp={...temp,network_sg_id:detail.value};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeSecret =(detail:any)=>{
    setSecretItem(detail)
    let temp = jdbcConnectionData;
    temp={...temp,secret:detail.value};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }
  const getConnectionDetails = async()=>{
    // showHideSpinner(true);
    const requestParam = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region
    }
    try{
      const res:any= await queryConnectionDetails(requestParam);
      console.log("connection details is:",res)
      setJdbcConnectionData(res as any)
      
      // showHideSpinner(false);
    }catch(error){
      alertMsg(error as string, 'error');
    }
  }
  const listBuckets = async()=>{
    const requestParam = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region
    }
    try{
      const res= await queryBuckets(requestParam);
      setBuckets(res)
    }catch(error){
      alertMsg(t('failLoadBuckets'), 'error');
    }
  }

  const changeJDBCcertificate =(detail:any)=>{
    let temp = jdbcConnectionData;
    temp={...temp,custom_jdbc_cert:detail.resource.uri};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeSkipCerValid =(detail:any)=>{
    // console.log("skip!!!",detail)
    let temp = jdbcConnectionData;
    temp={...temp,skip_custom_jdbc_cert_validation:detail?'true':'false'};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeJDBCCertString =(detail:any)=>{
    let temp = jdbcConnectionData;
    temp={...temp,custom_jdbc_cert_string:detail};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeDriverClassName=(detail:any)=>{
    let temp = jdbcConnectionData;
    temp={...temp,jdbc_driver_class_name:detail};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeDriverPath=(detail:any)=>{
    let temp = jdbcConnectionData;
    temp={...temp,jdbc_driver_jar_uri:detail.resource.uri};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changeUserName=(detail:any)=>{
    let temp = jdbcConnectionData;
    temp={...temp,master_username:detail};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const changePassword=(detail:any)=>{
    let temp = jdbcConnectionData;
    temp={...temp,password:detail};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
  }

  const resetCredentials=()=>{
    let temp = jdbcConnectionData;
    temp={...temp,password:'',master_username:'',secret:''};
    // setJdbcConnectionData({...jdbcConnectionData,new:temp});
    setSecretItem(null)
  }


  return (
    <RightModal
      className="detail-modal"
      setShowModal={(show) => {
        setShowModal(show);
      }}
      showModal={showModal}
      header="Edit JDBC Connection"

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
              <Button variant="primary" disabled={disabled} onClick={()=>{updateJdbcConnection()}}>{t('button.save')}</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween direction="vertical" size="s">
                <FormField
                  stretch
                  label="connection name"
                  description="Enter a unique name for your connection."
                >
                  <Input
                    onChange={(e)=>changeConnectionName(e.detail.value)}
                    value={jdbcConnectionData.instance_id}
                  />
                </FormField>
                <FormField
                  description="The connection will fail if it's unable to connect over SSL."
                  label="SSL connection"
                >
                  <Checkbox 
                    checked={jdbcConnectionData.jdbc_enforce_ssl!=='false'}
                    onChange={({ detail })=>{
                      changeRequiredSSL(detail.checked)
                      }
                    }>
                    Require SSL connection
                  </Checkbox>
                </FormField>
                {jdbcConnectionData.jdbc_enforce_ssl!=='false'&&(<>
                  <FormField
                  label="Custom JDBC certificate"
                  description="Choose your X.509 certificate. Must be DER-encoded Base64 PEM format."
                  constraintText="Use s3://bucket/prefix/object format."
                  errorText=''
                  stretch={true}
                >
                  <S3ResourceSelector
                    onChange={({ detail }) =>
                      // setResource(detail.resource)
                      changeJDBCcertificate(detail)
                    }
                    resource={{uri:jdbcConnectionData.custom_jdbc_cert}}
                    objectsIsItemDisabled={item => !item.IsFolder}
                    fetchBuckets={() =>{
                      return Promise.resolve(buckets)
                    }
                      
                    }
                    fetchObjects={() =>
                      Promise.resolve([])
                    }
                    fetchVersions={() =>
                      Promise.resolve([])
                    }
                    i18nStrings={i18ns}
                    selectableItemsTypes={["buckets", "objects"]}
                  />
                </FormField>
                <FormField
                  description="By default your custom certificate is validated before use. Turn on this option to skip validation of the certificate algorithm and key length during connection."
                  label="certificate validation"
                >
                  <Checkbox
                    checked={jdbcConnectionData.skip_custom_jdbc_cert_validation!=='false'}
                    onChange={({ detail })=>{
                      changeSkipCerValid(detail.checked)
                      }
                    }
                    >
                    Skip certificate validation
                  </Checkbox>
                </FormField>
                <FormField
                  description="Enter your database specific custom certificate info."
                  label="Custom JDBC certificate string"
                  constraintText='For Oracle Database this maps to SSL_SERVER_CERT_DN, and for SQL Server it maps to hostNameInCertificate.'
                >
                  <Input 
                    onChange={(e)=>changeJDBCCertString(e.detail.value)}
                    value={jdbcConnectionData.custom_jdbc_cert_string} />
                </FormField>
                
                
                </>) }
                
                <FormField
                  stretch
                  label="Description - optional"
                  description="Descriptions can be up to 2048 characters long."
                >
                  <Input
                    onChange={(e)=>changeDescription(e.detail.value)}
                    value={jdbcConnectionData.description}
                  />
                </FormField>
                <>
                  <FormField stretch label="JDBC URL"
                    description='Use the JDBC protocol to access Amazon Redshift, Amazon RDS, and publicly accessible databases.'
                    constraintText='JDBC syntax for most database engines is jdbc:protocol://host:port/databasename.'
                    >
                    <Input
                      onChange={(e)=>changeJDBCUrl(e.detail.value)}
                      placeholder="jdbc:xxx.xxx"
                      value={jdbcConnectionData.jdbc_connection_url} />
                  </FormField>
                  <FormField 
                    stretch
                    label="JDBC Driver Class name - optional"
                    constraintText="Type a custom JDBC driver class name for the crawler to connect to the data source."
                    >
                    <Input 
                      onChange={(e)=>changeDriverClassName(e.detail.value)}
                      value={jdbcConnectionData.jdbc_driver_class_name} />
                  </FormField>
                  <FormField stretch
                    label="JDBC Driver S3 path - optional"
                    constraintText='Browse for or enter an existing S3 path to a .jar file.'>
                    <S3ResourceSelector
                    onChange={({ detail }) =>
                      changeDriverPath(detail)
                    }
                    resource={{uri:jdbcConnectionData.jdbc_driver_jar_uri}}
                    objectsIsItemDisabled={item => !item.IsFolder}
                    fetchBuckets={() =>{
                      return Promise.resolve(buckets)
                    }
                      
                    }
                    fetchObjects={() =>
                      Promise.resolve([])
                    }
                    fetchVersions={() =>
                      Promise.resolve([])
                    }
                    i18nStrings={i18ns}
                    selectableItemsTypes={["buckets", "objects"]}
                  />
                  </FormField>
                </>

                <FormField stretch label="Credentials">
                  <Tiles
                    onChange={({ detail }) => {
                      resetCredentials()
                      setCredential(detail.value)
                    }
                  }
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
                         changeSecret(detail.selectedOption)
                        // setSecretItem(detail.selectedOption)
                      }
                      options={secretOption}
                    />
                  </FormField>
                )}

                {credential === 'password' && (
                  <>
                    <FormField stretch label="Username">
                      <Input
                       value={jdbcConnectionData.master_username}
                       onChange={({detail})=>{changeUserName(detail.value)}}/>
                    </FormField>
                    <FormField stretch label="Password">
                      <Input type="password"
                        value={jdbcConnectionData.password}
                        onChange={({detail})=>{changePassword(detail.value)}}/>
                    </FormField>
                  </>
                )}
                <ExpandableSection
                  headerText="Network options" 
                  expanded
                  headerDescription='If your Amazon Glue job needs to jdbc resource which existed in other vpc or other cloud provider environment, you must provide additional VPC-specific configuration information.'>
                <FormField stretch label="VPC" description='Choose the virtual private cloud that contains your data source.'>
                    <Select
                      placeholder="Choose one VPC"
                      selectedOption={vpc}
                      onChange={({ detail }) =>
                        changeVPC(detail.selectedOption)
                      }
                      options={[{label: network[0], value: network[0]}]}
                    />
                  </FormField>
                  <FormField stretch label="Subnet" description='Choose the subnet within your VPC.'>
                    <Select
                      placeholder="Choose one subnet"
                      selectedOption={subnet}
                      onChange={({ detail }) =>
                      changeSubnet(detail.selectedOption)
                      }
                      options={[{label: network[1], value: network[1]}]}
                    />
                  </FormField>
                  <FormField stretch label="Security groups" description='Choose one or more security groups to allow access to the data store in your VPC subnet. Security groups are associated to the ENI attached to your subnet. You must choose at least one security group with a self-referencing inbound rule for all TCP ports.'>
                    <Select
                      placeholder="Choose one or more security groups"
                      selectedOption={sg}
                      onChange={({ detail }) =>
                         changeSG(detail.selectedOption)
                      }
                      options={[{label: network[2], value: network[2]}]}
                    />
                  </FormField>
      
                </ExpandableSection>
          </SpaceBetween>
        </Form>
      </div>
    </RightModal>
  );
};

export default JDBCConnectionEdit;
