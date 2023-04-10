import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import './style.scss';
import { useEffect } from 'react';

const NoAccess = () => {
  const jumpToIndex = () => {
    window.location.replace(window.location.origin);
    return;
  };
  useEffect(() => {
    waitJumpToIndex();
  }, []);

  const waitJumpToIndex = () => {
    setTimeout(() => {
      jumpToIndex();
    }, 5000);
  };
  return (
    <div className="no-access">
      <Container header={<Header variant="h2">Your login has expired</Header>}>
        Your login has expired, the system will jump to the login page after 5s,
        or click{' '}
        <span onClick={jumpToIndex} className="no-access-link">
          here
        </span>{' '}
        to jump.
      </Container>
    </div>
  );
};

export default NoAccess;
