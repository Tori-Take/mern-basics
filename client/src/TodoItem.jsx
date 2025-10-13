import React, { useState } from 'react';

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    if (!isEditing) {
      setIsEditing(true);
    } else {
      // 保存処理
      if (editText.trim()) {
        onEdit(todo._id, editText);
        setIsEditing(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(todo.text); // 編集をキャンセルして元のテキストに戻す
    }
  };

  return (
    <li className="list-group-item d-flex align-items-center gap-3">
      {/* チェックボックス */}
      <input
        type="checkbox"
        className="form-check-input flex-shrink-0"
        checked={todo.completed}
        onChange={() => onToggle(todo._id)}
      />

      {/* テキストまたは入力欄（スペースをすべて使う） */}
      <div className="flex-grow-1">
        {isEditing ? (
          <input
            type="text"
            className="form-control form-control-sm"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleEdit}
            autoFocus
          />
        ) : (
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
        )}
      </div>

      {/* ボタン部分 */}
      <div className="flex-shrink-0">
        <button onClick={handleEdit} className="btn btn-warning btn-sm me-2">
          {isEditing ? '保存' : '編集'}
        </button>
        <button onClick={() => onDelete(todo._id)} className="btn btn-danger btn-sm">
          削除
        </button>
      </div>
    </li>
  );
}

export default TodoItem;