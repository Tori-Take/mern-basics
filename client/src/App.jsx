import { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート

const API_URL = '/todos';

function App() {
  // 1. フォームの入力値を管理するためのState
  const [inputValue, setInputValue] = useState('');
  // 2. TODOリスト全体を管理するためのState
  const [todos, setTodos] = useState([]); // 初期値は空の配列にする

  // 3. コンポーネントが最初に表示された時に一度だけ実行される副作用
  useEffect(() => {
    document.title = 'My TODO App';

    // サーバーからTODOリストを取得する
    const fetchTodos = async () => {
      try {
        const response = await axios.get(API_URL);
        setTodos(response.data); // 取得したデータでStateを更新
      } catch (error) {
        console.error('TODOリストの取得中にエラーが発生しました:', error);
      }
    };

    fetchTodos();
  }, []); // 依存配列が空なので、初回の一度だけ実行

  // 4. フォームが送信されたときの処理
  const handleSubmit = async (e) => {
    e.preventDefault(); // フォーム送信時のリロードを防止

    if (!inputValue.trim()) return; // 入力が空、またはスペースだけの場合は何もしない

    try {
      // 4a. サーバーに新しいTODOの作成をリクエスト
      const response = await axios.post(API_URL, { text: inputValue });
      const newTodo = response.data; // サーバーから返された新しいTODOオブジェクト

      // 4b. 画面のリストに新しいTODOを追加
      setTodos([...todos, newTodo]);

      setInputValue(''); // 入力フォームを空にする
    } catch (error) {
      console.error('TODOの追加中にエラーが発生しました:', error);
    }
  };

  // 5. TODOの完了状態を切り替える処理
  const handleToggleComplete = async (id) => {
    try {
      // サーバーに更新をリクエスト
      await axios.patch(`${API_URL}/${id}`);

      // 画面の状態を更新
      setTodos(
        todos.map((todo) =>
          // IDが一致するTODOを見つけたら、completedプロパティを反転させる
          todo._id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
    } catch (error) {
      console.error('TODOの更新中にエラーが発生しました:', error);
    }
  };

  // 7. TODOを削除する処理
  const handleDelete = async (id) => {
    // 確認ダイアログを表示
    if (window.confirm('本当にこのTODOを削除しますか？')) {
      try {
        // サーバーに削除をリクエスト
        await axios.delete(`${API_URL}/${id}`);

        // 画面の状態を更新
        setTodos(todos.filter((todo) => todo._id !== id));
      } catch (error) {
        console.error('TODOの削除中にエラーが発生しました:', error);
      }
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <h1 className="text-center mb-4">My TODO App</h1>
      {/* TODO追加フォーム */}
      <form onSubmit={handleSubmit} className="d-flex mb-4">
        <input
          type="text"
          value={inputValue}
          placeholder="新しいTODOを入力"
          onChange={(e) => setInputValue(e.target.value)}
          className="form-control me-2"
        />
        <button type="submit" className="btn btn-primary">追加</button>
      </form>

      {/* 6. TODOリストの表示 */}
      <ul className="list-group">
        {todos.map((todo) => (
          <li
            key={todo._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span
              onClick={() => handleToggleComplete(todo._id)}
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                cursor: 'pointer',
                flexGrow: 1,
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => handleDelete(todo._id)}
              className="btn btn-danger btn-sm"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
