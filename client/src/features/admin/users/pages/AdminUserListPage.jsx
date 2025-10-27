// c:\Users\Tori-Take\Desktop\mern-basics\client\src\features\admin\users\pages\AdminUserListPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Card } from 'react-bootstrap';

function AdminUserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setUsers(res.data);
      } catch (err) {
        setError('ユーザーの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    // ユーザー削除など、他のページから渡された成功メッセージがあれば表示する
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }

    fetchUsers();
  }, []); // 空の依存配列で、マウント時に一度だけ実行
  }, [location.state]);

  return (
    <div>
      <h1>ユーザー管理</h1>

      {loading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px' }}>ユーザー名</th>
              <th style={{ padding: '8px' }}>メールアドレス</th>
              <th style={{ padding: '8px' }}>役割</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={{ padding: '8px' }}>
                  <Link to={`/admin/users/${user._id}`}>{user.username}</Link>
                </td>
                <td style={{ padding: '8px' }}>{user.email}</td>
                <td style={{ padding: '8px' }}>{user.roles.join(', ')}</td>
    <Card className="shadow-sm">
      <Card.Header as="h1" className="d-flex justify-content-between align-items-center">
        <span>ユーザー管理</span>
        <Link to="/admin/users/new" className="btn btn-primary">
          ＋ 新規ユーザーを追加
        </Link>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" /> <span>読み込み中...</span>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ユーザー名</th>
                <th>メールアドレス</th>
                <th>役割</th>
                <th>ステータス</th>
                <th>操作</th>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td><Link to={`/admin/users/${user._id}`}>{user.username}</Link></td>
                  <td>{user.email}</td>
                  <td>{user.roles.join(', ')}</td>
                  <td>
                    <span className={`badge bg-${user.status === 'active' ? 'success' : 'secondary'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/users/${user._id}`} className="btn btn-outline-primary btn-sm me-2">
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}

export default AdminUserListPage;
