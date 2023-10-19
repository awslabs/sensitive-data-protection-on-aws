import {
  Button,
  Checkbox,
  ExpandableSection,
  Form,
  FormField,
  Input,
  Select,
  SelectProps,
  SpaceBetween,
  Spinner,
  Tiles,
} from '@cloudscape-design/components';
import S3ResourceSelector from "@cloudscape-design/components/s3-resource-selector";
import {
  getSecrets,
  queryNetworkInfo,
  queryBuckets,
  createConnection,
  queryConnectionDetails
} from 'apis/data-source/api';
import RightModal from 'pages/right-modal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { alertMsg } from 'tools/tools';
import { i18ns } from '../types/s3_selector_config';

interface JDBCConnectionProps {
  providerId: number;
  accountId: string;
  region: string;
  instanceId: string;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

type connectionType ={
  instance_id: string,
  account_provider_id: number,
  account_id: string,
  region: string,
  description:string,
  jdbc_connection_url:string,
  jdbc_enforce_ssl:string,
  master_username: string,
  password: string,
  secret: string,
  skip_custom_jdbc_cert_validation: string,
  custom_jdbc_cert: string,
  custom_jdbc_cert_string: string,
  network_availability_zone: string,
  network_subnet_id: string,
  network_sg_id: string,
  jdbc_driver_class_name: string,
  jdbc_driver_jar_uri: string
}

const JDBCConnectionEdit: React.FC<JDBCConnectionProps> = (
  props: JDBCConnectionProps
) => {
  const { t } = useTranslation();
  const { showModal, setShowModal } = props;
  // const [jdbcType, setJdbcType] = useState('import');
  const [connections, setConnections] = useState([] as any[]);
  const [credential, setCredential] = useState('secret');
  const [isLoading, setIsLoading] = useState(true);
  // const [vpc, setVpc] = useState(null);

  const originalData: connectionType = {
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
    jdbc_driver_class_name: '',
    jdbc_driver_jar_uri: ''
  }
  const [jdbcConnectionData, setJdbcConnectionData] = useState<connectionType>(originalData);
  const [disabled, setDisabled] = useState(true)
  const [secretOption, setSecretOption] = useState([] as any);
  const [vpcOption, setVpcOption] = useState([] as any);
  const [subnetOption, setSubnetOption] = useState([] as any);
  const [sgOption, setSgOption] = useState([] as any);
  const [network, setNetwork] = useState([] as any);
  const [buckets, setBuckets] = useState([] as any);
  const [vpc, setVpc] = useState<SelectProps.Option | null>(null);
  const [subnet, setSubnet] = useState<SelectProps.Option | null>(null);
  const [sg, setSg] = useState<SelectProps.Option | null>(null);
  const [secretItem, setSecretItem] = useState<SelectProps.Option | null>(null);

  // useEffect(() => {
  //   if (credentialType === 'secret_manager') {
  //     loadAccountSecrets();
  //   }
  // }, [credentialType]);

  useEffect(()=>{
    if(jdbcConnectionData.jdbc_enforce_ssl==='false'){
      let temp = jdbcConnectionData;
    temp={...temp,skip_custom_jdbc_cert_validation:'false',custom_jdbc_cert:'',custom_jdbc_cert_string:''};
    }
  },[jdbcConnectionData.jdbc_enforce_ssl])

  useEffect(()=>{
      getPageData()
      // setSecretItem()
  },[])

  useEffect(()=>{
    console.log("")
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

  const getPageData = async () =>{    
    getConnectionDetails()
    // loadNetworkInfo(physicalConnection)
    loadAccountSecrets()
    listBuckets()
  }


  // const loadNetworkInfo = async (physicalConnection:any )=>{
    
  // }

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

  const updateJdbcConnection =async()=>{
    try{
      console.log("jdbcConnectionData is:",jdbcConnectionData)
      await createConnection(jdbcConnectionData)
      alertMsg(t('successAdd'), 'success');
      props.setShowModal(false)
    } catch(error){
      alertMsg(t('failAdd'), 'error');
    }
  }

  const changeRequiredSSL =(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,jdbc_enforce_ssl:detail?'true':'false'});
  }

  const changeDescription =(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,description:detail});
  }

  const changeJDBCUrl =(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,jdbc_connection_url:detail});
  }

  const genOptions=(source:any[], vpcId:string)=> {
    const subnetOptions: any[] = [];
    const sgOptions: any[] = [];
    const subnets = source.filter((item: any) => item.vpcId === vpcId)[0].subnets;
    subnets.forEach((item: any) => {
      subnetOptions.push({
        label: item.subnetId,
        value: item.subnetId,
        description: item.arn
      });
    });

    const securityGroups = source.filter((item: any) => item.vpcId === vpcId)[0].securityGroups;
    securityGroups.forEach((item: any) => {
      sgOptions.push({
        label: item.securityGroupId,
        value: item.securityGroupId,
        description: item.securityGroupName
      });
    });
    return { subnetOptions, sgOptions };
  }


  const changeVPC =(detail:any)=>{
    setVpc(detail)
    const { subnetOptions, sgOptions }: { subnetOptions: any[]; sgOptions: any[]; } = genOptions(network, detail.value);
    setSubnetOption(subnetOptions)
    setSgOption(sgOptions)
    setSubnet(null)
    setSg(null)
  }

  const changeSubnet =(detail:any)=>{
    setSubnet(detail)
    setJdbcConnectionData({...jdbcConnectionData,network_subnet_id:detail.value});
  }

  const changeSG =(detail:any)=>{
    setSg(detail)
    setJdbcConnectionData({...jdbcConnectionData,network_sg_id:detail.value});
  }

  const changeSecret =(detail:any)=>{
    setSecretItem(detail)
    console.log("secret is :",detail)
    setJdbcConnectionData({...jdbcConnectionData,secret:detail.value});
  }
  const getConnectionDetails = async()=>{
    setIsLoading(true)
    const requestParam = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region,
      instance_id: props.instanceId
    }
    const requestParam_network = {
      account_provider_id: props.providerId,
      account_id: props.accountId,
      region: props.region
    }
    try{
      
      const res:any = await queryConnectionDetails(requestParam);

      setJdbcConnectionData({...jdbcConnectionData,
                            instance_id:res["Name"],
                            description:res["Description"],
                            jdbc_connection_url:res["ConnectionProperties"]["JDBC_CONNECTION_URL"],
                            jdbc_enforce_ssl:res["ConnectionProperties"]["JDBC_ENFORCE_SSL"],
                            master_username: res["ConnectionProperties"]["USERNAME"],
                            password: res["ConnectionProperties"]["PASSWORD"],
                            secret: res["ConnectionProperties"]["SECRET_ID"],
                            skip_custom_jdbc_cert_validation: res["ConnectionProperties"]['SKIP_CUSTOM_JDBC_CERT_VALIDATION'],
                            custom_jdbc_cert: res["ConnectionProperties"]['CUSTOM_JDBC_CERT'],
                            custom_jdbc_cert_string: res["ConnectionProperties"]['CUSTOM_JDBC_CERT_STRING'],
                            network_availability_zone: res["PhysicalConnectionRequirements"]["AvailabilityZone"],
                            network_subnet_id: res["PhysicalConnectionRequirements"]["SubnetId"],
                            network_sg_id: res["PhysicalConnectionRequirements"]["SecurityGroupIdList"][0],
                            jdbc_driver_class_name: res["ConnectionProperties"]['JDBC_DRIVER_CLASS_NAME'],
                            jdbc_driver_jar_uri: res["ConnectionProperties"]['JDBC_DRIVER_JAR_URI']
                          })
      if(res["ConnectionProperties"]["USERNAME"] === ''&& res["ConnectionProperties"]["PASSWORD"] ===''){
        setCredential('secret')
        console.log("secretOption is:",secretOption)
        const secrets = secretOption.filter((option:any) => option.value === res["ConnectionProperties"]["SECRET_ID"])
        setSecretItem(secrets[0])
      } else {
        setCredential('password')
      }
      console.log("secretOption is :",secretOption) 
      try{
         const vpcOptions:any[] = []
         const network_res:any= await queryNetworkInfo(requestParam_network);
         const vpcs = network_res?.vpcs
         let currentVPCId = ''
         console.log("vpcs is:",vpcs)
         vpcs.forEach((item:any)=>{
          const subnetId: string[] = []
          const sgId: string[] = []
          vpcOptions.push({label: item.vpcId, value: item.vpcId})
          item.subnets.forEach((i:any)=>subnetId.push(i.subnetId))
          item.securityGroups.forEach((i:any)=>sgId.push(i.securityGroupId))
          if(subnetId.includes(res["PhysicalConnectionRequirements"]["SubnetId"]) && sgId.includes(res["PhysicalConnectionRequirements"]["SecurityGroupIdList"][0])){
            currentVPCId = item.vpcId
          }
          // if()
         })
         setNetwork(vpcs)
         setVpcOption(vpcOptions)
        //  if(currentVPCId === '') {
         const vid= currentVPCId === ''?vpcs[0].vpcId:currentVPCId
         const { subnetOptions, sgOptions }: { subnetOptions: any[]; sgOptions: any[]; } = genOptions(vpcs, vid);
         setSubnetOption(subnetOptions)
         setSgOption(sgOptions)
         setVpc({label:vid.vpcId, value:vid})
         setSubnet({label:res["PhysicalConnectionRequirements"]["SubnetId"], value:res["PhysicalConnectionRequirements"]["SubnetId"]})
         setSg({label:res["PhysicalConnectionRequirements"]["SecurityGroupIdList"][0], value:res["PhysicalConnectionRequirements"]["SecurityGroupIdList"][0]})
        //  }else {
        //  const { subnetOptions, sgOptions }: { subnetOptions: any[]; sgOptions: any[]; } = genOptions(vpcs, currentVPCId);
        //  setSubnetOption(subnetOptions)
        //  setSgOption(sgOptions)
        //  setVpc({label:currentVPCId, value:currentVPCId})
        //  setSubnet({label:jdbcConnectionData.network_subnet_id, value:jdbcConnectionData.network_subnet_id})
        //  setSg({label:jdbcConnectionData.network_sg_id, value:jdbcConnectionData.network_sg_id})
        // }
      } catch (error){
        alertMsg(t('loadNetworkError'), 'error');
      }
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
      setIsLoading(false)
      
    }catch(error){
      setIsLoading(false)
      alertMsg(t('failLoadBuckets'), 'error');
    }
  }

  const changeJDBCcertificate =(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,custom_jdbc_cert:detail.resource.uri});
  }

  const changeSkipCerValid =(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,skip_custom_jdbc_cert_validation:detail?'true':'false'});
  }

  const changeJDBCCertString =(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,custom_jdbc_cert_string:detail});
  }

  const changeDriverClassName=(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,jdbc_driver_class_name:detail});
  }

  const changeDriverPath=(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,jdbc_driver_jar_uri:detail.resource.uri});
  }

  const changeUserName=(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,master_username:detail});
  }

  const changePassword=(detail:any)=>{
    setJdbcConnectionData({...jdbcConnectionData,password:detail});
  }

  const resetCredentials=()=>{
    setJdbcConnectionData({...jdbcConnectionData,password:'',master_username:'',secret:''});
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
    <div className="add-jdbc-container" >
      {isLoading?(
        <div style={{margin:"auto"}}>
        <Spinner />
        </div>
      ):(
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
                    onChange={(e)=>{console.log("you can not change this item")}}
                    value={jdbcConnectionData.instance_id}
                    disabled
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
                      options={vpcOption}
                    />
                  </FormField>
                  <FormField stretch label="Subnet" description='Choose the subnet within your VPC.'>
                    <Select
                      placeholder="Choose one subnet"
                      selectedOption={subnet}
                      onChange={({ detail }) =>
                      changeSubnet(detail.selectedOption)
                      }
                      options={subnetOption}
                      // options={[{label: network[1], value: network[1]}]}
                    />
                  </FormField>
                  <FormField stretch label="Security groups" description='Choose one or more security groups to allow access to the data store in your VPC subnet. Security groups are associated to the ENI attached to your subnet. You must choose at least one security group with a self-referencing inbound rule for all TCP ports.'>
                    <Select
                      placeholder="Choose one or more security groups"
                      selectedOption={sg}
                      onChange={({ detail }) =>
                         changeSG(detail.selectedOption)
                      }
                      options={sgOption}
                      // options={[{label: network[2], value: network[2]}]}
                    />
                  </FormField>
      
                </ExpandableSection>
          </SpaceBetween>
        </Form>
      )}
      </div>
    </RightModal>
  );
};

export default JDBCConnectionEdit;
