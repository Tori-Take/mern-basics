import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button, Modal } from 'react-bootstrap';
import TenantNode from '../../../admin/tenants/components/TenantNode'; // ★ インポートを追加
import '../../../admin/tenants/components/TenantNode.css'; // ★ スタイルシートをインポート

function AdminUserEditPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allTenants, setAllTenants] = useState([]); // ★ 全テナント情報を保持
  const [showModal, setShowModal] = useState(false); // モーダルの表示状態
  const [treeData, setTreeData] = useState([]); // 組織図データ
  const [treeLoading, setTreeLoading] = useState(false); // 組織図のローディング状態
  const [selectedTenantId, setSelectedTenantId] = useState(null); // ★ 選択された部署IDを管理するstate

  const fetchUser = async () => {
    try {
      const res = await axios.get(`/api/users/${id}`);
      // ★ ユーザー情報と同時に全テナント情報も取得しておく
      if (allTenants.length === 0) {
        const tenantsRes = await axios.get('/api/tenants');
        setAllTenants(tenantsRes.data);
      }
      setUser(res.data);
    } catch (err) {
      setError('ユーザー情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenModal = async () => {
    setSelectedTenantId(null); // ★ モーダルを開くときに選択状態をリセット
    setShowModal(true);
    setTreeLoading(true);
    try {
      // 管理者自身の組織図を取得するAPIを呼び出す
      const res = await axios.get('/api/tenants/tree');
      setTreeData(res.data);
    } catch (err) {
      setError('組織図の取得に失敗しました。');
    } finally {
      setTreeLoading(false);
    }
  };

  // ★ 組織図のノードがクリックされたときのハンドラ
  const handleNodeClick = (node) => {
    setSelectedTenantId(node._id);
  };

  // ★ 部署を更新するAPIを呼び出すハンドラ
  const handleUpdateDepartment = async () => {
    if (!selectedTenantId) return;

    try {
      // APIを呼び出してユーザーのtenantIdを更新
      const res = await axios.put(`/api/users/${id}`, {
        tenantId: selectedTenantId,
      });

      // 成功したら、モーダルを閉じ、更新されたユーザー情報でstateを更新する
      setShowModal(false);
      setUser(res.data); // ★ 更新後のユーザー情報でstateを更新
    } catch (err) {
      setError('部署の更新に失敗しました。');
    }
  };

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  // ★ ユーザーの所属部署名を見つけるヘルパー
  const tenantName = allTenants.find(t => t._id === user?.tenantId)?.name || '未所属';

  return (
    <div>
      <h1>{user.username}</h1>
      <p>{user.email}</p>
      <p data-testid="department-display"><strong>所属部署:</strong> {tenantName}</p>
      <div className="mt-4">
        <Button variant="primary" onClick={handleOpenModal}> {/* ★ onClickを新しいハンドラに変更 */}
          部署を変更
        </Button>
      </div>
      {/* ここに将来、編集フォームが配置されます */}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>部署の変更</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* ★ 組織図のローディングと表示を実装 */}
          {treeLoading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <ul className="tree-root">
              {treeData.map(rootNode => (
                <TenantNode
                  key={rootNode._id}
                  node={rootNode}
                  onNodeClick={handleNodeClick}
                  selectedTenantId={selectedTenantId}
                />
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>キャンセル</Button>
          {selectedTenantId && <Button variant="primary" onClick={handleUpdateDepartment}>更新</Button>}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminUserEditPage;
