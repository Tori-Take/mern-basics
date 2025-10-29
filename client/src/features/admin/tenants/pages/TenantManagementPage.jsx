import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Table, Spinner, Alert, Breadcrumb } from 'react-bootstrap';
import { tenantApiService } from '../tenantApiService'; // ★ APIサービスをインポート

function TenantManagementPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantApiService.getTenants(); // ★ APIサービス経由で取得
      setTenants(data);
    } catch (err) {
      setError(err.response?.data?.message || '組織情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /> <span>組織情報を読み込み中...</span></div>;
  }

  // ★★★ 解決策: 親組織の名前を効率的に検索するためのマップを作成 ★★★
  const tenantMap = tenants.reduce((acc, tenant) => {
    acc[tenant._id.toString()] = tenant;
    return acc;
  }, {});

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/admin/dashboard" }}>管理者ポータル</Breadcrumb.Item>
        <Breadcrumb.Item active>組織・部署管理</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
          <span><i className="bi bi-list-ul me-2"></i>組織・部署管理</span>
          <div>
            <Button as={Link} to="/admin/tenants/tree" variant="outline-secondary" className="me-2">
              <i className="bi bi-diagram-3 me-1"></i> 組織図で表示
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>組織/部署名</th>
                <th>親組織</th>
                <th className="text-center">所属人数</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <tr key={tenant._id}>
                  <td>
                    <Link to={`/admin/tenants/${tenant._id}`}>
                      {tenant.name}
                    </Link>
                  </td>
                  <td>{tenant.parent ? tenantMap[tenant.parent.toString()]?.name : 'N/A (最上位)'}</td>
                  <td className="text-center">{tenant.userCount}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}

export default TenantManagementPage;