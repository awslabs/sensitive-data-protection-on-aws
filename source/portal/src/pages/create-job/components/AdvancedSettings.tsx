import {
  Container,
  Grid,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useTranslation } from 'react-i18next';
import RuleKeywords from 'common/RuleKeywords';
import { IJobType } from 'pages/data-job/types/job_list_type';
import { SOURCE_TYPE } from 'enum/common_types';

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
                <div>{t('job:create.keywordDesc1')}</div>
                <div>{t('job:create.keywordDesc2')}</div>
                <div>{t('job:create.keywordDesc3')}</div>
              </div>
            }
          >
            {t('job:create.exclusiveRules')}
          </Header>
        }
      >
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <RuleKeywords
            title={t('job:create.excludeKeywords')}
            placeholder={`keyword1\nkeyword2\nkeyword3`}
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
            title={t('job:create.includeKeywords')}
            placeholder={`keyword1\nkeyword2\nkeyword3`}
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

      {jobData.database_type === SOURCE_TYPE.S3 && (
        <Container
          header={
            <Header
              variant="h2"
              description={
                <div>
                  <div>{t('job:create.fileDesc1')}</div>
                  <div>{t('job:create.fileDesc2')}</div>
                </div>
              }
            >
              {t('job:create.advancedFile')}
            </Header>
          }
        >
          <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
            <RuleKeywords
              title={t('job:create.excludeFile')}
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
              title={t('job:create.includeFile')}
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
      )}
    </SpaceBetween>
  );
};

export default AdvancedSettings;
