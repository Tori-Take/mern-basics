import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const { register, isAuthenticated } = useAuth();

  const { username, email, password, password2 } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      alert('パスワードが一致しません。');
    } else {
      await register(username, email, password);
    }
  };

  // 既にログインしている場合はホームページにリダイレクト
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h1 className="text-center mb-4">新規登録</h1>
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="username">ユーザー名</label>
            <input type="text" id="username" className="form-control" name="username" value={username} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="email">メールアドレス</label>
            <input type="email" id="email" className="form-control" name="email" value={email} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="password">パスワード</label>
            <input type="password" id="password" className="form-control" name="password" value={password} onChange={onChange} required minLength="6" />
          </div>
          <div className="mb-3">
            <label htmlFor="password2">パスワード (確認用)</label>
            <input type="password" id="password2" className="form-control" name="password2" value={password2} onChange={onChange} required minLength="6" />
          </div>
          <button type="submit" className="btn btn-primary w-100">登録</button>
        </form>
        <p className="mt-3 text-center">
          すでにアカウントをお持ちですか？ <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;