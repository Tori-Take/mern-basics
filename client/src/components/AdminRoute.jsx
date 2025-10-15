import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // ユーザー情報の読み込み中は、何も表示しないかローディング表示を出す
  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  // 認証済み かつ ユーザー情報が存在し かつ 管理者権限がある場合
  if (isAuthenticated && user && user.isAdmin) {
    // 子コンポーネント（管理者ダッシュボードなど）を表示
    return children;
  }

  // 条件を満たさない場合はホームページにリダイレクト
  return <Navigate to="/" />;
}

export default AdminRoute;