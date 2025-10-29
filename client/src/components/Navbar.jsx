import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Navbar as BootstrapNavbar, Nav, NavDropdown } from 'react-bootstrap';

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" sticky="top">
      <BootstrapNavbar.Brand as={Link} to="/">TODO App</BootstrapNavbar.Brand>
      <BootstrapNavbar.Toggle aria-controls="responsive-navbar-nav" />
      <BootstrapNavbar.Collapse id="responsive-navbar-nav">
        <Nav className="me-auto">
          {/* ログイン中ユーザー共通のリンク */}
          {isAuthenticated && <Nav.Link as={Link} to="/">ポータル</Nav.Link>}
          {isAuthenticated && <Nav.Link as={Link} to="/todos">Todos</Nav.Link>}
        </Nav>
        <Nav>
          {isAuthenticated ? (
            <>
              {/* Superuserの場合: 管理機能をドロップダウンにまとめる */}
              {user?.roles?.includes('superuser') && (
                <NavDropdown title={<><i className="bi bi-gear-wide-connected"></i> 管理メニュー</>} id="admin-menu-dropdown" align="end">
                  <NavDropdown.Item as={Link} to="/system/dashboard" className="fw-bold">システム管理者ポータル</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/dashboard">管理者ポータル</NavDropdown.Item>
                </NavDropdown>
              )}
              {/* SuperuserではないAdminの場合 */}
              {user?.roles?.includes('admin') && !user?.roles?.includes('superuser') && (
                <Nav.Link as={Link} to="/admin/dashboard">管理者ポータル</Nav.Link>
              )}
              {/* ユーザーメニュー */}
              <NavDropdown title={<><i className="bi bi-person-circle"></i> {user?.username || 'ゲスト'}</>} id="user-menu-dropdown" align="end">
                <NavDropdown.Item as={Link} to="/profile"><i className="bi bi-person-vcard me-2"></i>プロフィール</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger"><i className="bi bi-box-arrow-right me-2"></i>ログアウト</NavDropdown.Item>
              </NavDropdown>
            </>
          ) : (
            <>
              <Nav.Link as={Link} to="/register">新規登録</Nav.Link>
              <Nav.Link as={Link} to="/login">ログイン</Nav.Link>
            </>
          )}
        </Nav>
      </BootstrapNavbar.Collapse>
    </BootstrapNavbar>
  );
}

export default Navbar;
