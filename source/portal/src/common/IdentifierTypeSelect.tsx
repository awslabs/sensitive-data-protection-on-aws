import { Select, SelectProps } from '@cloudscape-design/components';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface IdentifierTypeSelectProps {
  typeValue: SelectProps.Option | null;
  changeType: (type: SelectProps.Option | null) => void;
}

const IdentifierTypeSelect: React.FC<IdentifierTypeSelectProps> = (
  props: IdentifierTypeSelectProps
) => {
  const { t } = useTranslation();
  const { typeValue, changeType } = props;
  return (
    <div className="flex-1">
      <Select
        placeholder={t('table.label.identifierType') ?? ''}
        selectedOption={typeValue}
        onChange={({ detail }) => changeType(detail.selectedOption)}
        options={[
          {
            label: t('allType') ?? '',
            value: '',
          },
          { label: t('identifier:textBased') ?? '', value: 'text' },
          { label: t('identifier:imageBased') ?? '', value: 'image' },
        ]}
      />
    </div>
  );
};

export default IdentifierTypeSelect;
