import { Header, Table, Box } from '@cloudscape-design/components';
import React from 'react';
import { ITableListKeyValue } from 'ts/dashboard/types';
import '../../../style.scss';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';

interface TableDataProps {
  title: string;
  keyLable: string;
  valueLable: string;
  dataList: ITableListKeyValue[];
}

const TableData: React.FC<TableDataProps> = (props: TableDataProps) => {
  const { title, keyLable, valueLable, dataList } = props;
  const navigate = useNavigate();
  const clkCount = (typeValue: any) => {
    if (valueLable === 'S3 buckets') {
      navigate(
        `${RouterEnum.Catalog.path}?tagType=s3&accountId=${typeValue}&privacy=1`
      );
    }

    if (valueLable === 'RDS instances' && keyLable === 'AWS account') {
      navigate(
        `${RouterEnum.Catalog.path}?tagType=rds&accountId=${typeValue}&privacy=1`
      );
    }

    if (valueLable === 'RDS instances' && keyLable === 'Data identifier') {
      navigate(
        `${RouterEnum.Catalog.path}?tagType=rds&identifiers=${typeValue}`
      );
    }

    if (valueLable === 'Total buckets') {
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
          ]}
          items={dataList}
          loadingText="Loading resources"
          sortingDisabled
          // stickyHeader
          empty={
            <Box textAlign="center" color="inherit">
              <b>No resources</b>
              <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                No resources to display.
              </Box>
            </Box>
          }
        />
      </div>
    </div>
  );
};

export default TableData;
