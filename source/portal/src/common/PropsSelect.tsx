import { Select, SelectProps } from '@cloudscape-design/components';
import { requestPropsByType } from 'apis/props/api';
import { PropsType } from 'pages/create-identifier';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PropsSelectProps {
  isSearch?: boolean;
  refresh?: number;
  type: string;
  selectOption: SelectProps.Option | null;
  changeSelectValue: (option: SelectProps.Option) => void;
}
const PropsSelect: React.FC<PropsSelectProps> = (props: PropsSelectProps) => {
  const { refresh, isSearch, type, selectOption, changeSelectValue } = props;
  const [loadingData, setLoadingData] = useState(false);
  const [propsOptionList, setPropsOptionList] = useState<SelectProps.Option[]>(
    []
  );
  const { t } = useTranslation();
  const getPropsOptionListByType = async () => {
    setLoadingData(true);
    setPropsOptionList([]);
    try {
      const result: PropsType[] = await requestPropsByType({
        type: type,
      });
      const tmpOptions: SelectProps.Option[] = [
        isSearch
          ? {
              label:
                type === '1' ? t('allCategory') || '' : t('allLabel') || '',
              value: '',
            }
          : {
              label: 'N/A',
              value: '',
            },
      ];
      if (result && result.length > 0) {
        result
          .sort((a, b) => a.prop_name.localeCompare(b.prop_name))
          .forEach((element) => {
            tmpOptions.push({
              label: element.prop_name,
              value: element.id,
            });
          });
        setPropsOptionList(tmpOptions);
      }
      setLoadingData(false);
    } catch (error) {
      console.error(error);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    getPropsOptionListByType();
  }, []);

  useEffect(() => {
    if (refresh) {
      getPropsOptionListByType();
    }
  }, [refresh]);

  return (
    <div className="flex">
      <div className="flex-1">
        <Select
          statusType={loadingData ? 'loading' : 'finished'}
          onFocus={() => {
            getPropsOptionListByType();
          }}
          placeholder={
            (type === '1'
              ? t('category.category')
              : t('identLabel.identLabel')) || ''
          }
          selectedOption={selectOption}
          onChange={({ detail }) => changeSelectValue(detail.selectedOption)}
          options={propsOptionList}
          selectedAriaLabel={t('selected') || ''}
        />
      </div>
    </div>
  );
};

export default PropsSelect;
