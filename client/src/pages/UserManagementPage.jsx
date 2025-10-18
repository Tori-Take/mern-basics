import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Card } from 'react-bootstrap';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザー情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

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
          <Link to="/admin/users/new" className="btn btn-primary">
            ＋ 新規ユーザーを追加
          </Link>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ユーザー名</th>
              <th>メールアドレス</th>
              <th>役割</th>
              <th>ステータス</th>
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
                <td>
                  <Link to={`/admin/users/${user._id}`} className="btn btn-outline-primary btn-sm me-2">
                    編集
                  </Link>                  
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>    
  );
}

export default UserManagementPage;