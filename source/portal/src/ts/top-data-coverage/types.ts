type LabelValue = {
  label: string | null;
  value: string | number;
  total?: string | number;
};
export interface TopDataCoverageProps {
  header?: string | null;
  description?: React.ReactNode | null;
  isRowMore?: boolean;
  col?: number;
  dataList: LabelValue[];
}
