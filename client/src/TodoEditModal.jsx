import React, { useState, useEffect } from 'react';

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

function TodoEditModal({ show, onClose, onSave, todo }) {
  const [formData, setFormData] = useState({});

  // モーダルに表示するTODOデータが変更されたときにフォームを初期化する
  useEffect(() => {
    if (todo) {
      setFormData({
        text: todo.text || '',
        priority: todo.priority || '中',
        dueDate: formatDateForInput(todo.dueDate),
        scheduledDate: formatDateForInput(todo.scheduledDate),
        tags: (todo.tags || []).join(', '), // 配列をカンマ区切りの文字列に変換
        creator: todo.creator || '',
        requester: todo.requester || '',
      });
    }
  }, [todo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    onSave(todo._id, submissionData);
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
              <h5 className="modal-title">TODOを編集</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* フォームの中身はTodoCreateModalとほぼ同じ */}
              <div className="mb-3">
                <label htmlFor="text-edit" className="form-label">内容<span className="text-danger">*</span></label>
                <textarea id="text-edit" name="text" className="form-control" value={formData.text} onChange={handleChange} required />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="priority-edit" className="form-label">優先度</label>
                  <select id="priority-edit" name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="tags-edit" className="form-label">タグ (カンマ区切り)</label>
                  <input type="text" id="tags-edit" name="tags" className="form-control" value={formData.tags} onChange={handleChange} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="dueDate-edit" className="form-label">期日</label>
                  <input type="date" id="dueDate-edit" name="dueDate" className="form-control" value={formData.dueDate} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="scheduledDate-edit" className="form-label">予定日</label>
                  <input type="date" id="scheduledDate-edit" name="scheduledDate" className="form-control" value={formData.scheduledDate} onChange={handleChange} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="creator-edit" className="form-label">作成者</label>
                  <input type="text" id="creator-edit" name="creator" className="form-control" value={formData.creator} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="requester-edit" className="form-label">依頼先</label>
                  <input type="text" id="requester-edit" name="requester" className="form-control" value={formData.requester} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
              <button type="submit" className="btn btn-primary">保存</button>
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