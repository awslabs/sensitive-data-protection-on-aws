import {
  AppLayout,
  Button,
  Container,
  FormField,
  Grid,
  Header,
  Icon,
  Input,
  SelectProps,
  SpaceBetween,
  Textarea,
  Toggle,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import './style.scss';
import { alertMsg, deepClone, toJsonList } from 'tools/tools';
import { createIdentifiers, updateIdentifiers } from 'apis/data-template/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { useTranslation } from 'react-i18next';
import PropsSelect from 'common/PropsSelect';
import PropsModal, { Props } from 'common/PropsModal';

export interface PropsType {
  create_by: string;
  create_time: string;
  id: string;
  modify_by: string;
  modify_time: string;
  prop_name: string;
  prop_type: number;
  version: null;
}

const findCategoryLabelAndConvertOption = (type: string, props: Props[]) => {
  const categoryLable = props.find(
    (element) => element.prop_type.toString() === type
  );
  if (categoryLable) {
    const { prop_name: label, id: value } = categoryLable;
    return { label, value };
  }
  return {
    label: 'N/A',
    value: '',
  };
};

const CreateIdentifierHeader: React.FC = () => {
  const location = useLocation();
  const {
    oldData = {
      id: 0,
    },
  } = location.state || {};
  return (
    <Header variant="h1" description="">
      {oldData.id ? 'Edit' : 'Create'} custom data identifier
    </Header>
  );
};

const CreateIdentifierContent = () => {
  const location = useLocation();
  const {
    oldData = {
      id: 0,
    },
  } = location.state || {};
  const { t } = useTranslation();
  const [identifierName, setIdentifierName] = useState(oldData.name);
  const [identifierDescription, setIdentifierDescription] = useState(
    oldData.description
  );
  const [simpleData, setSimpleData] = useState('');
  const [patternToggle, setPatternToggle] = useState(
    location.state ? !!oldData.rule || oldData.rule === '' : true
  );
  const [keywordToggle, setKeywordToggle] = useState(
    location.state
      ? !!oldData.header_keywords || oldData.header_keywords === ''
      : true
  );
  const propKeyList = toJsonList(oldData.header_keywords);
  const [keywordList, setKeywordList] = useState(
    propKeyList ? propKeyList : ['']
  );
  const [patternRex, setPatternRex] = useState(oldData.rule || '');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<SelectProps.Option>(
    findCategoryLabelAndConvertOption('1', oldData.props)
  );
  const [selectedLabel, setSelectedLabel] = useState<SelectProps.Option>(
    findCategoryLabelAndConvertOption('2', oldData.props)
  );

  const [showModal, setShowModal] = useState(false);
  const [refreshCategoryLableList, setRefreshCategoryLableList] = useState(0);
  const [modalType, setModalType] = useState('');
  // const [loadingSave, setLoadingSave] = useState(false);
  const showEditCategoryLabelModal = (curType: string, item: any) => {
    setModalType(curType);
    setShowModal(true);
  };

  useEffect(() => {
    if (!patternToggle) {
      setPatternRex('');
    }
  }, [patternToggle]);

  useEffect(() => {
    if (!keywordToggle) {
      setKeywordList(['']);
    }
  }, [keywordToggle]);

  const addNewContextWord = () => {
    const tempList = deepClone(keywordList);
    tempList.push('');
    setKeywordList(tempList);
  };

  const removeContextWord = (index: string | number) => {
    const tempList = deepClone(keywordList);
    if (!tempList || tempList.length < index) {
      return;
    }
    tempList.splice(index, 1);
    setKeywordList(tempList);
  };

  const changeContextWord = (inputValue: string, index: string | number) => {
    const tempList = deepClone(keywordList);
    tempList[index] = inputValue;
    setKeywordList(tempList);
  };

  const navigate = useNavigate();

  const backNavigate = () => {
    navigate(-1);
  };

  const clkValidate = (needSuccess = true) => {
    if (!patternRex) {
      needSuccess && alertMsg('Your regular expression is valid.', 'success');
      return true;
    }
    let isReg = true;
    try {
      new RegExp(patternRex);
    } catch (e) {
      isReg = false;
    }

    isReg &&
      needSuccess &&
      alertMsg('Your regular expression is valid.', 'success');

    !isReg && alertMsg('Your regular expression is not valid.', 'error');
    return isReg;
  };

  const submitIdentifier = async () => {
    if (!identifierName) {
      alertMsg('Please input name', 'error');
      return;
    }
    if (!clkValidate(false)) {
      return;
    }
    setIsLoading(true);
    const tempHeadList =
      keywordList && Array.isArray(keywordList) && keywordList.length > 0
        ? JSON.stringify(keywordList)
        : '';

    const newProps = [];
    if (selectedCategory.value) {
      newProps.push(selectedCategory.value);
    }
    if (selectedLabel.value) {
      newProps.push(selectedLabel.value);
    }
    const requestParam: any = {
      description: identifierDescription,
      type: 1,
      name: identifierName,
      category: 1,
      privacy: 0,
      rule: patternToggle ? patternRex : null,
      header_keywords: keywordToggle ? tempHeadList : null,
      props: newProps,
    };
    if (oldData.id) {
      requestParam.id = oldData.id;
    }
    try {
      const result: any = requestParam.id
        ? await updateIdentifiers(requestParam)
        : await createIdentifiers(requestParam);

      if (result && result.id >= 0) {
        alertMsg(
          requestParam.id ? 'Update success' : 'Create success',
          'success'
        );
        setTimeout(() => {
          navigate(RouterEnum.TemplateIdentifiers.path, {
            state: {
              tabState: {
                active: oldData.type.toString() === '1' ? 'custom' : 'builtIn',
              },
            },
          });
        }, 800);
      } else {
        alertMsg('Create error', 'error');
      }
    } catch {
      setIsLoading(false);
    }
  };

  const runTest = () => {
    if (!simpleData || !patternRex) {
      return;
    }
    if (new RegExp(patternRex).test(simpleData)) {
      alertMsg('The example data conforms to the regular', 'success');
    } else {
      alertMsg('The sample data does not conform to the regular', 'error');
    }
  };

  return (
    <Grid gridDefinition={[{ colspan: 7 }, { colspan: 5 }]}>
      <SpaceBetween
        direction="vertical"
        size="xl"
        className="identifier-create-container"
      >
        <Container header={<Header variant="h2">Basic information</Header>}>
          <SpaceBetween direction="vertical" size="xs">
            <FormField
              label="Name"
              constraintText="The name can be up to 25 characters. Valid characters are a-z, A-Z,
            0-9, . (period), _ (underscore) and - (hyphen)."
            >
              <Input
                value={identifierName}
                onChange={({ detail }) =>
                  detail.value.length <= 60 && setIdentifierName(detail.value)
                }
                placeholder="Identifier name"
              />
            </FormField>

            <FormField label="Description - optional">
              <Input
                value={identifierDescription}
                onChange={({ detail }) =>
                  detail.value.length <= 60 &&
                  setIdentifierDescription(detail.value)
                }
                placeholder="Description"
              />
            </FormField>
          </SpaceBetween>
        </Container>

        <Container
          header={
            <Header
              variant="h2"
              description="Only if all rules are met, then the platform will auto-label the data as sensitive data (e.g. contain PII)."
            >
              Identification rules
            </Header>
          }
          className="rules-container"
        >
          <SpaceBetween direction="vertical" size="xs">
            <Toggle
              onChange={({ detail }) => setPatternToggle(detail.checked)}
              checked={patternToggle}
            >
              <b>Identify data pattern in column values</b>
            </Toggle>
            {patternToggle && (
              <>
                <Textarea
                  value={patternRex}
                  onChange={({ detail }) => {
                    setPatternRex(detail.value);
                  }}
                  placeholder="/^((\+|00)86)?1((3[\d])|(4[5,6,7,9])|(5[0-3,5-9])|(6[5-7])|(7[0-8])|(8[\d])|(9[1,8,9]))\d{8}$/"
                  rows={10}
                />
                <Button
                  className="run-test-btn"
                  onClick={() => clkValidate(true)}
                >
                  {t('button.validate')}
                </Button>
              </>
            )}
            <Toggle
              onChange={({ detail }) => setKeywordToggle(detail.checked)}
              checked={keywordToggle}
            >
              <b>Identify keywords in column headers</b>
            </Toggle>
            {keywordToggle && (
              <>
                {keywordList.map((item: string, index: number) => {
                  return (
                    <div className="" key={'keywords-column' + index}>
                      <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                        <div className="flex-1 mr-10">
                          <Input
                            value={item}
                            onChange={({ detail }) =>
                              changeContextWord(detail.value, index)
                            }
                            className="input-keyword"
                          />
                        </div>

                        <Button
                          onClick={() => removeContextWord(index)}
                          disabled={keywordList.length <= 1}
                        >
                          {t('button.remove')}
                        </Button>
                      </Grid>
                    </div>
                  );
                })}
                {oldData.type !== 0 && (
                  <Button
                    className="run-test-btn"
                    disabled={keywordList && keywordList.length >= 30}
                    onClick={addNewContextWord}
                  >
                    {t('button.addNewKeyword')}
                  </Button>
                )}
                {keywordList && keywordList.length >= 30 && (
                  <span className="warning-tips">
                    <Icon name="status-warning" />
                    &nbsp;&nbsp;You have exceeded the limit of 30 tags.
                  </span>
                )}
              </>
            )}
          </SpaceBetween>
        </Container>

        <Container
          header={
            <Header
              variant="h2"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => {
                      showEditCategoryLabelModal('1', oldData);
                    }}
                  >
                    Manage Category
                  </Button>
                  <Button
                    onClick={() => {
                      showEditCategoryLabelModal('2', oldData);
                    }}
                  >
                    Manage Label
                  </Button>
                </SpaceBetween>
              }
            >
              Identifier properties
            </Header>
          }
        >
          <div className="flex gap-10">
            <div className="flex-1">
              <FormField label="Select a category">
                <PropsSelect
                  refresh={refreshCategoryLableList}
                  type="1"
                  selectOption={selectedCategory}
                  changeSelectValue={(option) => {
                    setSelectedCategory(option);
                  }}
                />
              </FormField>
            </div>
            <div className="flex-1">
              <FormField label="Select a label">
                <PropsSelect
                  refresh={refreshCategoryLableList}
                  type="2"
                  selectOption={selectedLabel}
                  changeSelectValue={(option) => {
                    setSelectedLabel(option);
                  }}
                />
              </FormField>
            </div>
          </div>
        </Container>

        <div className="text-right">
          <Button className="identifier-opt-btn" onClick={backNavigate}>
            {t('button.back')}
          </Button>
          <Button
            className="ml-10"
            variant="primary"
            onClick={submitIdentifier}
            loading={isLoading}
            disabled={(!identifierName && !patternRex) || oldData.type === 0}
          >
            {t('button.save')}
          </Button>
        </div>
      </SpaceBetween>

      <Container
        header={<Header variant="h2">Evaluate with sample data</Header>}
        className="mt-evaluate"
      >
        <SpaceBetween direction="vertical" size="xs">
          <FormField label="Sample data">
            <Textarea
              value={simpleData}
              onChange={({ detail }) => setSimpleData(detail.value)}
              placeholder="order-id-21231412-3213123143-155655665-ok"
              rows={10}
            />
          </FormField>
          <Button
            className="run-test-btn"
            onClick={runTest}
            disabled={!patternRex && !simpleData}
          >
            {t('button.runTest')}
          </Button>
        </SpaceBetween>
      </Container>

      <PropsModal
        isManage
        propsType={modalType}
        showModal={showModal}
        defaultSelectPropss={[]}
        clickHideModal={() => {
          setRefreshCategoryLableList((prev) => {
            return prev + 1;
          });
          setShowModal(false);
        }}
        saveLoading={false}
        savePropsToResource={(props) => {
          console.info(props);
        }}
      />
    </Grid>
  );
};

const CreateIdentifier: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.dataIdentifiers'),
      href: RouterEnum.CreateIdentifiers.path,
    },
  ];
  return (
    <AppLayout
      contentHeader={<CreateIdentifierHeader />}
      content={<CreateIdentifierContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Home.path} />}
      navigationWidth={290}
    />
  );
};

export default CreateIdentifier;
