import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../../../providers/AuthProvider';

function UserCreatePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    status: 'active',
    roles: ['user'], // デフォルトで 'user' ロールをセット
  });
  const [allRoles, setAllRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false); // パスワード表示/非表示用のState
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();
  useEffect(() => {
    // ページロード時に利用可能な全ロールを取得
    const fetchRoles = async () => {
      try {
        const res = await axios.get('/api/roles');
        setAllRoles(res.data);
      } catch (err) {
        setError('ロールの取得に失敗しました。');
      }
    };
    fetchRoles();
  }, [currentUser]);

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
    try {
      // POSTエンドポイントを使用して新しいユーザーを作成
      await axios.post('/api/users', formData);
      setSuccess('新しいユーザーが正常に作成されました。');
      // 2秒後にユーザー一覧にリダイレクト
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'ユーザーの作成に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    </Card>
  );
}

export default UserCreatePage;