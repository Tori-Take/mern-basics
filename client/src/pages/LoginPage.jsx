import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const { login, isAuthenticated } = useAuth();

  const { username, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  // 既にログインしている場合はホームページにリダイレクト
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h1 className="text-center mb-4">ログイン</h1>
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="username">ユーザー名</label>
            <input type="text" id="username" className="form-control" name="username" value={username} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="password">パスワード</label>
            <input type="password" id="password" className="form-control" name="password" value={password} onChange={onChange} required />
          </div>
          <button type="submit" className="btn btn-primary w-100">ログイン</button>
        </form>
        <p className="mt-3 text-center">
          アカウントをお持ちでないですか？ <Link to="/register">新規登録</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;