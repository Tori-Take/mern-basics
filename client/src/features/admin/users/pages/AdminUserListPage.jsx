// c:\Users\Tori-Take\Desktop\mern-basics\client\src\features\admin\users\pages\AdminUserListPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv'; // ★ react-csvからCSVLinkをインポート
import './AdminUserListPage.css';

function AdminUserListPage() {
  const [users, setUsers] = useState([]);
  const [allTenants, setAllTenants] = useState([]); // ★ テナント名表示用に全テナント情報を保持
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // ★ ユーザー一覧とテナント一覧を並行して取得
        const [usersRes, tenantsRes] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/tenants/all') // 全テナントを取得するAPIエンドポイント
        ]);
        setUsers(usersRes.data);
        setAllTenants(tenantsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'ユーザーの取得に失敗しました。');
      } finally {
        setLoading(false);
        // ページ遷移してきたメッセージは一度表示したら消す
        if (location.state?.message) {
          setSuccessMessage(location.state.message);
        }
      }
    };
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // ★ CSVエクスポート用のヘッダーを定義
  const csvHeaders = [
    { label: 'ID', key: '_id' },
    { label: 'ユーザー名', key: 'username' },
    { label: 'メールアドレス', key: 'email' },
    { label: '所属部署', key: 'tenantName' },
    { label: '役割', key: 'roles' },
    { label: 'ステータス', key: 'status' },
    { label: '作成日時', key: 'createdAt' },
    { label: '最終更新日時', key: 'updatedAt' },
  ];

  // ★ CSVエクスポート用のデータを作成・整形する
  const getCsvData = () => {
    return users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      tenantName: allTenants.find(t => t._id === user.tenantId)?.name || 'N/A',
      roles: user.roles.join(', '), // 配列をカンマ区切りの文字列に変換
      status: user.status,
      createdAt: format(new Date(user.createdAt), 'yyyy/MM/dd HH:mm'),
      updatedAt: format(new Date(user.updatedAt), 'yyyy/MM/dd HH:mm'),
    }));
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h1" className="d-flex justify-content-between align-items-center">
        <span>ユーザー管理</span>
        <div>
          <CSVLink data={getCsvData()} headers={csvHeaders} filename={`users-export-${new Date().toISOString().slice(0, 10)}.csv`} className="btn btn-outline-success me-2">
            <i className="bi bi-file-earmark-spreadsheet-fill me-2"></i>CSVエクスポート
          </CSVLink>
          <Link to="/admin/users/new" className="btn btn-primary ms-2">
            ＋ 新規ユーザー作成
          </Link>
        </div>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" /> <span>読み込み中...</span>
          </div>
        ) : (
          <Table striped bordered hover responsive="md" className="user-list-table">
            <thead>
              <tr>
                <th>ユーザー名</th>
                <th>所属部署</th>
                <th>メールアドレス</th>
                <th>役割</th>
                <th>ステータス</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td><Link to={`/admin/users/${user._id}`}>{user.username}</Link></td>
                  <td>{allTenants.find(t => t._id === user.tenantId)?.name || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.roles.map(role => (
                      <Badge key={role} bg="info" className="me-1">{role}</Badge>
                    ))}
                  </td>
                  <td>
                    <Badge bg={user.status === 'active' ? 'success' : 'secondary'}>
                      {user.status === 'active' ? '有効' : '無効'}
                    </Badge>
                  </td>
                  <td>
                    <Link to={`/admin/users/${user._id}`} className="btn btn-outline-primary btn-sm">
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
