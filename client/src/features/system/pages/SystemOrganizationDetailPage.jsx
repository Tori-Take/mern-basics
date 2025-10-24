import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Table, Spinner, Alert, Breadcrumb } from 'react-bootstrap';
import { systemApiService } from '../systemApiService';

function SystemOrganizationDetailPage() {
  const { id } = useParams();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        const data = await systemApiService.getDepartmentListById(id);
        setDepartments(data);
      } catch (err) {
        setError(err.response?.data?.message || '部署情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    loadDepartments();
  }, [id]);

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /> <span>部署情報を読み込み中...</span></div>;
  }

  const departmentMap = departments.reduce((acc, dept) => {
    acc[dept._id.toString()] = dept;
    return acc;
  }, {});

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/system/dashboard" }}>システム管理</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/system/tenants" }}>組織管理</Breadcrumb.Item>
        <Breadcrumb.Item active>組織・部署管理</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
          <span><i className="bi bi-list-ul me-2"></i>組織・部署管理</span>
          <div>
            <Button as={Link} to={`/system/tenants/${id}/tree`} variant="outline-secondary" className="me-2">
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
              {departments.map(dept => (
                <tr key={dept._id}>
                  <td>
                    {/* Superuserは詳細編集画面には遷移しないため、リンクは設定しない */}
                    {dept.name}
                  </td>
                  <td>{dept.parent ? departmentMap[dept.parent.toString()]?.name : 'N/A (最上位)'}</td>
                  <td className="text-center">{dept.userCount}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}

export default SystemOrganizationDetailPage;
