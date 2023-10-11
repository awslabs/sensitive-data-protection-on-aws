import { Textarea, Toggle } from '@cloudscape-design/components';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RuleKeywordsProps {
  title: string | null;
  placeholder?: string;
  enabled: boolean;
  changeEnable: (enable: boolean) => void;
  regexText: string;
  changeRegexValue: (value: string) => void;
}

const RuleKeywords: React.FC<RuleKeywordsProps> = (
  props: RuleKeywordsProps
) => {
  const {
    title,
    placeholder,
    enabled,
    changeEnable,
    regexText,
    changeRegexValue,
  } = props;

  const { t } = useTranslation();
  return (
    <div>
      <Toggle
        onChange={({ detail }) => changeEnable(detail.checked)}
        checked={enabled}
      >
        <b>{title}</b>
      </Toggle>
      {enabled && (
        <>
          <Textarea
            value={regexText}
            onChange={({ detail }) => {
              changeRegexValue(detail.value);
            }}
            placeholder={placeholder}
            rows={6}
          />
        </>
      )}
    </div>
  );
};

export default RuleKeywords;
