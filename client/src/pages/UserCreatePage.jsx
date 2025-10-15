import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function UserCreatePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    status: 'active',
    isAdmin: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false); // パスワード表示/非表示用のState

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // POSTエンドポイントを使用して新しいユーザーを作成
      await axios.post('/api/users', formData);
      setSuccess('新しいユーザーが正常に作成されました。');
      // 2秒後にユーザー一覧にリダイレクト
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザーの作成に失敗しました。');
    }
  };

  return (
    <div>
      <h1 className="text-center my-4">新規ユーザー追加</h1>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card">
            <div className="card-header">
              <strong>新規ユーザー情報</strong>
            </div>
            <div className="card-body">
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">ユーザー名</label>
                  <input type="text" className="form-control" id="username" name="username" value={formData.username} onChange={onChange} required />
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
                      {/* showPasswordの状態に応じてアイコンを切り替え */}
                      <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                    </button>
                  </div>
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
                  <button type="submit" className="btn btn-success">作成する</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserCreatePage;

// ```

// ### 解説

// *   **State管理:** `formData` stateを、`username`、`email`、`password`は空文字列で、`status`と`isAdmin`はデフォルト値で初期化します。編集ページと違い、初期データを取得する必要がないため、よりシンプルです。
// *   **パスワード欄:** 新規ユーザーの初期パスワードを設定するための `<input type="password">` が重要な追加点です。
// *   **API呼び出し:** `onSubmit` 関数は、バックエンドで作成した新規ユーザー作成用のエンドポイントである `axios.post('/api/users', formData)` を呼び出します。
// *   **ユーザー体験:** 作成に成功すると、成功メッセージが表示され、少し時間をおいてから自動的にユーザー一覧ページに戻ります。これにより、管理者に明確なフィードバックとスムーズな操作の流れを提供します。

// これでフォームページの準備ができました。最後のステップとして、`/admin/users/new` にアクセスした際にこの新しいページが正しく表示されるように、アプリケーションのルーティングを更新します。

// 準備ができましたら、最後のステップに進みましょう！

// <!--
// [PROMPT_SUGGESTION]最後のステップに進み、`App.jsx`のルーティングを更新してください。[/PROMPT_SUGGESTION]
// [PROMPT_SUGGESTION]新規ユーザー作成時に、ランダムなパスワードを自動生成する機能を追加するにはどうすればいいですか？[/PROMPT_SUGGESTION]
// -->