import { Container, Tabs } from '@cloudscape-design/components';
import AmazonS3 from './charts/AmazonS3';
import { AmazonRDS } from './charts/AmazonRDS';
import { RouterEnum } from 'routers/routerEnum';

const Charts = () => {
  return (
    <Container>
      <div>
        The statistics below are based the result of the latest sensitive
        discovery job. Click <a href={RouterEnum.Datajob.path}>here</a> to see
        job details.
      </div>
      <div className="mt-10">
        <Tabs
          tabs={[
            {
              label: 'Amazon S3',
              id: 's3',
              content: <AmazonS3 />,
            },
            {
              label: 'Amazon RDS',
              id: 'rds',
              content: <AmazonRDS />,
            },
          ]}
        />
      </div>
    </Container>
  );
};

export default Charts;
