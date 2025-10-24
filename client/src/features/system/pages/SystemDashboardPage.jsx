import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const SystemDashboardPage = () => {
  return (
    <div>
      <h1 className="text-center mb-4">システム管理ダッシュボード</h1>
      <p className="text-center text-muted mb-5">
        システム全体の管理機能にアクセスします。これらの操作はシステム全体に影響を与えるため、慎重に行ってください。
      </p>

      <Row className="justify-content-center g-4">
        <Col md={6} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center d-flex flex-column">
              <i className="bi bi-buildings fs-1 text-primary mb-3"></i>
              <Card.Title as="h5">テナント管理</Card.Title>
              <Card.Text>
                システムに存在する全てのテナント（組織・部署）を管理します。テナントの削除は、関連する全てのデータを削除する不可逆な操作です。
              </Card.Text>
              <Link to="/system/tenants" className="btn btn-primary mt-auto">
                Manage
              </Link>
            </Card.Body>
          </Card>
        </Col>
        {/* 将来の機能追加用のプレースホルダー */}
        {/*
        <Col md={6} lg={4}>
          <Card className="shadow-sm h-100 bg-light">
            <Card.Body className="d-flex flex-column text-center">
              <Card.Title as="h2" className="h5 text-muted">
                <i className="bi bi-journal-text me-2"></i>システムログ
              </Card.Title>
              <Card.Text className="text-muted">
                （今後実装予定）
              </Card.Text>
              <div className="mt-auto">
                <Button variant="secondary" disabled className="w-100">Manage</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        */}
      </Row>
    </div>
  );
};

export default SystemDashboardPage;
