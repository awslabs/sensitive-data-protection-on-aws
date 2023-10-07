import {
  Container,
  Grid,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useTranslation } from 'react-i18next';
import RuleKeywords from './RuleKeywords';
import { useState } from 'react';

const AdvancedSettings = () => {
  const { t } = useTranslation();
  const [ruleRegexObj, setRuleRegexObj] = useState({
    excludeKeywords: '',
    excludeKeyWordsEnable: false,
    includeKeywords: '',
    includeKeyWordsEnable: false,
    excludeExtensions: '',
    excludeExtensionsEnable: false,
    includeExtensions: '',
    includeExtensionsEnable: false,
  });
  return (
    <SpaceBetween direction="vertical" size="l">
      <Container
        header={
          <Header
            variant="h2"
            description={
              <div>
                <div>
                  Exclude: If keywords appeared in column header, then the
                  column will be marked as "Non-PII"
                </div>
                <div>
                  Include: If keywords appeared in column header, then the
                  column will be marked as "Contains-PII"
                </div>
                <div>
                  This rule applies to all data catalogs selected in this job.
                  This job rule will override identifier rule.
                </div>
              </div>
            }
          >
            {t('job:create.exclusiveRules')}
          </Header>
        }
      >
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <RuleKeywords
            title="Exclude keywords"
            placeholder={`.xml\n.abc\n.ddl`}
            enabled={ruleRegexObj.excludeKeyWordsEnable}
            changeEnable={(enable) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  excludeKeyWordsEnable: enable,
                };
              });
            }}
            regexText={ruleRegexObj.excludeKeywords}
            changeRegexValue={(value) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  excludeKeywords: value,
                };
              });
            }}
          />
          <RuleKeywords
            title="Include keywords"
            placeholder={`.xml\n.abc\n.ddl`}
            enabled={ruleRegexObj.includeKeyWordsEnable}
            changeEnable={(enable) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  includeKeyWordsEnable: enable,
                };
              });
            }}
            regexText={ruleRegexObj.includeKeywords}
            changeRegexValue={(value) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  includeKeywords: value,
                };
              });
            }}
          />
        </Grid>
      </Container>
      <Container
        header={
          <Header
            variant="h2"
            description={
              <div>
                <div>
                  Exclude: The files with the following extensions will be
                  marked as "Non-PII"
                </div>
                <div>
                  Include: The files with the following extensions will be
                  marked as "Contains-PII"
                </div>
              </div>
            }
          >
            {t('job:create.exclusiveRules')}
          </Header>
        }
      >
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <RuleKeywords
            title="Exclude file extensions"
            placeholder={`.xml\n.abc\n.ddl`}
            enabled={ruleRegexObj.excludeExtensionsEnable}
            changeEnable={(enable) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  excludeExtensionsEnable: enable,
                };
              });
            }}
            regexText={ruleRegexObj.excludeExtensions}
            changeRegexValue={(value) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  excludeExtensions: value,
                };
              });
            }}
          />
          <RuleKeywords
            title="Include file extensions"
            placeholder={`.xml\n.abc\n.ddl`}
            enabled={ruleRegexObj.includeExtensionsEnable}
            changeEnable={(enable) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  includeExtensionsEnable: enable,
                };
              });
            }}
            regexText={ruleRegexObj.includeExtensions}
            changeRegexValue={(value) => {
              setRuleRegexObj((prev) => {
                return {
                  ...prev,
                  includeExtensions: value,
                };
              });
            }}
          />
        </Grid>
      </Container>
    </SpaceBetween>
  );
};

export default AdvancedSettings;
