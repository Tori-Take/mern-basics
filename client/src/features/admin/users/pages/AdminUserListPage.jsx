// c:\Users\Tori-Take\Desktop\mern-basics\client\src\features\admin\users\pages\AdminUserListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Card, Badge, Modal, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv'; // ★ react-csvからCSVLinkをインポート
import Papa from 'papaparse'; // ★ papaparseをインポート
import { useAuth } from '../../../../providers/AuthProvider'; // ★ useAuthをインポート
import './AdminUserListPage.css';

function AdminUserListPage() {
  const { user: currentUser } = useAuth(); // ★ ログインユーザー情報を取得
  const [users, setUsers] = useState([]);
  const [allTenants, setAllTenants] = useState([]); // ★ テナント名表示用に全テナント情報を保持
  const [loadingMessage, setLoadingMessage] = useState('読み込み中...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // --- CSVインポート用 state ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  // ★★★ データ取得ロジックをuseCallbackでラップし、再利用可能にする ★★★
  const fetchUsers = useCallback(async () => {
    setLoadingMessage('ユーザー情報を読み込み中...');
    setLoading(true);
    try {
      const [usersRes, tenantsRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/tenants/all')
      ]);
      setUsers(usersRes.data);
      setAllTenants(tenantsRes.data);
      setError(''); // 成功時にエラーをクリア
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザーの取得に失敗しました。');
    } finally {
      setLoading(false);
      if (location.state?.message) {
        setSuccessMessage(location.state.message);
        // メッセージを表示したら、リロードで再表示されないようにstateをクリア
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ★ CSVエクスポート用のヘッダーを定義
  const csvHeaders = [
    { label: 'ID', key: '_id' },
    { label: 'ユーザー名', key: 'username' },
    { label: 'メールアドレス', key: 'email' },
    { label: 'password', key: 'password' }, // ★ インポート用にパスワード列を追加
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
      password: '', // ★ エクスポート時には常に空文字
      tenantName: allTenants.find(t => t._id === user.tenantId)?.name || 'N/A',
      roles: user.roles.join(', '), // 配列をカンマ区切りの文字列に変換
      status: user.status,
      createdAt: format(new Date(user.createdAt), 'yyyy/MM/dd HH:mm'),
      updatedAt: format(new Date(user.updatedAt), 'yyyy/MM/dd HH:mm'),
    }));
  };

  // --- CSVインポート処理 ---
  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
    setImportResult(null); // 新しいファイルが選択されたら結果をリセット
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportResult({ error: 'ファイルが選択されていません。' });
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    try {
      await new Promise((resolve, reject) => {
        Papa.parse(importFile, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            try {
              const keyMapping = {
                'ID': '_id', 'ユーザー名': 'username', 'メールアドレス': 'email',
                'password': 'password', '所属部署': 'tenantName', '役割': 'roles',
                'ステータス': 'status',
              };
              const mappedData = results.data.map(row =>
                Object.fromEntries(
                  Object.entries(row).map(([key, value]) => [keyMapping[key] || key, value])
                )
              );
              const response = await axios.post('/api/users/bulk-import', { users: mappedData });
              setImportResult(response.data);
              resolve(); // 成功を通知
            } catch (err) {
              reject(err); // APIエラーをPromiseのrejectに渡す
            }
          },
          error: (err) => {
            reject(new Error(`CSVファイルの解析に失敗しました: ${err.message}`));
          },
        });
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'インポート処理中にエラーが発生しました。';
      setImportResult({ error: errorMessage });
    } finally {
      setIsImporting(false);
    }
  };

  // インポートモーダルを閉じる処理
  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
    // ★ インポートが1件でも成功していたら、モーダルを閉じたときに一覧を再読み込み
    if (importResult && importResult.successCount > 0) {
      fetchUsers();
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h1" className="d-flex justify-content-between align-items-center">
        <span>ユーザー管理</span>
        <div>
          {(currentUser?.roles.includes('superuser') || currentUser?.roles.includes('tenant-superuser')) && (
            <Button variant="outline-primary" onClick={() => setShowImportModal(true)} className="me-2">
              <i className="bi bi-upload me-2"></i>CSVインポート
            </Button>
          )}
          <CSVLink data={getCsvData()} headers={csvHeaders} filename={`users-export-${new Date().toISOString().slice(0, 10)}.csv`} className="btn btn-outline-success">
            <i className="bi bi-file-earmark-spreadsheet-fill me-2"></i>CSVエクスポート
          </CSVLink>
          <Link to="/admin/users/new" className="btn btn-primary ms-3">
            ＋ 新規ユーザー作成
          </Link>
        </div>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" /> <span>{loadingMessage}</span>
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

      {/* CSVインポートモーダル */}
      <Modal show={showImportModal} onHide={handleCloseImportModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>ユーザー一括登録・更新 (CSV)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* --- 結果表示エリア --- */}
          {importResult && !isImporting && (
            <Alert variant={importResult.errorCount > 0 ? 'warning' : 'success'}>
              <Alert.Heading>インポート結果</Alert.Heading>
              <p>
                成功: {importResult.successCount}件, 失敗: {importResult.errorCount}件
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <>
                  <hr />
                  <p className="mb-0"><strong>エラー詳細:</strong></p>
                  <ul>
                    {importResult.errors.map((err, index) => (
                      <li key={index}><strong>{err.row}行目:</strong> {err.messages.join(', ')}</li>
                    ))}
                  </ul>
                </>
              )}
            </Alert>
          )}

          <p>エクスポートしたCSVファイルを元に編集し、アップロードしてください。</p>
          <ul>
            <li><code>_id</code>が空の行は<strong>新規登録</strong>されます。<strong>password</strong>列の指定が必須です。</li>
            <li><code>_id</code>がある行は<strong>更新</strong>されます。password列は空でも構いません（空の場合は変更されません）。</li>
          </ul>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>CSVファイルを選択</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={handleFileChange} disabled={isImporting} />
          </Form.Group>
          {isImporting && (
            <div className="text-center">
              <Spinner animation="border" />
              <p>インポート処理中...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseImportModal} disabled={isImporting}>
            閉じる
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={!importFile || isImporting}>
            {isImporting ? '処理中...' : 'インポート実行'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Card>
  );
}

export default AdminUserListPage;
