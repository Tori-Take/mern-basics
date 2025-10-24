import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Spinner } from 'react-bootstrap';

const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 認証情報の読み込み中はスピナーを表示
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  // 認証済みで、かつユーザー情報が存在し、'admin'ロールを持っているかチェック
  const isAdmin = isAuthenticated && user && user.roles.includes('admin');

  // 権限があれば子ルートのコンポーネントを表示し、なければログインページにリダイレクト
  return isAdmin ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default AdminRoute;
