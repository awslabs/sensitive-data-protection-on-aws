import { Spinner } from '@cloudscape-design/components';
import { requestJobProgress } from 'apis/data-job/api';
import React, { useState, useEffect } from 'react';

interface ProgressType {
  current_table_count: number;
  table_count: number;
}

interface GlueJobProgressProps {
  jobDetailData: any;
  jobRowData: any;
}

const GlueJobProgress: React.FC<GlueJobProgressProps> = (
  props: GlueJobProgressProps
) => {
  const { jobRowData, jobDetailData } = props;
  const [loadingData, setLoadingData] = useState(false);
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
      setCurCount(result.current_table_count);
      setTableCount(result.table_count);
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
      console.info(error);
    }
  };

  useEffect(() => {
    getJobProgress();
  }, []);

  return (
    <div>
      {loadingData ? (
        <Spinner />
      ) : curCount === -1 ? (
        'Pending'
      ) : (
        <span>{`${curCount}/${tableCount}`}</span>
      )}
    </div>
  );
};

export default GlueJobProgress;
