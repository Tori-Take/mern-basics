import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Table, Spinner, Alert, Breadcrumb, Form, Modal } from 'react-bootstrap';
import { systemApiService } from '../systemApiService';
import axios from 'axios';

function SystemOrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate(); // ★ ページ遷移用にインポート
  const [departments, setDepartments] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [rootTenant, setRootTenant] = useState(null); // ★ 権限設定対象のテナント
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // ★ 警告モーダル用のstate
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ★ 組織削除モーダル用のstate

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const [deptsRes, appsRes, tenantRes] = await Promise.all([
        systemApiService.getDepartmentListById(id),
        axios.get('/api/applications'),
        axios.get(`/api/tenants/${id}`), // ★ 権限設定のためにルートテナント情報を取得
      ]);

      setDepartments(deptsRes);
      setAllApplications(appsRes.data.data);
      setRootTenant(tenantRes.data);

    } catch (err) {
      setError(err.response?.data?.message || 'データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setRootTenant(prev => {
      const currentPermissions = prev.availablePermissions || [];
      const newPermissions = checked
        ? [...currentPermissions, value]
        : currentPermissions.filter(p => p !== value);
      return { ...prev, availablePermissions: newPermissions };
    });
  };

  // ★ 保存ボタンがクリックされたら、まず確認モーダルを表示
  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.put(`/api/tenants/${id}/permissions`, {
        permissions: rootTenant.availablePermissions,
      });
      setRootTenant(res.data);
      setSuccess('利用可能なアプリケーションが正常に更新されました。');
    } catch (err) {
      setError(err.response?.data?.message || '更新に失敗しました。');
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false); // ★ モーダルを閉じる
    }
  };

  // ★★★ 組織削除の処理を追加 ★★★
  const handleDeleteTenant = async () => {
    try {
      setIsSaving(true); // 削除中もボタンを無効化
      const response = await systemApiService.deleteTenant(id);
      // 削除成功後、一覧ページにメッセージを渡して遷移
      navigate('/system/tenants', { state: { message: response.message } });
    } catch (err) {
      setError(err.response?.data?.message || '組織の削除に失敗しました。');
      setShowDeleteModal(false); // エラー時はモーダルを閉じる
      setIsSaving(false);
    }
  };

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
          <span><i className="bi bi-list-ul me-2"></i>組織・部署管理: {rootTenant?.name}</span>
          <div>
            <Button as={Link} to={`/system/tenants/${id}/tree`} variant="outline-secondary" className="me-2">
              <i className="bi bi-diagram-3 me-1"></i> 組織図で表示
            </Button>
            {/* ★ 組織削除ボタンを追加 */}
            <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>
              <i className="bi bi-trash3 me-1"></i> この組織を削除
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

          {/* ★★★ 利用可能アプリケーション設定UI ★★★ */}
          <Card className="mb-4 border-primary">
            <Card.Header as="h3" className="fs-5 bg-primary text-white">利用可能アプリケーション設定</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group>
                  <Form.Label>この組織（<strong>{rootTenant?.name}</strong>）で利用を許可するアプリケーションを選択してください。</Form.Label>
                  <div className="permissions-checkbox-group mt-2">
                    {allApplications.length > 0 ? allApplications.map(app => (
                      <Form.Check
                        type="checkbox"
                        id={`perm-${app.permissionKey}`}
                        key={app.permissionKey}
                        label={`${app.name} (${app.permissionKey})`}
                        value={app.permissionKey}
                        checked={rootTenant?.availablePermissions?.includes(app.permissionKey) || false}
                        onChange={handlePermissionChange}
                      />
                    )) : (
                      <p className="text-muted">システムにアプリケーションが登録されていません。</p>
                    )}
                  </div>
                </Form.Group>
                <div className="text-end mt-3">
                  <Button variant="primary" onClick={handleSaveClick} disabled={isSaving || !rootTenant}>
                    {isSaving ? <><Spinner as="span" size="sm" /> 保存中...</> : '権限を保存'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

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

      {/* ★★★ 権限変更確認モーダル ★★★ */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>権限変更の確認</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <Alert.Heading><i className="bi bi-exclamation-triangle-fill me-2"></i>警告</Alert.Heading>
            <p>利用可能なアプリケーションの権限を変更すると、この組織および配下の全部署に所属するユーザーに影響があります。</p>
            <p className="mb-0">もし権限を削除（チェックを外す）した場合、該当するユーザーからそのアプリケーションの利用権限が<strong>即座に剥奪されます。</strong></p>
          </Alert>
          <p>この操作を続行しますか？</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={isSaving}>キャンセル</Button>
          <Button variant="danger" onClick={handleSaveChanges} disabled={isSaving}>変更を保存して実行</Button>
        </Modal.Footer>
      </Modal>

      {/* ★★★ 組織削除確認モーダル ★★★ */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>組織の削除</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <Alert.Heading><i className="bi bi-exclamation-triangle-fill me-2"></i>本当に削除しますか？</Alert.Heading>
            <p>組織「<strong>{rootTenant?.name}</strong>」を削除すると、この組織に所属する全ての部署、ユーザー、および関連するデータが完全に削除されます。</p>
            <p className="mb-0"><strong>この操作は元に戻すことができません。</strong></p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isSaving}>キャンセル</Button>
          <Button variant="danger" onClick={handleDeleteTenant} disabled={isSaving}>削除実行</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SystemOrganizationDetailPage;
