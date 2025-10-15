import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute.jsx';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import UserCreatePage from './pages/UserCreatePage';
import UserEditPage from './pages/UserEditPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container mt-4">
          <Routes>
            {/* === Public Routes === */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* === Private Routes (for all logged-in users) === */}
            <Route path="/" element={<PrivateRoute />}>
              <Route path="/" element={<HomePage />} />
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
