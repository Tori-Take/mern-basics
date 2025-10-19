import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import { useAuth } from '../../../../providers/AuthProvider';

// フロントエンド側でも保護するロールを定義
const PROTECTED_ROLES = ['user', 'admin'];

function RoleManagementPage() {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false); // モーダルの表示状態
  const [editingRole, setEditingRole] = useState(null); // 編集中のロール情報 or null (新規作成時)
  const [modalData, setModalData] = useState({ name: '', description: '' }); // モーダル内のフォームデータ
  const [modalError, setModalError] = useState(''); // モーダル内のエラー

  useEffect(() => {
    if (currentUser) {
      loadRoles();
    }
  }, [currentUser]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/roles');
      setRoles(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'ロールの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // --- モーダル操作 ---
  const handleOpenModal = (role = null) => {
    setEditingRole(role);
    setModalData(role ? { name: role.name, description: role.description } : { name: '', description: '' });
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
  };

  const handleModalFormChange = (e) => {
    setModalData({ ...modalData, [e.target.name]: e.target.value });
  };

  // --- CRUD操作 ---
  const handleSave = async () => {
    setModalError('');
    try {
      if (editingRole) {
        // 更新処理
        await axios.put(`/api/roles/${editingRole._id}`, modalData);
      } else {
        // 新規作成処理
        await axios.post('/api/roles', modalData);
      }
      loadRoles(); // 一覧を再読み込み
      handleCloseModal();
    } catch (err) {
      setModalError(err.response?.data?.message || '保存に失敗しました。');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('このロールを削除すると、元に戻せません。よろしいですか？')) {
      try {
        await axios.delete(`/api/roles/${id}`);
        loadRoles();
      } catch (err) {
        // グローバルなエラーとして表示
        setError(err.response?.data?.message || '削除に失敗しました。');
        // 3秒後にエラーメッセージを消す
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // 保護されたロールかどうかを判定
  const isProtected = (roleName) => PROTECTED_ROLES.includes(roleName);

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /> <span>ロール情報を読み込み中...</span></div>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
        <span>役割 (ロール) 管理</span>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          ＋ 新規ロール作成
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ロール名</th>
              <th>説明</th>
              <th style={{ width: '150px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role._id}>
                <td>
                  {role.name}
                  {isProtected(role.name) && <span className="badge bg-secondary ms-2">保護</span>}
              </td>
                <td>{role.description}</td>
                <td>
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    onClick={() => handleOpenModal(role)}
                  >
                    編集
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(role._id)}
                    disabled={isProtected(role.name)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>

      {/* 作成・編集モーダル */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingRole ? 'ロールの編集' : '新規ロール作成'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>ロール名</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={modalData.name}
                onChange={handleModalFormChange}
                disabled={editingRole && isProtected(editingRole.name)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>説明</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={modalData.description}
                onChange={handleModalFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>キャンセル</Button>
          <Button variant="primary" onClick={handleSave}>保存</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default RoleManagementPage;
