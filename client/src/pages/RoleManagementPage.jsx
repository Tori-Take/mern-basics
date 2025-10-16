import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleAddModal from '../components/RoleAddModal'; // モーダルコンポーネントをインポート
import RoleDeleteModal from '../components/RoleDeleteModal'; // 削除モーダルをインポート
import RoleEditModal from '../components/RoleEditModal'; // 編集モーダルをインポート

// フロントエンド側でも保護するロールを定義
const PROTECTED_ROLES = ['user', 'admin'];

function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 追加モーダルのState
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 削除モーダルのState
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // 編集モーダルのState
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get('/api/roles');
        setRoles(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'ロールの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // モーダルでロールが正常に追加されたときの処理
  const handleRoleAdded = (newRole) => {
    setRoles([...roles, newRole]);
    setIsAddModalOpen(false); // モーダルを閉じる
  };

  // 削除ボタンがクリックされたときの処理
  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
    setDeleteError(''); // 以前のエラーをクリア
  };

  // 削除モーダルが閉じられたときの処理
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  // 削除が確定されたときの処理
  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await axios.delete(`/api/roles/${roleToDelete._id}`);
      // UIから削除されたロールを消す
      setRoles(roles.filter(role => role._id !== roleToDelete._id));
      handleCloseDeleteModal();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'ロールの削除に失敗しました。');
    } finally {
      setIsDeleting(false);
    }
  };

  // 編集ボタンがクリックされたときの処理
  const handleEditClick = (role) => {
    setRoleToEdit(role);
    setIsEditModalOpen(true);
  };

  // モーダルでロールが正常に更新されたときの処理
  const handleRoleUpdated = (updatedRole) => {
    // 一覧のロール情報を更新
    setRoles(roles.map(role => (role._id === updatedRole._id ? updatedRole : role)));
    setIsEditModalOpen(false); // モーダルを閉じる
    setRoleToEdit(null);
  };


  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <h1 className="text-center my-4">役割管理</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          ロール一覧
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            ＋ 新規ロール追加
          </button>
        </div>
        <div className="card-body">
          <ul className="list-group">
            {roles.map(role => (
              <li key={role._id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{role.name}</strong>
                  <br />
                  <small className="text-muted">{role.description || '説明なし'}</small>
                </div>
                <div>
                  <button
                    className="btn btn-secondary btn-sm me-2"
                    onClick={() => handleEditClick(role)}
                    disabled={PROTECTED_ROLES.includes(role.name)}
                  >編集</button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteClick(role)}
                    disabled={PROTECTED_ROLES.includes(role.name)}
                  >削除</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <RoleAddModal
        show={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRoleAdded={handleRoleAdded}
      />

      <RoleDeleteModal
        show={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        role={roleToDelete}
        isDeleting={isDeleting}
        error={deleteError}
      />

      <RoleEditModal
        show={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onRoleUpdated={handleRoleUpdated}
        role={roleToEdit}
      />
    </div>
  );
}

export default RoleManagementPage;
