import { Select, SelectProps } from '@cloudscape-design/components';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const IdentifierTypeSelect = () => {
  const { t } = useTranslation();
  const [identifierType, setIdentifierType] = useState<SelectProps.Option>({
    label: t('allType') ?? '',
    value: '',
  });
  return (
    <div className="flex-1">
      <Select
        placeholder={t('table.label.identifierType') ?? ''}
        selectedOption={identifierType}
        onChange={({ detail }) => setIdentifierType(detail.selectedOption)}
        options={[
          { label: t('identifier:textBased') ?? '', value: '1' },
          { label: t('identifier:imageBased') ?? '', value: '2' },
        ]}
      />
    </div>
  );
};

export default IdentifierTypeSelect;
