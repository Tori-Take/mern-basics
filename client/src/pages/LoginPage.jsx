import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, isAuthenticated, forceReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // RegisterPageから渡された成功メッセージがあれば表示
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // メッセージを表示したら、stateをクリアしてリロード時に再表示されないようにする
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // ★★★ ここからが修正箇所 ★★★
  // ログイン状態(isAuthenticated)が変更されたら実行される
  useEffect(() => {
    if (isAuthenticated) {
      if (forceReset) {
        navigate('/force-reset-password'); // パスワードリセットページへ
      } else {
        navigate('/'); // 通常はホームページへ
      }
    }
  }, [isAuthenticated, forceReset, navigate]);
  // ★★★ ここまでが修正箇所 ★★★

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(email, password);
      // ログイン成功後のリダイレクトは上記のuseEffectに任せる
    } catch (err) {
      setError(err.response?.data?.message || 'ログインに失敗しました。');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-sm">
        <Card.Header as="h2" className="text-center">ログイン</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>メールアドレス</Form.Label>
              <Form.Control type="email" placeholder="メールアドレス" name="email" value={email} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-4" controlId="password">
              <Form.Label>パスワード</Form.Label>
              <InputGroup>
                <Form.Control type={showPassword ? 'text' : 'password'} placeholder="パスワード" name="password" value={password} onChange={onChange} required />
                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                </Button>
              </InputGroup>
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner as="span" animation="border" size="sm" /> ログイン中...</> : 'ログイン'}
              </Button>
            </div>
          </Form>
          <p className="mt-3 text-center">
            アカウントをお持ちでないですか？ <Link to="/register">新しい組織を登録</Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default LoginPage;