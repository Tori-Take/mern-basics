import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button, Modal, Card, Form, Alert, InputGroup } from 'react-bootstrap';
import TenantNode from '../../../admin/tenants/components/TenantNode'; // ★ インポートを追加
import { useAuth } from '../../../../providers/AuthProvider'; // ★ ログインユーザー情報を取得するためにインポート
import '../../../admin/tenants/components/TenantNode.css'; // ★ スタイルシートをインポート

function AdminUserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // フォームデータと元のユーザーデータを分離
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth(); // ★ ログインユーザーの情報を取得

  // 状態管理用のstate
  const [allTenants, setAllTenants] = useState([]); // ★ 全テナント情報を保持
  const [allRoles, setAllRoles] = useState([]);
  const [showModal, setShowModal] = useState(false); // モーダルの表示状態
  const [tenantAvailablePermissions, setTenantAvailablePermissions] = useState([]); // ★ テナントで利用可能な権限
  const [treeData, setTreeData] = useState([]); // 組織図データ
  const [treeLoading, setTreeLoading] = useState(false); // 組織図のローディング状態
  const [selectedTenantId, setSelectedTenantId] = useState(null); // ★ 選択された部署IDを管理するstate
  const [allApplications, setAllApplications] = useState([]); // ★ 利用可能な全アプリケーションを保持
  const [permissionsString, setPermissionsString] = useState(''); // ★ permissionsを文字列として扱うstate

  // パスワードリセットと削除モーダル用のState
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ★★★ 修正: API呼び出しを段階的に行う ★★★
        // 1. 最初にユーザー情報と、それに依存しない情報を取得
        const [userRes, rolesRes, tenantsRes, appsRes] = await Promise.all([
          axios.get(`/api/users/${id}`),
          axios.get('/api/roles'), // ★ 修正: tenantIdを指定せずに、操作者のテナントのロールを取得
          axios.get('/api/tenants/all'), // ★ 全テナント情報を取得するAPIに変更
          axios.get('/api/applications'), // ★ アプリケーション一覧を取得
        ]);
        setFormData(userRes.data);
        setAllRoles(rolesRes.data);
        setAllTenants(tenantsRes.data);
        setAllApplications(appsRes.data.data); // ★ 取得したデータをstateに保存
        setPermissionsString((userRes.data.permissions || []).join(', ')); // ★ 初期値を設定
        // ★ ユーザーが所属するテナントの利用可能権限を取得
        const userTenant = tenantsRes.data.find(t => t._id === userRes.data.tenantId);
        if (userTenant) {
          setTenantAvailablePermissions(userTenant.availablePermissions || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || `データの取得に失敗しました: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenModal = async () => {
    setSelectedTenantId(formData.tenantId); // 現在の部署を選択状態にする
    setShowModal(true);
    setTreeLoading(true);
    try {
      const res = await axios.get('/api/tenants/tree');
      setTreeData(res.data);
    } catch (err) {
      setError('組織図の取得に失敗しました。');
    } finally {
      setTreeLoading(false);
    }
  };

  const handleNodeClick = (node) => {
    setSelectedTenantId(node._id);
  };

  const handleUpdateDepartment = async () => {
    if (!selectedTenantId) return;
    setFormData(prev => ({ ...prev, tenantId: selectedTenantId }));
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'status') {
      setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newRoles = checked
        ? [...prev.roles, value]
        : prev.roles.filter(role => role !== value);
      return { ...prev, roles: newRoles };
    });
  };

  // ★ チェックボックスの変更をハンドルする関数
  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      const newPermissions = checked
        ? [...currentPermissions, value]
        : currentPermissions.filter(p => p !== value);
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`/api/users/${id}`, formData); // ★ formDataをそのまま送信
      setSuccess('ユーザー情報が正常に更新されました。');
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザー情報の更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await axios.delete(`/api/users/${id}`);
      navigate('/admin/users', { state: { message: `ユーザー「${formData.username}」を削除しました。` } });
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザーの削除に失敗しました。');
    }
  };

  const handleConfirmReset = async () => {
    if (!temporaryPassword || temporaryPassword.length < 6) {
      return setError('パスワードは6文字以上で入力してください。');
    }
    try {
      const res = await axios.post(`/api/users/${id}/force-reset`, { temporaryPassword });
      setSuccess(res.data.message);
      setShowResetModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'パスワードリセットに失敗しました。');
    }
  };

  if (loading) { // ★ formDataのチェックを削除し、loadingのみで判断
    return <div className="text-center"><Spinner animation="border" /></div>;
  }

  const tenantName = allTenants.find(t => t._id === formData?.tenantId)?.name || '未所属';

  return (
    <Card className="shadow-sm">
      <Card.Header as="h1" className="text-center">ユーザー情報編集</Card.Header>
      <Card.Body>
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        {/* ★★★ formDataが存在する場合のみフォームを描画 ★★★ */}
        {formData && <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>ユーザー名</Form.Label>
            <Form.Control type="text" name="username" value={formData?.username || ''} onChange={handleInputChange} required />
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>メールアドレス</Form.Label>
            <Form.Control type="email" name="email" value={formData?.email || ''} onChange={handleInputChange} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>所属部署</Form.Label>
            <InputGroup>
              <Form.Control type="text" value={tenantName} readOnly />
              <Button variant="outline-secondary" onClick={handleOpenModal}>変更</Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>役割 (ロール)</Form.Label>
            <div>
              {allRoles.map(role => {
                // --- ▼▼▼ UI改善ロジック ▼▼▼ ---
                // tenant-superuserロールのチェックボックスに対する表示制御
                if (role.name === 'tenant-superuser') {
                  // ログインユーザーがsuperuserかtenant-superuserでなければ表示しない
                  if (!currentUser?.roles.includes('superuser') && !currentUser?.roles.includes('tenant-superuser')) {
                    return null; // このチェックボックスを描画しない
                  }
                }
                // --- ▲▲▲ UI改善ロジックここまで ▲▲▲ ---

                return (
                  <Form.Check
                    inline key={role._id}
                    type="checkbox" id={`role-${role.name}`}
                    label={role.name} value={role.name}
                    checked={formData?.roles.includes(role.name) || false}
                    onChange={handleRoleChange} disabled={role.name === 'user'} />
                );
              })}
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check type="switch" id="status" name="status" label="アカウントを有効にする" checked={formData?.status === 'active'} onChange={handleInputChange} />
          </Form.Group>

          {/* 【TDD Step3: GREEN】 permissions編集用のUIを追加 */}
          <Form.Group className="mb-4" controlId="permissions">
            <Form.Label>利用可能アプリ</Form.Label>
            {/* ★ テキストエリアをチェックボックスに置き換え */}
            <div className="permissions-checkbox-group">
              {allApplications.length > 0 ? allApplications.map(app => {
                // ★ Superuserでない場合、テナントで許可された権限のみ表示
                if (!currentUser.roles.includes('superuser') && !tenantAvailablePermissions.includes(app.permissionKey)) {
                  return null;
                }
                return (
                  <Form.Check
                    type="checkbox"
                    id={`perm-${app.permissionKey}`}
                    key={app.permissionKey}
                    label={`${app.name} (${app.permissionKey})`}
                    value={app.permissionKey} checked={formData.permissions?.includes(app.permissionKey) || false} onChange={handlePermissionChange} />
                );
              }) : (
                <p className="text-muted">利用可能なアプリケーションがありません。</p>
              )}
            </div>
          </Form.Group>

          <div className="d-flex justify-content-between">
            <div>
              <Link to="/admin/users" className="btn btn-secondary me-2">一覧に戻る</Link>
              <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>削除</Button>
            </div>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner as="span" animation="border" size="sm" /> 更新中...</> : '更新'}
            </Button>
          </div>
        </Form>}
      </Card.Body>
      <Card.Footer className="text-end">
        <Button variant="outline-warning" size="sm" onClick={() => setShowResetModal(true)}>パスワードを強制リセット</Button>
      </Card.Footer>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>部署の変更</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {treeLoading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <ul className="tree-root">
              {treeData.map(rootNode => (
                <TenantNode key={rootNode._id} node={rootNode} onNodeClick={handleNodeClick} selectedTenantId={selectedTenantId} />
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>キャンセル</Button>
          {selectedTenantId && <Button variant="primary" onClick={handleUpdateDepartment}>選択</Button>}
        </Modal.Footer>
      </Modal>

      {/* パスワードリセット確認モーダル */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>パスワード強制リセット</Modal.Title></Modal.Header>
        <Modal.Body>
          <p><strong>{formData?.username}</strong> の新しい一時パスワードを入力してください。</p>
          <Form.Group>
            <Form.Label>新しい一時パスワード (6文字以上)</Form.Label>
            <Form.Control type="text" value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} autoFocus />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>キャンセル</Button>
          <Button variant="danger" onClick={handleConfirmReset}>リセット実行</Button>
        </Modal.Footer>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>ユーザーの削除</Modal.Title></Modal.Header>
        <Modal.Body>
          本当に <strong>{formData?.username}</strong> を削除しますか？<br />
          <strong className="text-danger">この操作は元に戻せません。</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>キャンセル</Button>
          <Button variant="danger" onClick={handleDelete}>削除実行</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default AdminUserEditPage;
