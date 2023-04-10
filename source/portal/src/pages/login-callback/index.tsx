import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { Spinner } from '@cloudscape-design/components';
import './style.scss';

const LoginCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    loadingAndJumpHome();
  }, []);

  const loadingAndJumpHome = () => {
    setTimeout(() => {
      navigate(RouterEnum.Home.path);
    }, 1000);
  };
  return (
    <div className="callback-background">
      <Spinner />
    </div>
  );
};
export default LoginCallback;
