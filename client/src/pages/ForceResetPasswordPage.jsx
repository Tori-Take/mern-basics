import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ForceResetPasswordPage() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { logout } = useAuth();

  const { newPassword, confirmPassword } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('パスワードが一致しません。');
    }

    try {
      const res = await axios.post('/api/users/force-reset-password', { newPassword });
      setSuccess(res.data.message);

      // 3秒後に自動的にログアウトし、ログインページへ誘導
      setTimeout(() => {
        logout();
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'パスワードの更新に失敗しました。');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h1 className="text-center mb-4">新しいパスワードを設定</h1>
        <p className="text-center text-muted">セキュリティのため、新しいパスワードを設定してください。</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!success && ( // 成功メッセージが表示されたらフォームを非表示にする
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label htmlFor="newPassword">新しいパスワード</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  className="form-control"
                  value={newPassword}
                  onChange={onChange}
                  required
                  minLength="6"
                />
                <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
                  <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword">新しいパスワード (確認用)</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={onChange}
                required
                minLength="6"
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">パスワードを更新</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForceResetPasswordPage;