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
  const [error, setError] = useState(''); // エラーメッセージ用のState
  const { register, isAuthenticated } = useAuth();

  const { username, email, password, password2 } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) {
      setError(''); // 入力中はエラーメッセージをクリア
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); // 送信時に一旦エラーをクリア

    if (password !== password2) {
      setError('パスワードが一致しません。');
    } else {
      try {
        await register(username, email, password);
        // 登録成功後、AuthContextがリダイレクトを処理する
      } catch (err) {
        setError(err.response?.data?.message || '登録中に不明なエラーが発生しました。');
      }
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
          {/* エラーメッセージ表示エリア */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
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