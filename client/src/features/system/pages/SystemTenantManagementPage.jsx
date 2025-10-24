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
      setError(err.response?.data?.message || '組織一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleDelete = async (tenantId, tenantName) => {
    if (window.confirm(`本当に組織「${tenantName}」を削除しますか？\nこの操作は元に戻せません。関連する全てのユーザーとデータが完全に削除されます。`)) {
      try {
        setLoading(true); // 操作開始
        const response = await systemApiService.deleteTenant(tenantId);
        setSuccess(response.message);
        // 削除成功後、リストを再読み込み
        await fetchTenants();
      } catch (err) {
        setError(err.response?.data?.message || '組織の削除に失敗しました。');
        setLoading(false); // エラー時はローディングを解除
      }
    }
  };

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/system/dashboard" }}>システム管理</Breadcrumb.Item>
        <Breadcrumb.Item active>組織管理</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header as="h2">
          <span><i className="bi bi-diagram-3 me-2"></i>組織管理</span>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {loading && !tenants.length ? (
            <div className="text-center py-5">
              <Spinner animation="border" /> <span>組織情報を読み込み中...</span>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>組織名</th>
                  <th className="text-center">総所属人数</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <Link to={`/system/tenants/${tenant._id}/departments`}>{tenant.name}</Link>
                    </td>
                    <td className="text-center">{tenant.userCount}</td>
                    <td className="text-center">
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
