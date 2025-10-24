import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Dropdown } from 'react-bootstrap';

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const authLinks = (
    <div className="d-flex align-items-center">
      {/* Superuserの場合: 管理機能をドロップダウンにまとめる */}
      {user && user.roles && user.roles.includes('superuser') && (
        <Dropdown align="end" className="me-3">
          <Dropdown.Toggle variant="outline-warning" id="dropdown-admin-menu">
            <i className="bi bi-gear-wide-connected me-1"></i>管理メニュー
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} to="/system/dashboard" className="fw-bold">システム管理 (全テナント)</Dropdown.Item>
            <Dropdown.Item as={Link} to="/admin/dashboard">ユーザー管理 (自テナント)</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      )}
      {/* SuperuserではないAdminの場合: 管理者ダッシュボードへの直接リンクを表示 */}
      {user && user.roles && user.roles.includes('admin') && !user.roles.includes('superuser') && (
        <Link to="/admin/dashboard" className="nav-link text-white me-3">ユーザー管理</Link>
      )}
      <Dropdown align="end">
        <Dropdown.Toggle variant="primary" id="dropdown-user">
          <i className="bi bi-person-circle me-1"></i>
          {user ? user.username : 'ゲスト'}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item as={Link} to="/profile">
            <i className="bi bi-person-vcard me-2"></i>プロフィール
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={onLogout} className="text-danger">
            <i className="bi bi-box-arrow-right me-2"></i>ログアウト
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
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
