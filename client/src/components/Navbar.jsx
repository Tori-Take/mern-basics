import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const authLinks = (
    <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
      {/* 管理者ユーザーの場合のみダッシュボードへのリンクを表示 */}
      {user && user.isAdmin && (
        <li className="nav-item">
          <Link to="/admin/dashboard" className="nav-link">管理者ダッシュボード</Link>
        </li>
      )}
      <li className="nav-item">
        <span className="navbar-text mx-3">
          ようこそ, {user ? user.username : 'ゲスト'}さん
        </span>
      </li>
      <li className="nav-item">
        <button onClick={onLogout} className="btn btn-outline-light">ログアウト</button>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
      <li className="nav-item"><Link to="/register" className="nav-link">新規登録</Link></li>
      <li className="nav-item"><Link to="/login" className="nav-link">ログイン</Link></li>
    </ul>
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">TODO App</Link>
        <div>{isAuthenticated ? authLinks : guestLinks}</div>
      </div>
    </nav>
  );
}

export default Navbar;
