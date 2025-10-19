import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // 認証状態を確認中はローディング表示などを行う
    return <div>Loading...</div>;
  }

  // 認証されていれば子コンポーネント（この場合はHomePage）を表示
  // されていなければログインページにリダイレクト
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
