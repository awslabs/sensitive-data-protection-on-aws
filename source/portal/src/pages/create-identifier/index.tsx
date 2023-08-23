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
  const categoryLable = props?.find(
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
  const { t } = useTranslation();
  const {
    oldData = {
      id: 0,
    },
  } = location.state || {};
  return (
    <Header variant="h1" description="">
      {t('identifier:customDataIdent', {
        type: oldData.id ? t('edit') : t('create'),
      })}
    </Header>
  );
};

const CreateIdentifierContent = (props: any) => {
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
  const [excludeKeywordsToggle, setExcludeKeywordsToggle] = useState(
    location.state ? !!oldData.exclude_keywords || oldData.exclude_keywords === '' : true
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
  // const excludeKeyList = toJsonList(oldData.exclude_keywords);
  // const [excludeKeywordList, setExcludeKeywordList] = useState(
  //   excludeKeyList ? excludeKeyList : ['']
  // );
  const [patternRex, setPatternRex] = useState(oldData.rule || '');
  const [excludeKeyword, setExcludeKeyword] = useState(oldData.exclude_keywords || '');
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
  const [cleanData, setCleanData] = useState(1);
  const showEditCategoryLabelModal = (curType: string, item: any) => {
    setModalType(curType);
    setShowModal(true);
  };

  useEffect(() => {
    if (!patternToggle) {
      setPatternRex('');
    }
  }, [patternToggle]);

  // useEffect(() => {
  //   if (!excludeKeywordsToggle) {
  //     setExcludeKeywordList(['']);
  //   }
  // }, [setExcludeKeywordsToggle]);

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
      needSuccess && alertMsg(t('identifier:regexValid'), 'success');
      return true;
    }
    let isReg = true;
    try {
      new RegExp(patternRex);
    } catch (e) {
      isReg = false;
    }

    isReg && needSuccess && alertMsg(t('identifier:regexValid'), 'success');

    !isReg && alertMsg(t('identifier:regexNotValid'), 'error');
    return isReg;
  };

  const submitIdentifier = async () => {
    if (!identifierName) {
      alertMsg(t('identifier:inputName'), 'error');
      return;
    }
    if (!clkValidate(false)) {
      return;
    }

    const tempHeadList =
      keywordList && Array.isArray(keywordList) && keywordList.length > 0
        ? JSON.stringify(keywordList)
        : '';
    
    // const excludeList = excludeKeyword?excludeKeyword.split("\n"):[];
    // const  = excludeList && Array.isArray(excludeList) && excludeList.length > 0
    // ? JSON.stringify(excludeList)
    // : '';


    const containsEmpty = keywordList?.some((str: string) => str.trim() === '');
    if (keywordToggle && containsEmpty) {
      alertMsg(t('identifier:keywordAlert'), 'info');
      return;
    }

    const newProps = [];
    if (selectedCategory.value) {
      newProps.push(selectedCategory.value);
    }
    if (selectedLabel.value) {
      newProps.push(selectedLabel.value);
    }
    setIsLoading(true);
    const requestParam: any = {
      description: identifierDescription,
      type: 1,
      name: identifierName,
      classification: 1,
      privacy: 0,
      rule: patternToggle ? patternRex : null,
      header_keywords: keywordToggle ? tempHeadList : null,
      exclude_keywords: excludeKeywordsToggle ? excludeKeyword: null,
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
          requestParam.id ? t('updateSuccess') : t('createSuccess'),
          'success'
        );
        setTimeout(() => {
          navigate(RouterEnum.TemplateIdentifiers.path, {
            state: {
              tabState: {
                active:
                  oldData?.type?.toString() === '0' ? 'builtIn' : 'custom',
              },
            },
          });
        }, 800);
      } else {
        alertMsg(oldData.id ? t('updateFailed') : t('createFailed'), 'error');
      }
    } catch {
      setIsLoading(false);
    }
  };

  const runTest = () => {
    if (!simpleData || !patternRex) {
      return;
    }
    try {
      if (new RegExp(patternRex).test(simpleData)) {
        alertMsg(t('identifier:exampleConformsRegex'), 'success');
      } else {
        alertMsg(t('identifier:exampleNotConformRegex'), 'error');
      }
    } catch (error: any) {
      alertMsg(error.message, 'error');
    }
  };

  return (
    <Grid gridDefinition={[{ colspan: 7 }, { colspan: 5 }]}>
      <SpaceBetween
        direction="vertical"
        size="xl"
        className="identifier-create-container"
      >
        <Container
          header={<Header variant="h2">{t('identifier:basicInfo')}</Header>}
        >
          <SpaceBetween direction="vertical" size="xs">
            <FormField
              label={t('identifier:name')}
              constraintText={t('identifier:identNameConstraint')}
            >
              <Input
                disabled={oldData.id}
                value={identifierName}
                onChange={({ detail }) =>
                  detail.value.length <= 60 && setIdentifierName(detail.value)
                }
                placeholder={t('identifier:identName') || ''}
              />
            </FormField>

            <FormField label={t('identifier:identDesc')}>
              <Input
                value={identifierDescription}
                onChange={({ detail }) =>
                  detail.value.length <= 60 &&
                  setIdentifierDescription(detail.value)
                }
                placeholder={t('identifier:identDescDesc') || ''}
              />
            </FormField>
          </SpaceBetween>
        </Container>

        <Container
          header={
            <Header variant="h2" description={t('identifier:identRulesDesc')}>
              {t('identifier:identRules')}
            </Header>
          }
          className="rules-container"
        >
          <SpaceBetween direction="vertical" size="xs">
            <Toggle
              onChange={({ detail }) => setPatternToggle(detail.checked)}
              checked={patternToggle}
            >
              <b>{t('identifier:identDataPattern')}</b>
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
              <b>{t('identifier:identKeywords')}</b>
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
                    &nbsp;&nbsp;{t('identifier:identExceedLimit')}
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
                    {t('button.manageCategory')}
                  </Button>
                  <Button
                    onClick={() => {
                      showEditCategoryLabelModal('2', oldData);
                    }}
                  >
                    {t('button.manageLabel')}
                  </Button>
                </SpaceBetween>
              }
            >
              {t('identifier:identProperties')}
            </Header>
          }
        >
          <div className="flex gap-10">
            <div className="flex-1">
              <FormField label={t('identifier:selectCategory')}>
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
              <FormField label={t('identifier:selectLabel')}>
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

        <Container
          header={
            <Header
              variant="h2"
              description={t('identifier:excludeRulesDesc')}
            >
              {t('identifier:excludeRules')}
            </Header>
          }
        >
          <SpaceBetween direction="vertical" size="xs">
            <Toggle
              onChange={({ detail }) => setExcludeKeywordsToggle(detail.checked)}
              checked={excludeKeywordsToggle}
            >
              <b>{t('identifier:ignoreToggle')}</b>
            </Toggle>
            {excludeKeywordsToggle && (
              <>
                <Textarea  
                  value={excludeKeyword?JSON.parse(excludeKeyword).join("\n"):""}
                  onChange={({ detail }) => {
                    setExcludeKeyword(JSON.stringify(detail.value.split("\n")));
                  }}
                  placeholder={t('identifier:excludeRulesPlaceholder')??""}
                  rows={10}
                />
              </>
            )}
          </SpaceBetween>
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
        header={
          <Header variant="h2">{t('identifier:evaluateSampleData')}</Header>
        }
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
        cleanData={cleanData}
        saveLoading={false}
        savePropsToResource={(props) => {
          setCleanData((prev) => {
            return prev + 1;
          });
        }}
      />
    </Grid>
  );
};

const CreateIdentifier: React.FC = (props:any) => {
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
      toolsHide
      contentHeader={<CreateIdentifierHeader />}
      content={<CreateIdentifierContent intl={props.intl}/>}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Home.path} />}
      navigationWidth={290}
    />
  );
};

export default CreateIdentifier;
