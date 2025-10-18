import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Alert, Spinner, Card, Modal } from 'react-bootstrap';

function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    username: '',
    email: '',
    roles: [],
    status: 'active',
    tenantId: '', // ★ 所属テナントIDを保持するstateを追加
  });
  const [allRoles, setAllRoles] = useState([]);
  const [allTenants, setAllTenants] = useState([]); // ★ 組織階層を保持するstateを追加
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // 成功メッセージ用のStateを追加
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false); // モーダル表示用のState
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ★ 削除モーダル用のState
  const [temporaryPassword, setTemporaryPassword] = useState(''); // 一時パスワード入力用のState


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ユーザー情報、全ロール、全テナントを並行して取得
        const [userRes, rolesRes, tenantsRes] = await Promise.all([
          axios.get(`/api/users/${id}`),
          axios.get('/api/roles'),
          axios.get('/api/tenants'), // ★ 組織階層を取得するAPIを呼び出し
        ]);

        setUserData({
          username: userRes.data.username,
          email: userRes.data.email,
          roles: userRes.data.roles || [],
          status: userRes.data.status,
          tenantId: userRes.data.tenantId, // ★ ユーザーの現在の所属テナントIDをセット
        });
        setAllRoles(rolesRes.data);
        setAllTenants(tenantsRes.data); // ★ 取得した組織階層をstateにセット

      } catch (err) {
        setError(err.response?.data?.message || 'データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'status') {
      setUserData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }));
    } else {
      setUserData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ロールのチェックボックスが変更されたときの処理
  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setUserData(prev => {
      const newRoles = checked
        ? [...prev.roles, value] // チェックされたらロールを追加
        : prev.roles.filter(role => role !== value); // チェックが外れたらロールを削除
      return { ...prev, roles: newRoles };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axios.put(`/api/users/${id}`, userData);
      navigate('/admin/users'); // 成功したらユーザー一覧ページに戻る
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザー情報の更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ★ 削除処理
  const handleDelete = async () => {
    setShowDeleteModal(false); // モーダルを閉じる
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/users/${id}`);
      // 成功したら一覧ページにメッセージ付きでリダイレクト
      navigate('/admin/users', { state: { message: `ユーザー「${userData.username}」を削除しました。` } });
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザーの削除に失敗しました。');
    }
  };

  // パスワードリセットモーダルを開く処理
  const openResetModal = () => {
    // メッセージをクリア
    setError('');
    setSuccess('');
    setTemporaryPassword(''); // パスワード入力をリセット
    setShowResetModal(true);
  };

  // パスワード強制リセットを実行する処理
  const handleConfirmReset = async () => {
    if (temporaryPassword && temporaryPassword.length >= 6) {
      try {
        const res = await axios.post(`/api/users/${id}/force-reset`, { temporaryPassword });
        setSuccess(res.data.message); // バックエンドからの成功メッセージを表示
        setShowResetModal(false); // 成功したらモーダルを閉じる
      } catch (err) {
        setError(err.response?.data?.message || 'パスワードリセットの要求に失敗しました。');
      }
    } else {
      setError('パスワードは6文字以上で入力してください。');
    }
  };

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /> 読み込み中...</div>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Header as="h2" className="text-center">ユーザー情報編集</Card.Header>
      <Card.Body>
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>ユーザー名</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={userData.username}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>メールアドレス</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          {/* ★★★ ここから所属部署のドロップダウンを追加 ★★★ */}
          <Form.Group className="mb-3" controlId="tenantId">
            <Form.Label>所属部署</Form.Label>
            <Form.Select
              name="tenantId"
              value={userData.tenantId}
              onChange={handleInputChange}
            >
              {allTenants.map(tenant => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>役割 (ロール)</Form.Label>
            <div>
              {allRoles.map(role => (
                <Form.Check
                  inline
                  key={role._id}
                  type="checkbox"
                  id={`role-edit-${role.name}`}
                  label={role.name}
                  value={role.name}
                  checked={userData.roles.includes(role.name)}
                  onChange={handleRoleChange}
                  disabled={role.name === 'user'}
                />
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check // `isActive`を`status`に変更
              type="checkbox"
              id="status"
              name="status"
              label="アカウントを有効にする"
              checked={userData.status === 'active'}
              onChange={handleInputChange}
              as={Form.Switch}
            />
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
        </Form>
      </Card.Body>
      <Card.Footer className="bg-transparent border-top-0 pt-0">
        <div className="d-flex justify-content-end">
          <Button
            variant="outline-danger"
            size="sm"
            onClick={openResetModal}
          >パスワードを強制リセット</Button>
        </div>
      </Card.Footer>

      {/* パスワードリセット確認モーダル */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>パスワード強制リセット</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>{userData.username}</strong> の新しい一時パスワードを入力してください。</p>
          <p className="text-muted small">ユーザーは次回ログイン時に、この一時パスワードでログインし、新しいパスワードを再設定するよう求められます。</p>
          <Form.Group>
            <Form.Label>新しい一時パスワード (6文字以上)</Form.Label>
            <Form.Control
              type="text"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              autoFocus
            />
          </Form.Group>
          {/* モーダル内のエラー表示 */}
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={handleConfirmReset}>
            リセット実行
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ★ 削除確認モーダル */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>ユーザーの削除</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          本当に <strong>{userData.username}</strong> を削除しますか？
          <br />
          <strong className="text-danger">この操作は元に戻せません。</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            削除実行
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default UserEditPage;