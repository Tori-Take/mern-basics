import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Card } from 'react-bootstrap';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
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

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" /> <span>ユーザー情報を読み込み中...</span>
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
        <span>ユーザー管理</span>
        <Button as={Link} to="/admin/users/new" variant="primary">
          ＋ 新規ユーザー追加
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ユーザー名</th>
              <th>メールアドレス</th>
              <th>役割 (ロール)</th>
              <th>ステータス</th>
              <th>登録日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.roles.join(', ')}</td>
                <td>
                  <span className={`badge bg-${user.status === 'active' ? 'success' : 'secondary'}`}>
                    {user.status}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <Button
                    as={Link}
                    to={`/admin/users/${user._id}`}
                    variant="outline-secondary"
                    size="sm"
                  >
                    編集
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {users.length === 0 && !error && (
          <div className="text-center text-muted mt-3">
            この組織にはまだ他のユーザーがいません。
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default UserManagementPage;