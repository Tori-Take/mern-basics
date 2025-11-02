import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider'; // ★ useAuthフックをインポート
import axios from 'axios';
import { Badge, Form, InputGroup } from 'react-bootstrap';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import DatePicker from 'react-datepicker'; // ★★★ react-datepickerをインポート ★★★
import 'react-datepicker/dist/react-datepicker.css'; // ★★★ スタイルシートをインポート ★★★

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
        dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : null, // ★ nullを許容
        tags: (todo.tags || []).join(', '), // 配列をカンマ区切りの文字列に変換
        requester: (todo.requester || []).map(r => r._id), // ★ IDの配列を取得
        startDate: todo.startDateTime ? todo.startDateTime.split('T')[0] : '',
        startTime: todo.startDateTime ? format(parseISO(todo.startDateTime), 'HH:mm') : '',
        endDate: todo.endDateTime ? todo.endDateTime.split('T')[0] : '',
        endTime: todo.endDateTime ? format(parseISO(todo.endDateTime), 'HH:mm') : '',
        isAllDay: todo.isAllDay || false, // ★ 追加: 終日フラグをセット
      });
      setSelectedTenant(''); // 部署選択をリセット

      // 依頼可能なユーザーリストを取得
      const fetchAssignableUsers = async () => {
        try {
          console.log('[DEBUG] EditModal: 1. Fetching assignable users...');
          const res = await axios.get('/api/users/assignable');
          console.log('[DEBUG] EditModal: 2. API response data:', JSON.parse(JSON.stringify(res.data)));
          setAssignableUsers(res.data);
          // ユーザーを部署ごとにグループ化
          const grouped = res.data.reduce((acc, user) => {
            // ★★★ ログ3: グループ化処理の内部を監視 ★★★
            if (!user.tenantId || typeof user.tenantId !== 'object') {
              console.warn('[DEBUG] EditModal: 3a. Invalid tenantId found for user:', user.username, 'tenantId:', user.tenantId);
              return acc;
            }
            const tenantId = user.tenantId._id;
            if (!acc[tenantId]) {
              acc[tenantId] = { name: user.tenantId.name, users: [] };
            }
            acc[tenantId].users.push(user);
            // console.log(`[DEBUG] EditModal: 3b. Processing user: ${user.username}, tenant: ${user.tenantId.name}`);
            return acc;
          }, {});
          console.log('[DEBUG] EditModal: 4. Grouping finished. Result:', grouped);
          setGroupedUsers(grouped);
        } catch (error) {
          console.error('[DEBUG] EditModal: 5. Error fetching or processing users:', error);
          setAssignableUsers([]); // エラー時は空にする
        }
      };

      fetchAssignableUsers();
    }
  }, [todo, show]); // showも依存配列に追加

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // ★ 修正: チェックボックスの変更に対応
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
      startDateTime: formData.startDate && formData.startTime ? `${formData.startDate}T${formData.startTime}` : null,
      endDateTime: formData.endDate && formData.endTime ? `${formData.endDate}T${formData.endTime}` : null,
      isAllDay: formData.isAllDay, // ★ 追加: 終日フラグを送信
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
              <Form.Group className="mb-3">
                <label htmlFor="text-edit" className="form-label">内容<span className="text-danger">*</span></label>
                <Form.Control as="textarea" id="text-edit" name="text" value={formData.text} onChange={handleChange} required readOnly={!canEdit} />
              </Form.Group>
              <div className="row">
                <Form.Group as="div" className="col-md-6 mb-3">
                  <label htmlFor="priority-edit" className="form-label">優先度</label>
                  <Form.Select id="priority-edit" name="priority" value={formData.priority} onChange={handleChange} disabled={!canEdit}>
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as="div" className="col-md-6 mb-3">
                  <label htmlFor="tags-edit" className="form-label">タグ (カンマ区切り)</label>
                  <Form.Control type="text" id="tags-edit" name="tags" value={formData.tags} onChange={handleChange} readOnly={!canEdit} />
                </Form.Group>
              </div>
              <div className="row">
                <Form.Group as="div" className="col-md-6 mb-3">
                  <label htmlFor="dueDate-edit" className="form-label">期日</label>
                  {/* ★★★ DatePickerコンポーネントに置換 ★★★ */}
                  <DatePicker
                    selected={formData.dueDate ? new Date(formData.dueDate) : null}
                    onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date ? format(date, 'yyyy-MM-dd') : null }))}
                    className="form-control"
                    dateFormat="yyyy/MM/dd (E)"
                    locale={ja}
                    placeholderText="日付を選択"
                    isClearable
                    disabled={!canEdit}
                  />
                </Form.Group>
              </div>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="isAllDay-edit"
                  name="isAllDay"
                  label="終日"
                  checked={formData.isAllDay}
                  onChange={handleChange}
                  disabled={!canEdit}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>開始日時</Form.Label>
                <DatePicker
                  selected={formData.startDate ? new Date(`${formData.startDate}T${formData.startTime || '00:00'}`) : null}
                  onChange={(date) => setFormData(prev => ({ ...prev, startDate: date ? format(date, 'yyyy-MM-dd') : '', startTime: date ? format(date, 'HH:mm') : '' }))}
                  className="form-control"
                  dateFormat="yyyy/MM/dd (E) HH:mm"
                  locale={ja}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  placeholderText="日時を選択"
                  isClearable
                  disabled={!canEdit || formData.isAllDay}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>終了日時</Form.Label>
                <DatePicker
                  selected={formData.endDate ? new Date(`${formData.endDate}T${formData.endTime || '00:00'}`) : null}
                  onChange={(date) => setFormData(prev => ({ ...prev, endDate: date ? format(date, 'yyyy-MM-dd') : '', endTime: date ? format(date, 'HH:mm') : '' }))}
                  className="form-control"
                  dateFormat="yyyy/MM/dd (E) HH:mm"
                  locale={ja}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  placeholderText="日時を選択"
                  isClearable
                  disabled={!canEdit || formData.isAllDay}
                />
              </Form.Group>
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
                    // ★★★ 修正: Badgeをクリック可能にし、削除機能を追加 ★★★
                    return user ? (
                      <Badge
                        key={userId}
                        pill
                        bg="primary"
                        className="me-1 fw-normal"
                        onClick={() => canEdit && handleRequesterClick(userId)}
                        style={{ cursor: canEdit ? 'pointer' : 'default' }}
                      >
                        {user.username}
                        {canEdit && <span className="ms-1">&times;</span>}
                      </Badge>
                    ) : null;
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