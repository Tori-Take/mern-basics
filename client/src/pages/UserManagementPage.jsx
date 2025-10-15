import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'ユーザー情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>ユーザー情報を読み込み中...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center my-4">
        <h1 className="m-0">ユーザー管理</h1>
        <Link to="/admin/users/new" className="btn btn-success">
          <i className="bi bi-plus-circle-fill me-2"></i>
          新規ユーザー追加
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>ユーザー名</th>
              <th>メールアドレス</th>
              <th>ステータス</th>
              <th>管理者</th>
              <th>登録日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.status}</td>
                <td>{user.isAdmin ? 'はい' : 'いいえ'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</td>
                <td>
                  <Link to={`/admin/users/${user._id}`} className="btn btn-sm btn-info">
                    <i className="bi bi-pencil-square"></i> 編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagementPage;