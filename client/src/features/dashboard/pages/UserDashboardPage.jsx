import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Spinner, Button } from 'react-bootstrap'; // ★ Card, Row, Col, Buttonをインポート
import { useAuth } from '../../../providers/AuthProvider';
import axios from 'axios';

function UserDashboardPage() {
  const { user } = useAuth();
  const [availableApps, setAvailableApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await axios.get('/api/applications');
        // ★★★ 修正: APIのレスポンスオブジェクトから、実際のデータ配列(res.data.data)を取り出す ★★★
        const applicationsArray = res.data.data;
        console.log('1. APIから取得したアプリケーションリスト:', applicationsArray);
        // APIから取得したデータをフロントエンドで使いやすい形式に変換
        const appsData = applicationsArray.map(app => ({
          name: app.name,
          // ★★★ 修正2: 'app.permission' を 'app.permissionKey' に修正 ★★★
          path: `/${app.permissionKey.replace('CAN_USE_', '').toLowerCase()}`, // 例: CAN_USE_TODO -> /todo
          icon: app.permissionKey === 'CAN_USE_TODO' ? 'bi-check2-square' : 'bi-cone-striped', // アイコンを動的に設定
          description: app.description,
          requiredPermission: app.permissionKey,
        }));
        setAvailableApps(appsData);
      } catch (error) {
        console.error("アプリケーションリストの取得に失敗しました。", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  // userオブジェクトがまだ読み込まれていない場合は、ローディング表示をする
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  // アプリケーションリストの読み込み中
  if (loading) {
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
