import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Spinner } from 'react-bootstrap';

/**
 * Superuser専用のルートを保護するコンポーネント。
 * ログインしており、かつ'superuser'ロールを持つユーザーのみがアクセスできます。
 */
const SuperuserRoute = () => {
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

  // 認証済みで、かつユーザー情報が存在し、'superuser'ロールを持っているかチェック
  const isSuperuser = isAuthenticated && user && user.roles.includes('superuser');

  // 権限があれば子ルートのコンポーネントを表示し、なければログインページにリダイレクト
  return isSuperuser ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default SuperuserRoute;
