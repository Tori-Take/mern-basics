import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap';

function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    roles: [],
    isActive: true,
  });
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // 成功メッセージ用のStateを追加
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ユーザー情報と全ロール情報を並行して取得
        const [userRes, rolesRes] = await Promise.all([
          axios.get(`/api/users/${id}`),
          axios.get('/api/roles'),
        ]);

        setUserData({
          name: userRes.data.name,
          email: userRes.data.email,
          roles: userRes.data.roles || [],
          isActive: userRes.data.isActive,
        });
        setAllRoles(rolesRes.data);

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
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  // パスワード強制リセット処理
  const handleForceReset = async () => {
    // メッセージをクリア
    setError('');
    setSuccess('');

    // 一時パスワードの入力を求める
    const temporaryPassword = window.prompt(
      `${userData.name} のための一時パスワードを入力してください。\n(6文字以上)`
    );

    if (temporaryPassword && temporaryPassword.length >= 6) {
      try {
        const res = await axios.post(`/api/users/${id}/force-reset`, { temporaryPassword });
        setSuccess(res.data.message); // バックエンドからの成功メッセージを表示
      } catch (err) {
        setError(err.response?.data?.message || 'パスワードリセットの要求に失敗しました。');
      }
    } else if (temporaryPassword) { // 入力はしたが6文字未満の場合
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
          <Form.Group className="mb-3" controlId="userName">
            <Form.Label>名前</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={userData.name}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="userEmail">
            <Form.Label>メールアドレス</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          {/* --- ロール選択 --- */}
          <Form.Group className="mb-3">
            <Form.Label>役割 (ロール)</Form.Label>
            <div>
              {allRoles.map(role => (
                <Form.Check
                  key={role._id}
                  type="checkbox"
                  id={`role-${role.name}`}
                  label={role.name}
                  value={role.name}
                  checked={userData.roles.includes(role.name)}
                  onChange={handleRoleChange}
                  disabled={role.name === 'user'} // 'user'ロールは必須なので変更不可にする
                />
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="switch"
              id="isActive"
              name="isActive"
              label="アカウントを有効にする"
              checked={userData.isActive}
              onChange={handleInputChange}
            />
          </Form.Group>

          <div className="d-grid">
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner as="span" animation="border" size="sm" /> 更新中...</> : '更新'}
            </Button>
          </div>
        </Form>
      </Card.Body>
      {/* --- 危険な操作ゾーン --- */}
      <Card.Footer className="bg-transparent border-top-0 pt-0">
        <div className="d-flex justify-content-end">
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleForceReset}
          >パスワードを強制リセット</Button>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default UserEditPage;