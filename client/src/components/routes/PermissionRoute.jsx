import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Spinner } from 'react-bootstrap';

/**
 * 特定の権限(permission)を持つユーザーのみがアクセスできるルートを保護するコンポーネント。
 * @param {{ permission: string }} props - 必須の権限キー。
 */
function PermissionRoute({ permission }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  // ユーザーが存在し、かつ必要な権限を持っているかチェック
  const hasPermission = user && user.permissions?.includes(permission);

  return hasPermission ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}

export default PermissionRoute;
