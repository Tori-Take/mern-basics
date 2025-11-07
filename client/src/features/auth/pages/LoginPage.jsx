import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap'; // ★ InputGroup をインポート
import { QRCodeCanvas } from 'qrcode.react'; // ★ QRコード生成コンポーネントをインポート

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ★ パスワード表示状態を管理
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ★★★ QRコードで表示するURLを定義 ★★★
  const appUrl = 'https://mern-basics-bbld.onrender.com/';

  // ★ パスワードの表示/非表示を切り替える関数
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // ★★★ ここからが修正箇所 ★★★
      // バックエンドからのエラーメッセージを元に、ユーザーフレンドリーなメッセージを設定
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'メールアドレスまたはパスワードが正しくありません。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Header as="h2" className="text-center">ログイン</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>メールアドレス</Form.Label>
              <Form.Control
                type="email"
                placeholder="メールアドレスを入力"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>パスワード</Form.Label>
              {/* ★★★ ここからが修正箇所 ★★★ */}
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'} // ★ stateに応じてtypeを切り替え
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button variant="outline-secondary" onClick={togglePasswordVisibility}>
                  {/* ★ stateに応じてアイコンを切り替え */}
                  <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                </Button>
              </InputGroup>
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'ログイン'}
              </Button>
            </div>
          </Form>

          {/* ★★★ ここからがQRコード表示部分 ★★★ */}
          <div className="text-center mt-4 pt-3 border-top">
            <p className="text-muted small mb-2">スマートフォンでのアクセスはこちら</p>
            <div className="d-inline-block p-2 border rounded">
              <QRCodeCanvas
                value={appUrl}
                size={128}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={true}
              />
            </div>
          </div>
          {/* ★★★ ここまで ★★★ */}

        </Card.Body>
        <Card.Footer className="text-center">
          {/* <small className="text-muted">
            アカウントをお持ちでないですか？ <Link to="/register">新規登録</Link>
          </small> */}
        </Card.Footer>
      </Card>
    </div>
  );
}

export default LoginPage;