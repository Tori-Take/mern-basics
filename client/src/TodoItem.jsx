import React from 'react';

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li
      className="list-group-item d-flex justify-content-between align-items-center"
    >
      <span
        onClick={() => onToggle(todo._id)}
        style={{
          textDecoration: todo.completed ? 'line-through' : 'none',
          cursor: 'pointer',
          flexGrow: 1,
        }}
      >
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo._id)}
        className="btn btn-danger btn-sm"
      >
        削除
      </button>
    </li>
  );
}

export default TodoItem;