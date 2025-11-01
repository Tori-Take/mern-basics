import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../providers/AuthProvider';
import { Badge, Form, InputGroup } from 'react-bootstrap'; // ★ Form, InputGroupを追加

const INITIAL_STATE = {
  text: '',
  priority: '中',
  dueDate: '',
  tags: '',
  requester: [], // ★ 配列に変更
  // ★ 修正: 開始・終了の日時を追加
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  isAllDay: false, // ★ 追加: 終日フラグ
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
    // ★★★ 修正: typeとcheckedもe.targetから取り出す ★★★
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
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
      // ★ 修正: 日付と時刻を結合して送信データを作成
      startDateTime: formData.startDate && formData.startTime ? `${formData.startDate}T${formData.startTime}` : null,
      endDateTime: formData.endDate && formData.endTime ? `${formData.endDate}T${formData.endTime}` : null,
      isAllDay: formData.isAllDay, // ★ 追加: 終日フラグを送信
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
              <Form.Group className="mb-3">
                <Form.Label htmlFor="text">内容<span className="text-danger">*</span></Form.Label>
                <Form.Control as="textarea" id="text" name="text" value={formData.text} onChange={handleChange} required />
              </Form.Group>
              <div className="row">
                <Form.Group as="div" className="col-md-6 mb-3">
                  <Form.Label htmlFor="priority">優先度</Form.Label>
                  <Form.Select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as="div" className="col-md-6 mb-3">
                  <Form.Label htmlFor="tags">タグ (カンマ区切り)</Form.Label>
                  <Form.Control type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} />
                </Form.Group>
              </div>
              <div className="row">
                <Form.Group as="div" className="col-md-6 mb-3">
                  <Form.Label htmlFor="dueDate">期日</Form.Label>
                  <Form.Control type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} />
                </Form.Group>
              </div>
              {/* ★★★ ここからが新しい日時入力UI ★★★ */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="isAllDay-create"
                  name="isAllDay"
                  label="終日"
                  checked={formData.isAllDay}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>開始日時</Form.Label>
                <InputGroup><Form.Control type="date" name="startDate" value={formData.startDate} onChange={handleChange} /><Form.Control type="time" name="startTime" value={formData.startTime} onChange={handleChange} disabled={formData.isAllDay} /></InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>終了日時</Form.Label>
                <InputGroup><Form.Control type="date" name="endDate" value={formData.endDate} onChange={handleChange} /><Form.Control type="time" name="endTime" value={formData.endTime} onChange={handleChange} disabled={formData.isAllDay} /></InputGroup>
              </Form.Group>
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
                    return user ? (
                      // ★★★ 修正: Badgeをクリック可能にし、削除機能を追加 ★★★
                      <Badge
                        key={userId}
                        pill
                        bg="primary"
                        className="me-1 fw-normal"
                        onClick={() => handleRequesterClick(userId)}
                        style={{ cursor: 'pointer' }}
                      >
                        {user.username} &times;
                      </Badge>
                    ) : null;
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