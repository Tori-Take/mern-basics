import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Navbar as BootstrapNavbar, Nav, NavDropdown } from 'react-bootstrap';
import NotificationCenter from './NotificationCenter'; // ★ 1. 新しくインポート

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" sticky="top">
      <div className="container-fluid"> {/* ★ 全幅を使うために container-fluid に変更 */}
        <BootstrapNavbar.Brand as={Link} to="/">ToriTake App</BootstrapNavbar.Brand>

        {/* ★★★ 通知センターをハンバーガーメニューの外に移動 ★★★ */}
        {isAuthenticated && (
          <Nav className="ms-auto d-lg-none"> {/* スマホ画面でのみ表示 (d-lg-none) */}
            <div className="d-flex align-items-center">
              <div className="d-flex align-items-center me-2">
                <NotificationCenter />
              </div>
            </div>
          </Nav>
        )}

        <BootstrapNavbar.Toggle aria-controls="responsive-navbar-nav" />
        <BootstrapNavbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            {/* ログイン中ユーザー共通のリンク */}
            {isAuthenticated && <Nav.Link as={Link} to="/">アプリポータル</Nav.Link>}
            {/* TODO: 将来的には権限で表示を制御 */}
            {isAuthenticated && <Nav.Link as={Link} to="/hiyari">Hiyari-Navi</Nav.Link>}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                {/* ★★★ PC画面用の通知センター (d-none d-lg-flex) ★★★ */}
                <div className="d-none d-lg-flex align-items-center me-2">
                  <NotificationCenter />
                </div>

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
      </div>
    </BootstrapNavbar>
  );
}

export default Navbar;
