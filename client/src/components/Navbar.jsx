import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
      {user && user.roles && user.roles.includes('admin') && (
        <Link to="/admin/dashboard" className="nav-link text-white me-3">管理者ダッシュボード</Link>
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
