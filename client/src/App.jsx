import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // BootstrapのCSSをインポート
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { Spinner } from 'react-bootstrap';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import UserDashboardPage from './features/dashboard/pages/UserDashboardPage';
import TodoPage from './features/todos/pages/TodoPage'; // 新しくインポート
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import ForceResetPasswordPage from './features/auth/pages/ForceResetPasswordPage';
import UserCreatePage from './features/admin/users/pages/UserCreatePage';
import RoleManagementPage from './features/admin/roles/pages/RoleManagementPage'; 
import TenantManagementPage from './features/admin/tenants/pages/TenantManagementPage';
import TenantDetailPage from './features/admin/tenants/pages/TenantDetailPage';
import AdminUserListPage from './features/admin/users/pages/AdminUserListPage'; // ★ 新しくインポート
import AdminUserEditPage from './features/admin/users/pages/AdminUserEditPage'; // ★ 新しくインポート
import ProfilePage from './features/profile/pages/ProfilePage'; // ★ 新しく追加
import AdminRoute from './features/auth/AdminRoute.jsx'; // ★ パスを修正
import SuperuserRoute from './features/auth/SuperuserRoute'; // ★ 新しく追加
import SystemDashboardPage from './features/system/pages/SystemDashboardPage'; // ★ 新しく追加
import SystemTenantManagementPage from './features/system/pages/SystemTenantManagementPage'; // ★ 新しく追加
import SystemOrganizationDetailPage from './features/system/pages/SystemOrganizationDetailPage'; // ★ 新しく追加
import TenantTreeViewPage from './features/admin/tenants/pages/TenantTreeViewPage'; // ★ 新しく追加

import HiyariPage from './features/hiyari/pages/HiyariPage'; // ★ Hiyari-Naviページをインポート
import PermissionRoute from './components/routes/PermissionRoute'; // ★ 新しくインポート
// AppContentコンポーネントを新しく定義
function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container pt-4">
        <Routes>
          {/* === Public Routes === */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<h1>アクセス権がありません</h1>} /> {/* ★ 権限なしページを追加 */}

          {/* === Private Routes (for all logged-in users) === */}
          <Route path="/" element={<PrivateRoute />}>
            <Route path="/" element={<UserDashboardPage />} />
            <Route path="/force-reset-password" element={<ForceResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} /> {/* ★ 新しく追加 */}
            {/* ▼▼▼ ここからがPermissionRouteによる保護 ▼▼▼ */}
            <Route element={<PermissionRoute permission="CAN_USE_TODO" />}>
              <Route path="/todos" element={<TodoPage />} />
            </Route>
            {/* ▼▼▼ Hiyari-Naviのルートを追加 ▼▼▼ */}
            <Route element={<PermissionRoute permission="CAN_USE_HIYARI" />}>
              <Route path="/hiyari" element={<HiyariPage />} />
            </Route>
          </Route>

          {/* === Admin Routes (for admin users only) === */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUserListPage />} />
            <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
            <Route path="/admin/users/new" element={<UserCreatePage />} />
            <Route path="/admin/roles" element={<RoleManagementPage />} />
            {/* ★★★ 修正: 具体的なパスを先に定義する ★★★ */}
            <Route path="/admin/tenants/tree" element={<TenantTreeViewPage />} />
            <Route path="/admin/tenants" element={<TenantManagementPage />} />
            <Route path="/admin/tenants/:id" element={<TenantDetailPage />} />
          </Route>

          {/* === Superuser Routes (for superuser only) === */}
          <Route element={<SuperuserRoute />}>
            <Route path="/system/dashboard" element={<SystemDashboardPage />} />
            <Route path="/system/tenants" element={<SystemTenantManagementPage />} />
            <Route path="/system/tenants/:id/departments" element={<SystemOrganizationDetailPage />} />
            <Route path="/system/tenants/:id/tree" element={<TenantTreeViewPage />} />
          </Route>

        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
