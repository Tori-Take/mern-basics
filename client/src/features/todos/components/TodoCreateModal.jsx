import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../providers/AuthProvider';
import { Badge } from 'react-bootstrap';

const INITIAL_STATE = {
  text: '',
  priority: '中',
  dueDate: '',
  scheduledDate: '',
  tags: '',
  requester: [], // ★ 配列に変更
};

function TodoCreateModal({ show, onClose, onAdd }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const { user: currentUser } = useAuth(); // ★ ログインユーザー情報を取得
  const [groupedUsers, setGroupedUsers] = useState({});
  const [selectedTenant, setSelectedTenant] = useState('');

  // モーダルが表示されるたびにフォームを初期化
  useEffect(() => {
    if (show) {
      setFormData(INITIAL_STATE);
      setSelectedTenant('');

      // 依頼可能なユーザーリストを取得
      const fetchAssignableUsers = async () => {
        try {
          const res = await axios.get('/api/users/assignable');
          const filteredUsers = res.data.filter(u => u._id !== currentUser._id); // ★ 自分自身を除外
          setAssignableUsers(filteredUsers);
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
  }, [show, currentUser]); // ★ currentUserを依存配列に追加

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
    onAdd(submissionData);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">新しいTODOを作成</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="text" className="form-label">内容<span className="text-danger">*</span></label>
                <textarea
                  id="text"
                  name="text"
                  className="form-control"
                  value={formData.text}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="priority" className="form-label">優先度</label>
                  <select id="priority" name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="tags" className="form-label">タグ (カンマ区切り)</label>
                  <input type="text" id="tags" name="tags" className="form-control" value={formData.tags} onChange={handleChange} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="dueDate" className="form-label">期日</label>
                  <div className="input-group">
                    <input type="date" id="dueDate" name="dueDate" className="form-control" value={formData.dueDate} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="scheduledDate" className="form-label">予定日</label>
                  <input type="date" id="scheduledDate" name="scheduledDate" className="form-control" value={formData.scheduledDate} onChange={handleChange} />
                </div>
              </div>
              {/* --- 依頼先選択UI --- */}
              <div className="mb-3">
                <label className="form-label">依頼先 (複数選択可)</label>
                <div className="row g-2 mb-2">
                  <div className="col-12">
                    <select className="form-select" value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}>
                      <option value="">1. まず部署を選択してください</option>
                      {Object.entries(groupedUsers).map(([tenantId, group]) => (
                        <option key={tenantId} value={tenantId}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1 p-1 rounded" style={{ minHeight: '40px', border: '1px solid #dee2e6' }}>
                  {selectedTenant && groupedUsers[selectedTenant] ? (
                    groupedUsers[selectedTenant].users.map((user) => (
                      <button
                        type="button"
                        key={user._id}
                        className={`btn btn-sm py-0 ${formData.requester.includes(user._id) ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => handleRequesterClick(user._id)}
                      >
                        {user.username}
                      </button>
                    ))
                  ) : (
                    <span className="text-muted small align-self-center">2. ユーザーを選択してください</span>
                  )}
                </div>
                <div className="mt-2">
                  {formData.requester.map(userId => {
                    const user = assignableUsers.find(u => u._id === userId);
                    return user ? <Badge key={userId} pill bg="primary" className="me-1 fw-normal">{user.username}</Badge> : null;
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
              <button type="submit" className="btn btn-primary">作成</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TodoCreateModal;

// ```

// #### コードの解説

// *   **状態管理 (`useState`)**: `formData`という一つのstateオブジェクトで、フォームのすべての入力値を管理します。これにより、コードが非常にシンプルになります。
// *   **汎用的な`handleChange`**: `e.target.name`プロパティを利用することで、どの入力欄が変更されても一つの関数でstateを更新できます。
// *   **データ送信 (`handleSubmit`)**: 送信時に、カンマ区切りのタグ文字列を配列に変換してから、`onAdd`プロップス経由で親コンポーネントにデータを渡します。
// *   **Bootstrapモーダル**: Bootstrapが提供するクラス (`modal`, `modal-dialog`など) を使って、モーダルの骨格を構築しています。`show`プロップスが`true`のときだけ表示されるようになっています。

// これで、TODO作成のためのパワフルなフォームコンポーネントが完成しました。

// 次のステップでは、このモーダルを`App.jsx`から呼び出し、表示・非表示を制御するロジックを実装します。

// <!--
// [PROMPT_SUGGESTION]App.jsxを修正して、新しいTODO作成モーダルを開閉できるようにしてください。[/PROMPT_SUGGESTION]
// [PROMPT_SUGGESTION]追加したフィールド（優先度、期日など）をTODOリストの各アイテムに表示してください。[/PROMPT_SUGGESTION]
// -->