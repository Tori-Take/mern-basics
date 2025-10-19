import React, { useState, useEffect } from 'react';

function TodoFilterSortModal({ show, onClose, onApply, currentOptions }) {
  const [options, setOptions] = useState(currentOptions);

  // モーダルが開くたびに、現在の設定をフォームに反映する
  useEffect(() => {
    if (show) {
      setOptions(currentOptions);
    }
  }, [show, currentOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = (e) => {
    e.preventDefault();
    onApply(options);
  };

  const handleReset = () => {
    const defaultOptions = { sort: '-createdAt', priority: '', tags: '', creator: '', requester: '', text: '' };
    setOptions(defaultOptions);
    onApply(defaultOptions); // リセットも即時適用する
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleApply}>
            <div className="modal-header">
              <h5 className="modal-title">絞り込み & 並び替え</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* 並び替え */}
              <div className="mb-3">
                <label htmlFor="sort" className="form-label">並び替え</label>
                <select id="sort" name="sort" className="form-select" value={options.sort} onChange={handleChange}>
                  <option value="-createdAt">作成日 (新しい順)</option>
                  <option value="createdAt">作成日 (古い順)</option>
                  <option value="dueDate">期日 (早い順)</option>
                  <option value="-dueDate">期日 (遅い順)</option>
                  <option value="scheduledDate">予定日 (早い順)</option>
                  <option value="-scheduledDate">予定日 (遅い順)</option>
                </select>
              </div>

              {/* 絞り込み */}
              <h6 className="mt-4">絞り込み条件</h6>
              <div className="mb-3">
                <label htmlFor="filter-text" className="form-label">内容 (フリーワード)</label>
                <input
                  type="text"
                  id="filter-text"
                  name="text"
                  className="form-control"
                  value={options.text || ''}
                  onChange={handleChange}
                  placeholder="テキストで絞り込み"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="filter-priority" className="form-label">優先度</label>
                <select id="filter-priority" name="priority" className="form-select" value={options.priority} onChange={handleChange}>
                  <option value="">すべて</option>
                  <option value="高">高</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="filter-tags" className="form-label">タグ</label>
                <input
                  type="text"
                  id="filter-tags"
                  name="tags"
                  className="form-control"
                  value={options.tags || ''}
                  onChange={handleChange}
                  placeholder="タグ名で絞り込み"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="filter-creator" className="form-label">作成者</label>
                <input
                  type="text"
                  id="filter-creator"
                  name="creator"
                  className="form-control"
                  value={options.creator || ''}
                  onChange={handleChange}
                  placeholder="作成者名で絞り込み"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="filter-requester" className="form-label">依頼先</label>
                <input
                  type="text"
                  id="filter-requester"
                  name="requester"
                  className="form-control"
                  value={options.requester || ''}
                  onChange={handleChange}
                  placeholder="依頼先名で絞り込み"
                />
              </div>
            </div>
            <div className="modal-footer justify-content-between">
              <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>リセット</button>
              <div>
                <button type="button" className="btn btn-secondary me-2" onClick={onClose}>キャンセル</button>
                <button type="submit" className="btn btn-primary">適用</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TodoFilterSortModal;