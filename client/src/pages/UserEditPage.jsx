import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function UserEditPage() {
  // 1. URLからユーザーIDを取得
  const { id } = useParams();
  const navigate = useNavigate();

  // 2. フォームデータ、ローディング、メッセージ用のState
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    status: 'active',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 3. 初回レンダリング時にユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/api/users/${id}`);
        const { username, email, status, isAdmin } = res.data;
        setFormData({ username, email, status, isAdmin });
      } catch (err) {
        setError(err.response?.data?.message || 'ユーザー情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]); // idが変わった場合（通常はないが）に再取得

  // 4. フォームの入力値をハンドリング
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 5. フォーム送信（保存）時の処理
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.put(`/api/users/${id}`, formData);
      setSuccess('ユーザー情報が正常に更新されました。');
      // 2秒後に一覧ページに戻る
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || '更新に失敗しました。');
    }
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div>
      <h1 className="text-center my-4">ユーザー情報編集</h1>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card">
            <div className="card-header">
              ユーザー: <strong>{formData.username}</strong>
            </div>
            <div className="card-body">
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">ユーザー名</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">メールアドレス</label>
                  <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={onChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">アカウント状態</label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={onChange}
                  >
                    <option value="active">有効 (active)</option>
                    <option value="inactive">無効 (inactive)</option>
                    <option value="suspended">一時停止 (suspended)</option>
                  </select>
                </div>

                <div className="mb-4 form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isAdmin"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={onChange}
                  />
                  <label className="form-check-label" htmlFor="isAdmin">管理者権限</label>
                </div>

                <div className="d-flex justify-content-between">
                  <Link to="/admin/users" className="btn btn-secondary">一覧に戻る</Link>
                  <button type="submit" className="btn btn-primary">保存する</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserEditPage;