import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // BootstrapのCSSをインポート
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from 'react-bootstrap';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute.jsx';
import UserDashboardPage from './pages/UserDashboardPage'; // HomePageから変更
import TodoPage from './pages/TodoPage'; // 新しくインポート
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ForceResetPasswordPage from './pages/ForceResetPasswordPage';
import UserCreatePage from './pages/UserCreatePage';
import RoleManagementPage from './pages/RoleManagementPage'; 
import UserEditPage from './pages/UserEditPage';
import TenantManagementPage from './pages/TenantManagementPage'; // ★ 新しく追加

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
