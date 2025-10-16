import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // --- デバッグ用ログ ---
  // AdminRouteがアクセスをチェックするたびに、現在の認証状態とユーザー情報をコンソールに出力します。
  console.log('【AdminRoute】アクセスチェック:', { isAuthenticated, isLoading, user });

  // ユーザー情報の読み込み中は、何も表示しない（またはスピナーを表示）
  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  // ログインしておらず、ユーザー情報もない場合はログインページへリダイレクト
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  // ユーザー情報はあるが、roles配列に 'admin' が含まれていない場合は、
  // 一般ユーザーのダッシュボードへリダイレクト
  if (!user.roles || !user.roles.includes('admin')) {
    console.log('【AdminRoute】管理者権限がないためリダイレクトします。');
    return <Navigate to="/" />;
  }

  // すべてのチェックをパスした場合、要求されたページ（children）を表示
  return children;
}

export default AdminRoute;
