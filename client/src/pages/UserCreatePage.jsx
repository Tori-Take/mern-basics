import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function UserCreatePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isActive: true,
    roles: ['user'], // デフォルトで 'user' ロールをセット
  });
  const [allRoles, setAllRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false); // パスワード表示/非表示用のState
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ページロード時に利用可能な全ロールを取得
    const fetchRoles = async () => {
      try {
        const res = await axios.get('/api/roles');
        setAllRoles(res.data);
      } catch (err) {
        setError('ロールの取得に失敗しました。');
      }
    };
    fetchRoles();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newRoles = checked
        ? [...prev.roles, value]
        : prev.roles.filter(role => role !== value);
      return { ...prev, roles: newRoles };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      // POSTエンドポイントを使用して新しいユーザーを作成
      await axios.post('/api/users', formData);
      setSuccess('新しいユーザーが正常に作成されました。');
      // 2秒後にユーザー一覧にリダイレクト
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザーの作成に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <h1 className="text-center my-4">新規ユーザー追加</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">ユーザー名</label>
            <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={onChange} required />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">メールアドレス</label>
            <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={onChange} required />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">初期パスワード</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="password"
                name="password"
                value={formData.password}
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
            <label className="form-label">役割 (ロール)</label>
            <div>
              {allRoles.map(role => (
                <div className="form-check form-check-inline" key={role._id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`role-create-${role.name}`}
                    value={role.name}
                    checked={formData.roles.includes(role.name)}
                    onChange={handleRoleChange}
                    disabled={role.name === 'user'}
                  />
                  <label className="form-check-label" htmlFor={`role-create-${role.name}`}>{role.name}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={onChange}
            />
            <label className="form-check-label" htmlFor="isActive">アカウントを有効にする</label>
          </div>

          <div className="d-flex justify-content-between">
            <Link to="/admin/users" className="btn btn-secondary">一覧に戻る</Link>
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserCreatePage;