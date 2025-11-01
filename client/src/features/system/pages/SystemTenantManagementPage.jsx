import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { systemApiService } from '../systemApiService';
import { Table, Button, Spinner, Alert, Card, Breadcrumb, Modal, Form } from 'react-bootstrap';
import axios from 'axios'; // ★ API呼び出し用にインポート

const SystemTenantManagementPage = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // ★ モーダル用のstateを追加
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = await systemApiService.getAllTenants();
      setTenants(data);
    } catch (err) {
      setError(err.response?.data?.message || '組織一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // ★ 新規組織作成の処理
  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) {
      setModalError('組織名を入力してください。');
      return;
    }
    setIsCreating(true);
    setModalError('');
    try {
      // parentIdを指定せずにPOSTリクエストを送る
      await axios.post('/api/tenants', { name: newTenantName });
      setSuccess(`新しい組織「${newTenantName}」が作成されました。`);
      setShowCreateModal(false);
      setNewTenantName('');
      await fetchTenants(); // リストを再読み込み
    } catch (err) {
      setModalError(err.response?.data?.message || '組織の作成に失敗しました。');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/system/dashboard" }}>システム管理</Breadcrumb.Item>
        <Breadcrumb.Item active>組織管理</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
          <span><i className="bi bi-diagram-3 me-2"></i>組織管理</span>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>新規組織作成
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {loading && !tenants.length ? (
            <div className="text-center py-5">
              <Spinner animation="border" /> <span>組織情報を読み込み中...</span>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>組織名</th>
                  <th className="text-center">総所属人数</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>{tenant.name}</td>
                    <td className="text-center">{tenant.userCount}</td>
                    <td className="text-center">
                      {/* ★ 編集ボタンに変更 */}
                      <Button as={Link} to={`/system/tenants/${tenant._id}/departments`} variant="outline-primary" size="sm">
                        <i className="bi bi-pencil-square me-1"></i>編集
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* ★★★ 新規組織作成モーダル ★★★ */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>新規組織作成</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form.Group>
            <Form.Label>新しい組織名</Form.Label>
            <Form.Control
              type="text"
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              placeholder="例: 株式会社B"
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isCreating}>キャンセル</Button>
          <Button variant="primary" onClick={handleCreateTenant} disabled={isCreating}>
            {isCreating ? <><Spinner as="span" size="sm" /> 作成中...</> : '作成'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SystemTenantManagementPage;
