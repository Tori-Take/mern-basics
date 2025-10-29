import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Spinner, Button } from 'react-bootstrap'; // ★ Card, Row, Col, Buttonをインポート
import { useAuth } from '../../../providers/AuthProvider';

// ★ 表示するアプリケーションのリストを定義
const availableApps = [
  { name: 'TODOリスト', path: '/todos', icon: 'bi-check2-square', description: '日々のタスクを管理します。', requiredPermission: 'CAN_USE_TODO' },
  { name: 'スケジュール管理', path: '/schedule', icon: 'bi-calendar-week', description: 'チームの予定を共有します。', requiredPermission: 'CAN_USE_SCHEDULE' },
  // 今後ここにアプリを追加していく
];

function UserDashboardPage() {
  const { user } = useAuth();

  // userオブジェクトがまだ読み込まれていない場合は、ローディング表示をする
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  // ★ ユーザーが利用可能なアプリをフィルタリング
  const accessibleApps = availableApps.filter(app => {
    // 必要な権限が設定されていないアプリは、全員に表示
    if (!app.requiredPermission) {
      return true;
    }
    // ユーザーが権限を持っているかチェック
    // user.permissions は AuthProvider で常に配列として保証されている
    return user.permissions.includes(app.requiredPermission);
  });

  return (
    <div>
      <div className="text-center mb-5">
        <h1>アプリポータル</h1>
        <p className="lead text-muted">利用したいアプリケーションを選択してください。</p>
      </div>
      <Row xs={1} md={2} lg={3} xl={4} className="g-4 justify-content-center">
        {accessibleApps.map((app, index) => (
          <Col key={index}>
            <Link to={app.path} className="text-decoration-none">
              <Card className="h-100 shadow-sm app-card">
                <Card.Body className="text-center d-flex flex-column">
                  <i className={`bi ${app.icon} fs-1 text-primary mb-3`}></i>
                  <h5 className="card-title">{app.name}</h5>
                  <p className="card-text text-muted">{app.description}</p>
                  <Button variant="primary" className="mt-auto">開く</Button>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default UserDashboardPage;
