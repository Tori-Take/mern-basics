import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { systemApiService } from '../systemApiService';
import { Table, Button, Spinner, Alert, Card, Breadcrumb } from 'react-bootstrap';

const SystemTenantManagementPage = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = await systemApiService.getAllTenants();
      setTenants(data);
    } catch (err) {
      setError(err.response?.data?.message || 'テナントの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleDelete = async (tenantId, tenantName) => {
    if (window.confirm(`本当にテナント「${tenantName}」を削除しますか？\nこの操作は元に戻せません。関連する全てのユーザーとデータが完全に削除されます。`)) {
      try {
        setLoading(true); // 操作開始
        const response = await systemApiService.deleteTenant(tenantId);
        setSuccess(response.message);
        // 削除成功後、リストを再読み込み
        await fetchTenants();
      } catch (err) {
        setError(err.response?.data?.message || 'テナントの削除に失敗しました。');
        setLoading(false); // エラー時はローディングを解除
      }
    }
  };

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/system/dashboard" }}>システム管理</Breadcrumb.Item>
        <Breadcrumb.Item active>テナント管理</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header as="h2" className="h5 bg-light">
          <i className="bi bi-buildings me-2"></i>テナント管理
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {loading && !tenants.length ? (
            <div className="text-center py-5">
              <Spinner animation="border" /> <span>テナント情報を読み込み中...</span>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>テナント名</th>
                  <th>テナントID</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>{tenant.name}</td>
                    <td><code>{tenant._id}</code></td>
                    <td className="text-center">
                    <Button as={Link} to={`/system/tenants/${tenant._id}/tree`} variant="outline-info" size="sm" className="me-2" title="組織図を表示">
                      <i className="bi bi-diagram-3"></i>
                    </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(tenant._id, tenant.name)} disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : '削除'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default SystemTenantManagementPage;
