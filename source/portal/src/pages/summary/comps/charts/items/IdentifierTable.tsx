import { Header, Table, Box } from '@cloudscape-design/components';
import React from 'react';
import { ITableListKeyValue } from 'ts/dashboard/types';
import '../../../style.scss';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import { Props } from 'common/PropsModal';

interface IdentifierTableProps {
  title: string;
  keyLable: string;
  valueLable: string;
  dataList: ITableListKeyValue[];
}

const IdentifierTableData: React.FC<IdentifierTableProps> = (
  props: IdentifierTableProps
) => {
  const { title, keyLable, valueLable, dataList } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clkCount = (typeValue: any) => {
    if (valueLable === t('summary:s3Bucket')) {
      navigate(
        `${RouterEnum.Catalog.path}?tagType=s3&accountId=${typeValue}&privacy=1`
      );
    }

    if (
      valueLable === t('summary:rdsIntacnes') &&
      keyLable === t('summary:awsAccount')
    ) {
      navigate(
        `${RouterEnum.Catalog.path}?tagType=rds&accountId=${typeValue}&privacy=1`
      );
    }

    if (
      valueLable === t('summary:rdsIntacnes') &&
      keyLable === t('summary:dataIdentifier')
    ) {
      navigate(
        `${RouterEnum.Catalog.path}?tagType=rds&identifiers=${typeValue}`
      );
    }

    if (valueLable === t('summary:totalBuckets')) {
      navigate(
        `${RouterEnum.Catalog.path}?tagType=s3&identifiers=${typeValue}`
      );
    }
    return;
  };
  return (
    <div>
      <Header variant="h3">{title}</Header>
      <div className="max-table-height">
        <Table
          variant="embedded"
          columnDefinitions={[
            {
              id: 'name',
              header: keyLable,
              cell: (item) => item.name || '-',
              sortingField: 'name',
            },
            {
              id: 'data_source_count',
              header: valueLable,
              cell: (item) => {
                return (
                  (
                    <span
                      onClick={() => clkCount(item.name)}
                      className="source-count"
                    >
                      {item.data_source_count || '-'}
                    </span>
                  ) || '-'
                );
              },
              sortingField: 'data_source_count',
            },
            {
              id: 'category',
              header: t('category.category'),
              cell: (item) => {
                return (
                  item?.props?.find(
                    (prop: Props) => prop.prop_type?.toString() === '1'
                  )?.prop_name || 'N/A'
                );
              },
            },
            {
              id: 'label',
              header: t('identLabel.identLabel'),
              cell: (item) => {
                return (
                  item?.props?.find(
                    (prop: Props) => prop.prop_type?.toString() === '2'
                  )?.prop_name || 'N/A'
                );
              },
            },
          ]}
          items={dataList}
          loadingText={t('table.loadingResources') || ''}
          sortingDisabled
          // stickyHeader
          empty={
            <Box textAlign="center" color="inherit">
              <b>{t('table.noResources')}</b>
              <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                {t('table.noResourcesDisplay')}
              </Box>
            </Box>
          }
        />
      </div>
    </div>
  );
};

export default IdentifierTableData;
