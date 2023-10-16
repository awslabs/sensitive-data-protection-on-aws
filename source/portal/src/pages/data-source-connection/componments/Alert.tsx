import React, { useState } from 'react';
import { Alert } from '@cloudscape-design/components';

export function ErrorAlert({ error }:{error:any}) {
  const [visible, setVisible] = useState(true);

  return (
    <Alert
      statusIconAriaLabel="Error"
      type={error.type || 'error'}
      header={error.header}
      dismissible={true}
      visible={visible}
      onDismiss={() => setVisible(false)}
    >
      {error.message}
    </Alert>
  );
}