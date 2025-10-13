import React, { useState } from 'react';

function TodoForm({ onAdd }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onAdd(inputValue);
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex mb-4">
      <input
        type="text"
        value={inputValue}
        placeholder="新しいTODOを入力"
        onChange={(e) => setInputValue(e.target.value)}
        className="form-control me-2"
      />
      <button type="submit" className="btn btn-primary flex-shrink-0">
        追加
      </button>
    </form>
  );
}

export default TodoForm;