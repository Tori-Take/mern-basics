import { useState, useEffect } from 'react';

function App() {
  // 1. フォームの入力値を管理するためのState
  const [inputValue, setInputValue] = useState('');
  // 2. TODOリスト全体を管理するためのState
  const [todos, setTodos] = useState([
    { id: 1, text: 'Reactの学習', completed: false },
  ]);

  // 3. コンポーネントが最初に表示された時に一度だけ実行される副作用
  useEffect(() => {
    console.log('TODOアプリがマウントされました。');
    document.title = 'My TODO App';
  }, []); // 依存配列が空なので、初回の一度だけ実行

  // 4. フォームが送信されたときの処理
  const handleSubmit = (e) => {
    e.preventDefault(); // フォーム送信時のリロードを防止

    if (!inputValue.trim()) return; // 入力が空、またはスペースだけの場合は何もしない

    // 4a. 新しいTODOオブジェクトを作成
    const newTodo = {
      id: Date.now(), // ユニークなIDとして現在時刻のタイムスタンプを使用
      text: inputValue,
      completed: false, // 新しいTODOは常に未完了で作成
    };

    // 4b. todosリストの末尾に新しいTODOを追加 (不変性を保つ)
    setTodos([...todos, newTodo]);

    setInputValue(''); // 入力フォームを空にする
  };

  // 5. TODOの完了状態を切り替える処理
  const handleToggleComplete = (id) => {
    console.log(`TODO ID ${id} の完了状態を切り替えます。`);
    setTodos(
      todos.map((todo) =>
        // IDが一致するTODOを見つけたら、completedプロパティを反転させる
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div>
      <h1>My TODO App</h1>
      {/* TODO追加フォーム */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          placeholder="新しいTODOを入力"
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit">追加</button>
      </form>

      {/* 6. TODOリストの表示 */}
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleComplete(todo.id)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
