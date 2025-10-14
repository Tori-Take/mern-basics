import React from 'react';

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  // 優先度に応じてBootstrapのバッジクラスを返すヘルパー関数
  const getPriorityBadge = (priority) => {
    const colors = {
      '高': 'danger',   // 赤
      '中': 'warning',  // 黄
      '低': 'success',  // 緑
    };
    return <span className={`badge bg-${colors[priority] || 'secondary'} me-2`}>{priority}</span>;
  };

  return (
    <li className="list-group-item d-flex align-items-center gap-3">
      {/* 完了状態に応じてチェックボックスかボタンを表示 */}
      {todo.completed ? (
        <button 
          className="btn btn-sm btn-outline-secondary flex-shrink-0" 
          onClick={() => onToggle(todo._id)}
          title="未完了に戻す"
        >
          ↩
        </button>
      ) : (
        <input
          type="checkbox"
          className="form-check-input flex-shrink-0"
          checked={false}
          onChange={() => onToggle(todo._id)}
        />
      )}

      {/* テキストまたは入力欄（スペースをすべて使う） */}
      <div className="flex-grow-1">
        <div>
          <div className="d-flex align-items-center">
            {getPriorityBadge(todo.priority)}
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
          </div>
          <div className="row gx-3 gy-1 mt-1 small text-muted">
            <div className="col-auto">
              <strong>作成:</strong> {new Date(todo.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
            </div>
            {todo.dueDate && (
              <div className="col-auto">
                <strong>期日:</strong> {new Date(todo.dueDate).toLocaleDateString('ja-JP')}
              </div>
            )}
            {todo.scheduledDate && (
              <div className="col-auto">
                <strong>予定:</strong> {new Date(todo.scheduledDate).toLocaleDateString('ja-JP')}
              </div>
            )}
            {todo.creator && todo.creator !== '未設定' && (
              <div className="col-auto">
                <strong>作成者:</strong> {todo.creator}
              </div>
            )}
            {todo.requester && todo.requester !== '未設定' && (
              <div className="col-auto">
                <strong>依頼先:</strong> {todo.requester}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ボタン部分 */}
      <div className="flex-shrink-0">
        <button onClick={() => onEdit(todo)} className="btn btn-warning btn-sm me-2">
          編集
        </button>
        <button onClick={() => onDelete(todo._id)} className="btn btn-danger btn-sm">
          削除
        </button>
      </div>
    </li>
  );
}

export default TodoItem;