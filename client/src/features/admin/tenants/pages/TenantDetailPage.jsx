import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Spinner, Alert, Modal, Form, ListGroup, Breadcrumb, Table, Badge } from 'react-bootstrap';

function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // モーダル関連のState
  const [showModal, setShowModal] = useState(false);
  const [modalContext, setModalContext] = useState({ mode: '', title: '', label: '', buttonText: '' });
  const [inputValue, setInputValue] = useState('');
  const [modalError, setModalError] = useState('');
  // 削除確認モーダル用のState
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadTenantDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/tenants/${id}`);
      setTenant(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || '部署情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTenantDetails();
  }, [loadTenantDetails]);

  // モーダルを開く汎用ハンドラ
  const handleOpenModal = (mode) => {
    setModalError('');
    if (mode === 'edit') {
      setModalContext({ mode: 'edit', title: '部署名の編集', label: '新しい部署名', buttonText: '更新' });
      setInputValue(tenant.name);
    } else if (mode === 'createSub') {
      setModalContext({ mode: 'createSub', title: 'サブ部署の追加', label: '新しいサブ部署名', buttonText: '作成' });
      setInputValue('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // 作成・編集モーダルのサブミット処理
  const handleModalSubmit = async () => {
    if (!inputValue.trim()) {
      setModalError('名前を入力してください。');
      return;
    }
    setModalError('');
    try {
      if (modalContext.mode === 'edit') {
        await axios.put(`/api/tenants/${id}`, { name: inputValue });
      } else if (modalContext.mode === 'createSub') {
        await axios.post('/api/tenants', { name: inputValue, parentId: id });
      }
      handleCloseModal();
      loadTenantDetails(); // データを再読み込み
    } catch (err) {
      setModalError(err.response?.data?.message || '操作に失敗しました。');
    }
  };

  // 削除処理
  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`/api/tenants/${id}`);
      navigate('/admin/tenants', { state: { message: `「${tenant.name}」を削除しました。` } });
    } catch (err) {
      setError(err.response?.data?.message || '削除に失敗しました。');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /> <span>読み込み中...</span></div>;
  }

  if (error && !tenant) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/admin/dashboard" }}>管理者ポータル</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/admin/tenants" }}>組織・部署管理</Breadcrumb.Item>
        <Breadcrumb.Item active>{tenant?.name || '詳細'}</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
          <span>部署詳細: {tenant?.name}</span>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <ListGroup variant="flush">
            <ListGroup.Item><strong>ID:</strong> {tenant?._id}</ListGroup.Item>
            <ListGroup.Item><strong>親組織:</strong> {tenant?.parent ? <Link to={`/admin/tenants/${tenant.parent._id}`}>{tenant.parent.name}</Link> : 'N/A (最上位)'}</ListGroup.Item>
            <ListGroup.Item>
              <strong>サブ部署:</strong>
              {tenant?.children.length > 0 ? (
                <ul>
                  {tenant.children.map(child => (
                    <li key={child._id}><Link to={`/admin/tenants/${child._id}`}>{child.name}</Link></li>
                  ))}
                </ul>
              ) : 'なし'}
            </ListGroup.Item>
          </ListGroup>

          {/* ★★★ 所属ユーザー一覧の追加 ★★★ */}
          <h3 className="h5 mt-4 mb-3">所属ユーザー</h3>
          {tenant?.users && tenant.users.length > 0 ? (
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>ユーザー名</th>
                  <th>メールアドレス</th>
                  <th>ロール</th>
                  <th className="text-center">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {tenant.users.map(user => (
                  <tr key={user._id}>
                    <td><Link to={`/admin/users/${user._id}`}>{user.username}</Link></td>
                    <td>{user.email}</td>
                    <td>{user.roles.map(role => <Badge bg="secondary" className="me-1" key={role}>{role}</Badge>)}</td>
                    <td className="text-center"><Badge bg={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted">この部署にはユーザーが所属していません。</p>
          )}
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between flex-wrap gap-2">
          <div>
            <Button variant="outline-primary" className="me-2" onClick={() => handleOpenModal('edit')}>名前を編集</Button>
            <Button as={Link} to="/admin/users/new" state={{ defaultTenantId: id }} variant="outline-info" className="me-2">
              <i className="bi bi-person-plus me-1"></i>ユーザーを追加
            </Button>
            <Button variant="outline-success" onClick={() => handleOpenModal('createSub')}>サブ部署を追加</Button>
          </div>
          <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>この部署を削除</Button>
        </Card.Footer>
      </Card>

      {/* 作成・編集モーダル */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalContext.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            <Form.Group>
              <Form.Label>{modalContext.label}</Form.Label>
              <Form.Control
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>キャンセル</Button>
          <Button variant="primary" onClick={handleModalSubmit}>{modalContext.buttonText}</Button>
        </Modal.Footer>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>部署の削除</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          本当に <strong>{tenant?.name}</strong> を削除しますか？
          <br />
          <span className="text-muted">サブ部署や所属ユーザーがいる場合は削除できません。</span>
          <br />
          <strong className="text-danger">この操作は元に戻せません。</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>キャンセル</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>削除実行</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TenantDetailPage;

// ```

// ### ステップ3：フロントエンド - ルーティングの追加

// 最後に、`client/src/App.jsx`を編集して、新しい組織詳細ページへのルートを追加します。

// ```diff
