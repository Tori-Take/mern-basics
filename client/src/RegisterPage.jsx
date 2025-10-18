import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';

function RegisterPage() {
  const [formData, setFormData] = useState({
    tenantName: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { tenantName, username, email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axios.post('/api/users/register', formData);
      // 登録成功後、ログインページにリダイレクト
      navigate('/login', { state: { message: '登録が完了しました。ログインしてください。' } });
    } catch (err) {
      setError(err.response?.data?.message || '登録に失敗しました。入力内容を確認してください。');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-sm">
        <Card.Header as="h2" className="text-center">新規登録</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="tenantName">
              <Form.Label>組織名</Form.Label>
              <Form.Control
                type="text"
                placeholder="例: A株式会社, 山田家"
                name="tenantName"
                value={tenantName}
                onChange={onChange}
                required
              />
              <Form.Text className="text-muted">
                あなたの会社名、チーム名、または家族名などを入力します。
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="username">
              <Form.Label>ユーザー名</Form.Label>
              <Form.Control
                type="text"
                placeholder="あなたの名前"
                name="username"
                value={username}
                onChange={onChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label>メールアドレス</Form.Label>
              <Form.Control
                type="email"
                placeholder="メールアドレス"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="password">
              <Form.Label>パスワード</Form.Label>
              <Form.Control
                type="password"
                placeholder="パスワード (6文字以上)"
                name="password"
                value={password}
                onChange={onChange}
                required
                minLength="6"
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner as="span" animation="border" size="sm" /> 登録中...</> : '同意して登録'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default RegisterPage;
