import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../providers/AuthProvider';
import { Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';

function ForceResetPasswordPage() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { newPassword, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('パスワードが一致しません。');
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/users/force-reset-password', { newPassword });
      setSuccess(res.data.message + ' 3秒後にログインページに移動します。');

      // 成功後、自動的にログアウトしてログインページへ誘導
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'パスワードの更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-sm">
        <Card.Header as="h2" className="text-center">新しいパスワードの設定</Card.Header>
        <Card.Body>
          <p className="text-center text-muted mb-4">セキュリティのため、新しいパスワードを設定してください。</p>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>新しいパスワード</Form.Label>
              <InputGroup>
                <Form.Control type={showPassword.new ? 'text' : 'password'} name="newPassword" value={newPassword} onChange={onChange} required minLength="6" />
                <Button variant="outline-secondary" onClick={() => toggleShowPassword('new')}>
                  {showPassword.new ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-4" controlId="confirmPassword">
              <Form.Label>新しいパスワード (確認用)</Form.Label>
              <InputGroup>
                <Form.Control type={showPassword.confirm ? 'text' : 'password'} name="confirmPassword" value={confirmPassword} onChange={onChange} required minLength="6" />
                <Button variant="outline-secondary" onClick={() => toggleShowPassword('confirm')}>
                  {showPassword.confirm ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                </Button>
              </InputGroup>
            </Form.Group>
            <div className="d-grid">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting || !!success}
              >
                {isSubmitting ? (
                  <><Spinner as="span" animation="border" size="sm" /> 更新中...</>
                ) : (
                  'パスワードを更新'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default ForceResetPasswordPage;