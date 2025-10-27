import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner, InputGroup, Modal } from 'react-bootstrap';
import { useAuth } from '../../../../providers/AuthProvider';
import TenantNode from '../../../admin/tenants/components/TenantNode';
import '../../../admin/tenants/components/TenantNode.css';

function UserCreatePage() {
  const navigate = useNavigate();
  const location = useLocation(); // ★ locationフックを使用
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    status: 'active',
    roles: ['user'], // デフォルトで 'user' ロールをセット
    tenantId: null, // ★ tenantIdを管理
  });
  const [allTenants, setAllTenants] = useState([]); // ★ テナント一覧を保持
  const [allRoles, setAllRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false); // パスワード表示/非表示用のState
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  // モーダル関連のState
  const [showModal, setShowModal] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  useEffect(() => {
    // ページロード時に利用可能な全ロールと全テナントを取得
    const fetchData = async () => {
      try {
        const [rolesRes, tenantsRes] = await Promise.all([
          axios.get('/api/roles'),
          axios.get('/api/tenants') // 階層化されたテナント一覧を取得
        ]);
        setAllRoles(rolesRes.data);
        setAllTenants(tenantsRes.data);

        // ★★★ 部署詳細ページから渡されたIDを初期値として設定 ★★★
        const defaultTenantId = location.state?.defaultTenantId;
        if (defaultTenantId) {
          setSelectedTenantId(defaultTenantId);
        }
      } catch (err) {
        setError('初期データの取得に失敗しました。');
      }
    };
    fetchData();
  }, [currentUser, location.state]);

  const onChange = (e) => {
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // ★ 選択された部署IDをフォームデータに含める
    const submissionData = {
      ...formData,
      tenantId: selectedTenantId,
    };

    try {
      // POSTエンドポイントを使用して新しいユーザーを作成
      await axios.post('/api/users', submissionData);
      setSuccess('新しいユーザーが正常に作成されました。');
      // 2秒後にユーザー一覧にリダイレクト
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザーの作成に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = async () => {
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

  const handleSelectDepartment = () => {
    // この関数はモーダルを閉じるだけ。実際のIDはselectedTenantIdで管理
    setShowModal(false);
  };

  // ★ 表示用の部署名を取得
  const tenantName = allTenants.find(t => t._id === selectedTenantId)?.name || '未選択';

  return (
    <Card className="shadow-sm">
      <Card.Header as="h2" className="text-center">新規ユーザー追加</Card.Header>
      <Card.Body>
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>ユーザー名</Form.Label>
            <Form.Control type="text" name="username" value={formData.username} onChange={onChange} required />
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>メールアドレス</Form.Label>
            <Form.Control type="email" name="email" value={formData.email} onChange={onChange} required />
          </Form.Group>

          {/* ★★★ 所属部署選択ドロップダウンを追加 ★★★ */}
          <Form.Group className="mb-3">
            <Form.Label>所属部署</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control type="text" value={tenantName} readOnly required className="me-2" />
              <Button variant="outline-primary" onClick={handleOpenModal}>選択</Button>
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>初期パスワード</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={onChange}
                required
                minLength="6"
              />
              <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '隠す' : '表示'}
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>役割 (ロール)</Form.Label>
            <div>
              {allRoles.map(role => (
                <Form.Check
                  inline
                  key={role._id}
                  type="checkbox"
                  id={`role-create-${role.name}`}
                  label={role.name}
                  value={role.name}
                  checked={formData.roles.includes(role.name)}
                  onChange={handleRoleChange}
                  disabled={role.name === 'user'}
                />
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="status"
              name="status"
              label="アカウントを有効にする"
              checked={formData.status === 'active'}
              onChange={onChange}
              as={Form.Switch}
            />
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Link to="/admin/users" className="btn btn-secondary">一覧に戻る</Link>
            <Button type="submit" variant="success" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner as="span" size="sm" /> 作成中...</> : '作成する'}
            </Button>
          </div>
        </Form>
      </Card.Body>

      {/* 部署選択モーダル */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>部署の選択</Modal.Title>
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
          {selectedTenantId && <Button variant="primary" onClick={handleSelectDepartment}>決定</Button>}
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default UserCreatePage;