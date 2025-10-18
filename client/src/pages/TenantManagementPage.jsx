import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';

function TenantManagementPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [parentTenant, setParentTenant] = useState(null); // ★ 親テナント情報を保持するState
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tenants');
      setTenants(res.data);
    } catch (err) {
      setError(err.response?.data?.message || '組織情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (parent = null) => { // ★ 親テナントを受け取る
    setNewTenantName('');
    setModalError('');
    setParentTenant(parent); // ★ 親テナントをStateにセット
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) {
      setModalError('部署名を入力してください。');
      return;
    }
    setModalError('');
    try {
      await axios.post('/api/tenants', {
        name: newTenantName,
        parentId: parentTenant ? parentTenant._id : null // ★ 親IDをAPIに送信
      });
      loadTenants();
      handleCloseModal();
    } catch (err) {
      setModalError(err.response?.data?.message || '部署の作成に失敗しました。');
    }
  };

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /> <span>組織情報を読み込み中...</span></div>;
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
          <span>組織・部署管理</span>
          <Button variant="primary" onClick={handleOpenModal}>
            ＋ 新規部署を追加
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>組織/部署名</th>
                <th>親組織</th>
                <th style={{ width: '200px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <tr key={tenant._id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.parent ? tenant.parent.name : 'N/A (最上位)'}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleOpenModal(tenant)}
                    >
                      サブ部署を追加
                    </Button>
                    {/* 将来ここに編集・削除ボタンを追加 */}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* 新規部署作成モーダル */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{parentTenant ? `${parentTenant.name} の` : ''}新規部署を追加</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            <Form.Group>
              <Form.Label>新しい部署名</Form.Label>
              <Form.Control
                type="text"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="例: 営業部, 開発チーム"
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>キャンセル</Button>
          <Button variant="primary" onClick={handleCreateTenant}>作成</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TenantManagementPage;