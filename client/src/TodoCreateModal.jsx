import React, { useState, useEffect } from 'react';

const INITIAL_STATE = {
  text: '',
  priority: '中',
  dueDate: '',
  scheduledDate: '',
  tags: '',
  creator: '',
  requester: '',
};

function TodoCreateModal({ show, onClose, onAdd }) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  // モーダルが表示されるたびにフォームを初期化
  useEffect(() => {
    if (show) {
      setFormData(INITIAL_STATE);
    }
  }, [show]);

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
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="creator" className="form-label">作成者</label>
                  <input type="text" id="creator" name="creator" className="form-control" value={formData.creator} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="requester" className="form-label">依頼先</label>
                  <input type="text" id="requester" name="requester" className="form-control" value={formData.requester} onChange={handleChange} />
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