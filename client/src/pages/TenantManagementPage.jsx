import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, Button, Table, Spinner, Alert } from 'react-bootstrap';

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
      const res = await axios.get('/api/tenants');
      setTenants(res.data);
    } catch (err) {
      setError(err.response?.data?.message || '組織情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /> <span>組織情報を読み込み中...</span></div>;
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
          <span>組織・部署管理</span>
          <Button variant="primary" onClick={() => alert('トップレベルの部署作成機能は詳細ページに移動しました。')}>
            ＋ 新規部署を追加
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>組織/部署名</th>
                <th>親組織</th>
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
                  <td>{tenant.parent ? tenant.parent.name : 'N/A (最上位)'}</td>
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