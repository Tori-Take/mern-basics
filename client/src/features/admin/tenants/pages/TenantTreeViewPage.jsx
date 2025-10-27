import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Spinner, Alert, Card, Button, Breadcrumb } from 'react-bootstrap';
import { tenantApiService } from '../tenantApiService';
import { systemApiService } from '../../../system/systemApiService';
import TenantNode from '../components/TenantNode';
import '../components/TenantTreeView.css'; // スタイルシートをインポート

const TenantTreeViewPage = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id: tenantIdFromParams } = useParams(); // Superuser用のURLからIDを取得
  const location = useLocation();

  // どのAPIを呼び出すかを決定する
  const isSuperuserView = location.pathname.startsWith('/system');

  const fetchTreeData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let data;
      if (isSuperuserView) {
        // Superuser: 特定のテナントの組織図を取得
        data = await systemApiService.getTenantTreeById(tenantIdFromParams);
      } else {
        // Admin: 自身の組織図を取得
        data = await tenantApiService.getTenantTree();
      }
      setTreeData(data);
    } catch (err) {
      console.error('Failed to fetch tree data:', err);
      setError(err.response?.data?.message || '組織図の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [isSuperuserView, tenantIdFromParams]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // 戻るボタンのリンク先を動的に決定
  const getBackLink = () => {
    if (isSuperuserView) {
      return `/system/tenants/${tenantIdFromParams}/departments`; // Superuserの組織詳細一覧へ
    }
    return '/admin/tenants'; // Adminのテナント一覧へ
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" /> <span>組織図を生成中...</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      <Breadcrumb>
        {isSuperuserView ? (
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/system/dashboard" }}>システム管理</Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/admin/dashboard" }}>管理者ダッシュボード</Breadcrumb.Item>
        )}
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: getBackLink() }}>
          {isSuperuserView ? '組織管理' : '組織・部署管理'}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>組織図</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
          <span><i className="bi bi-diagram-3 me-2"></i>組織図ビュー</span>
          <Button as={Link} to={getBackLink()} variant="outline-secondary" size="sm">
            <i className="bi bi-list-ul me-1"></i>一覧で表示
          </Button>
        </Card.Header>
        <Card.Body className="tree-container">
          <ul className="tree-root">
            {treeData.map(rootNode => <TenantNode key={rootNode._id} node={rootNode} viewMode="card" />)}
          </ul>
        </Card.Body>
      </Card>
    </>
  );
};

export default TenantTreeViewPage;
