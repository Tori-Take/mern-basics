import React, { useState, useEffect } from 'react';
import { useAuth } from './providers/AuthProvider'; // ★ useAuthフックをインポート
import axios from 'axios';
import { Badge } from 'react-bootstrap';

// 日付文字列を 'YYYY-MM-DD' 形式にフォーマットするヘルパー関数
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    // タイムゾーンの問題を避けるため、ISO文字列から日付部分のみを切り出す
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

function TodoEditModal({ show, onClose, onSave, todo, onDelete }) {
  const { user } = useAuth(); // ★ ログイン中のユーザー情報を取得
  const [formData, setFormData] = useState({});
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState({});
  const [selectedTenant, setSelectedTenant] = useState('');

  // モーダルに表示するTODOデータが変更されたときにフォームを初期化する
  useEffect(() => {
    if (todo) {
      setFormData({
        text: todo.text || '',
        priority: todo.priority || '中',
        dueDate: formatDateForInput(todo.dueDate),
        scheduledDate: formatDateForInput(todo.scheduledDate),
        tags: (todo.tags || []).join(', '), // 配列をカンマ区切りの文字列に変換
        requester: (todo.requester || []).map(r => r._id), // ★ IDの配列を取得
      });
      setSelectedTenant(''); // 部署選択をリセット

      // 依頼可能なユーザーリストを取得
      const fetchAssignableUsers = async () => {
        try {
          const res = await axios.get('/api/users/assignable');
          setAssignableUsers(res.data);
          // ユーザーを部署ごとにグループ化
          const grouped = res.data.reduce((acc, user) => {
            const tenantId = user.tenantId._id;
            if (!acc[tenantId]) {
              acc[tenantId] = { name: user.tenantId.name, users: [] };
            }
            acc[tenantId].users.push(user);
            return acc;
          }, {});
          setGroupedUsers(grouped);
        } catch (error) {
          console.error('依頼可能なユーザーの取得に失敗しました。', error);
          setAssignableUsers([]); // エラー時は空にする
        }
      };

      fetchAssignableUsers();
    }
  }, [todo, show]); // showも依存配列に追加

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ★ 依頼先ユーザーをクリックしたときの処理
  const handleRequesterClick = (userId) => {
    setFormData(prev => {
      const currentRequesters = prev.requester || [];
      // 既に選択されていれば除外し、されていなければ追加する
      const newRequesters = currentRequesters.includes(userId)
        ? currentRequesters.filter(id => id !== userId)
        : [...currentRequesters, userId];
      return { ...prev, requester: newRequesters };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      alert('TODOの内容は必須です。');
      return;
    }
    // tagsをカンマ区切りの文字列から配列に変換
    const submissionData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    // creatorフィールドは送信データに含めない
    // delete submissionData.creator;

    onSave(todo._id, submissionData);
  };

  const handleDelete = () => {
    // 親から渡されたonDelete関数を呼び出す
    onDelete(todo._id);
  };

  // ★ このTODOに対する編集権限を判断
  const canEdit = user && todo && (user._id === todo.user?._id || user.roles.includes('admin'));

  if (!show) {
    return null;
  }

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{canEdit ? 'TODOを編集' : 'TODO詳細'}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* フォームの中身はTodoCreateModalとほぼ同じ */}
              <div className="mb-3">
                <label htmlFor="text-edit" className="form-label">内容<span className="text-danger">*</span></label>
                <textarea id="text-edit" name="text" className="form-control" value={formData.text} onChange={handleChange} required readOnly={!canEdit} />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="priority-edit" className="form-label">優先度</label>
                  <select id="priority-edit" name="priority" className="form-select" value={formData.priority} onChange={handleChange} disabled={!canEdit}>
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="tags-edit" className="form-label">タグ (カンマ区切り)</label>
                  <input type="text" id="tags-edit" name="tags" className="form-control" value={formData.tags} onChange={handleChange} readOnly={!canEdit} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="dueDate-edit" className="form-label">期日</label>
                  <input type="date" id="dueDate-edit" name="dueDate" className="form-control" value={formData.dueDate} onChange={handleChange} readOnly={!canEdit} />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="scheduledDate-edit" className="form-label">予定日</label>
                  <input type="date" id="scheduledDate-edit" name="scheduledDate" className="form-control" value={formData.scheduledDate} onChange={handleChange} readOnly={!canEdit} />
                </div>
              </div>
              {/* --- 依頼先選択UI --- */}
              <div className="mb-3">
                <label className="form-label">依頼先 (複数選択可)</label>
                <div className="row g-2 mb-2">
                  <div className="col-12">
                    <select className="form-select" value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} disabled={!canEdit}>
                      <option value="">1. まず部署を選択してください</option>
                      {Object.entries(groupedUsers).map(([tenantId, group]) => (
                        <option key={tenantId} value={tenantId}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={`d-flex flex-wrap align-items-center gap-1 p-1 rounded ${!canEdit ? 'bg-light' : ''}`} style={{ minHeight: '50px', border: '1px solid #dee2e6' }}>
                  {selectedTenant && groupedUsers[selectedTenant] ? (
                    groupedUsers[selectedTenant].users.map((user) => (
                      <button
                        type="button"
                        key={user._id}
                        className={`btn btn-sm py-0 ${formData.requester.includes(user._id) ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => canEdit && handleRequesterClick(user._id)}
                        disabled={!canEdit}
                      >
                        {user.username}
                      </button>
                    ))
                  ) : (
                    <span className="text-muted small align-self-center">2. ユーザーを選択してください</span>
                  )}
                </div>
                <div className="mt-2">
                  {formData.requester?.map(userId => {
                    const user = assignableUsers.find(u => u._id === userId);
                    return user ? <Badge key={userId} pill bg="primary" className="me-1 fw-normal">{user.username}</Badge> : null;
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {canEdit ? (
                <>
                  <div className="me-auto text-muted small">作成者: {todo?.user?.username || ''}</div>
                  <button type="button" className="btn btn-outline-danger" onClick={handleDelete}>削除</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
                  <button type="submit" className="btn btn-primary">更新</button>
                </>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={onClose}>閉じる</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TodoEditModal;

// ```

// #### コードの解説

// *   **`todo`プロップス**: 親コンポーネントから編集対象のTODOオブジェクトを受け取ります。
// *   **`useEffect`によるデータ設定**: `todo`プロップスが渡されると、`useEffect`が実行され、フォームの`formData`ステートをそのTODOのデータで初期化します。日付やタグの形式をフォームに合わせて変換しているのがポイントです。
// *   **`onSave`の呼び出し**: フォームが送信されると、`onSave`プロップスを呼び出します。このとき、どのTODOを更新するかを伝えるために`todo._id`も一緒に渡します。
// *   **ユニークなID**: フォーム要素の`id`や`htmlFor`に`-edit`という接尾辞をつけ、作成モーダルとの重複を避けています。

// これで、編集用のモーダルコンポーネントが完成しました。

// 次のステップでは、`App.jsx`を修正し、この新しい編集モーダルを開閉できるようにします。

// <!--
// [PROMPT_SUGGESTION]`App.jsx` を修正して、編集モーダルを開閉できるようにしてください。[/PROMPT_SUGGESTION]
// [PROMPT_SUGGESTION]追加したフィールド（優先度、期日など）をTODOリストの各アイテムに表示してください。[/PROMPT_SUGGESTION]
// -->