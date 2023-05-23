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
  const [propsOptionList, setPropsOptionList] = useState<SelectProps.Option[]>(
    []
  );
  const { t } = useTranslation();
  const getPropsOptionListByType = async () => {
    try {
      const result: PropsType[] = await requestPropsByType({
        type: type,
      });
      const tmpOptions: SelectProps.Option[] = [
        isSearch
          ? {
              label: t('all') || '',
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
    } catch (error) {
      console.error(error);
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
    <div>
      <Select
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
  );
};

export default PropsSelect;
