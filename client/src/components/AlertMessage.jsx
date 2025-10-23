import React from 'react';
import { Alert } from 'react-bootstrap';

const AlertMessage = ({ variant = 'info', children }) => {
  // variant propに応じて色が変わるBootstrapのAlertコンポーネントをラップします。
  return <Alert variant={variant}>{children}</Alert>;
};

export default AlertMessage;