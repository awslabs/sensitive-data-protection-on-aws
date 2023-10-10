import {
  Container,
  Grid,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useTranslation } from 'react-i18next';
import RuleKeywords from 'common/RuleKeywords';
import { IJobType } from 'pages/data-job/types/job_list_type';

interface AdvancedSettingsProps {
  jobData: IJobType;
  changeExcludeKeywordEnable: (enable: boolean) => void;
  changeExcludeKeyword: (keyword: string) => void;
  changeIncludeKeywordEnable: (enable: boolean) => void;
  changeIncludeKeyword: (keyword: string) => void;
  changeExcludeFileExtensionEnable: (enable: boolean) => void;
  changeExcludeFileExtension: (extension: string) => void;
  changeIncludeFileExtensionEnable: (enable: boolean) => void;
  changeIncludeFileExtension: (extension: string) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = (
  props: AdvancedSettingsProps
) => {
  const { t } = useTranslation();
  const {
    jobData,
    changeExcludeKeywordEnable,
    changeExcludeKeyword,
    changeIncludeKeywordEnable,
    changeIncludeKeyword,
    changeExcludeFileExtensionEnable,
    changeExcludeFileExtension,
    changeIncludeFileExtensionEnable,
    changeIncludeFileExtension,
  } = props;
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
            enabled={jobData.excludeKeyWordsEnable}
            changeEnable={(enable) => {
              changeExcludeKeywordEnable(enable);
            }}
            regexText={jobData.exclude_keywords}
            changeRegexValue={(value) => {
              changeExcludeKeyword(value);
            }}
          />
          <RuleKeywords
            title="Include keywords"
            placeholder={`.xml\n.abc\n.ddl`}
            enabled={jobData.includeKeyWordsEnable}
            changeEnable={(enable) => {
              changeIncludeKeywordEnable(enable);
            }}
            regexText={jobData.include_keywords}
            changeRegexValue={(value) => {
              changeIncludeKeyword(value);
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
            Advanced rules：Exclude file extensions for this job
          </Header>
        }
      >
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <RuleKeywords
            title="Exclude file extensions"
            placeholder={`.xml\n.abc\n.ddl`}
            enabled={jobData.excludeExtensionsEnable}
            changeEnable={(enable) => {
              changeExcludeFileExtensionEnable(enable);
            }}
            regexText={jobData.exclude_file_extensions}
            changeRegexValue={(value) => {
              changeExcludeFileExtension(value);
            }}
          />
          <RuleKeywords
            title="Include file extensions"
            placeholder={`.xml\n.abc\n.ddl`}
            enabled={jobData.includeExtensionsEnable}
            changeEnable={(enable) => {
              changeIncludeFileExtensionEnable(enable);
            }}
            regexText={jobData.include_file_extensions}
            changeRegexValue={(value) => {
              changeIncludeFileExtension(value);
            }}
          />
        </Grid>
      </Container>
    </SpaceBetween>
  );
};

export default AdvancedSettings;
