import { Spinner } from '@cloudscape-design/components';
import { requestJobProgress } from 'apis/data-job/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ProgressType {
  run_database_id: number;
  current_table_count: number;
  table_count: number;
  current_table_count_unstructured: number;
  table_count_unstructured: number;
}

interface GlueJobProgressProps {
  showValue?: boolean;
  refresh?: number;
  jobDetailData: any;
  jobRowData: any;
}

const GlueJobProgress: React.FC<GlueJobProgressProps> = (
  props: GlueJobProgressProps
) => {
  const { jobRowData, jobDetailData, showValue, refresh } = props;
  const { t } = useTranslation();
  const [loadingData, setLoadingData] = useState(false);
  const [jobProgressPercent, setJobProgressPercent] = useState(0);
  const [curCount, setCurCount] = useState(0);
  const [tableCount, setTableCount] = useState(0);
  const getJobProgress = async () => {
    setLoadingData(true);
    try {
      const result: ProgressType = await requestJobProgress({
        id: jobDetailData.job_id,
        run_id: jobRowData.run_id,
        run_database_id: jobRowData.id,
      });
      const curTableCountSum =
        result.current_table_count + result.current_table_count_unstructured;
      const tableCountSum =
        result.table_count + result.table_count_unstructured;
      setCurCount(curTableCountSum);
      setTableCount(tableCountSum);
      if (tableCountSum > 0) {
        setJobProgressPercent(curTableCountSum / tableCountSum);
      }
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
      console.info(error);
    }
  };

  useEffect(() => {
    getJobProgress();
  }, [refresh]);

  useEffect(() => {
    getJobProgress();
  }, []);

  if (loadingData) {
    return <Spinner />;
  }

  if (showValue) {
    return (
      <div>
        {curCount === -1 ? (
          t('pending')
        ) : (
          <span>{`${curCount}/${tableCount}`}</span>
        )}
      </div>
    );
  } else {
    return (
      <div>
        {curCount === -1 ? (
          t('pending')
        ) : (
          <span>{`${Math.floor(jobProgressPercent) * 100}%`}</span>
        )}
      </div>
    );
  }
};

export default GlueJobProgress;
