import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // BootstrapのCSSをインポート
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { Spinner } from 'react-bootstrap';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute.jsx';
import UserDashboardPage from './features/dashboard/pages/UserDashboardPage';
import TodoPage from './features/todos/pages/TodoPage'; // 新しくインポート
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import UserManagementPage from './features/admin/users/pages/UserManagementPage';
import ForceResetPasswordPage from './features/auth/pages/ForceResetPasswordPage';
import UserCreatePage from './features/admin/users/pages/UserCreatePage';
import RoleManagementPage from './features/admin/roles/pages/RoleManagementPage'; 
import UserEditPage from './features/admin/users/pages/UserEditPage';
import TenantManagementPage from './features/admin/tenants/pages/TenantManagementPage';
import TenantDetailPage from './features/admin/tenants/pages/TenantDetailPage';
import ProfilePage from './features/profile/pages/ProfilePage'; // ★ 新しく追加

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
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          {/* === Public Routes === */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* === Private Routes (for all logged-in users) === */}
          <Route path="/" element={<PrivateRoute />}>
            <Route path="/" element={<UserDashboardPage />} />
            <Route path="/force-reset-password" element={<ForceResetPasswordPage />} />
            <Route path="/todos" element={<TodoPage />} />
            <Route path="/profile" element={<ProfilePage />} /> {/* ★ 新しく追加 */}
          </Route>

          {/* === Admin Routes (for admin users only) === */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute><AdminDashboardPage /></AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute><UserManagementPage /></AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <AdminRoute><UserEditPage /></AdminRoute>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <AdminRoute><UserCreatePage /></AdminRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <AdminRoute><RoleManagementPage /></AdminRoute>

            } 
          />
          <Route
            path="/admin/tenants"
            element={
              <AdminRoute><TenantManagementPage /></AdminRoute>
            }
          />
          <Route
            path="/admin/tenants/:id"
            element={
              <AdminRoute><TenantDetailPage /></AdminRoute> // ★ 新しく追加
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
