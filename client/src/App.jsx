import { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート
import TodoForm from './TodoForm';
import TodoList from './TodoList';

const API_URL = '/todos';

function App() {
  const [todos, setTodos] = useState([]); // 初期値は空の配列にする

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

  const handleAddTodo = async (text) => {
    try {
      const response = await axios.post(API_URL, { text });
      const newTodo = response.data; // サーバーから返された新しいTODOオブジェクト

      setTodos([...todos, newTodo]);
    } catch (error) {
      console.error('TODOの追加中にエラーが発生しました:', error);
    }
  };

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

  const handleEditTodo = async (id, newText) => {
    try {
      // サーバーに更新をリクエスト
      const response = await axios.put(`${API_URL}/${id}`, { text: newText });
      const updatedTodo = response.data;

      // 画面の状態を更新
      setTodos(
        todos.map((todo) => (todo._id === id ? updatedTodo : todo))
      );
    } catch (error) {
      console.error('TODOの編集中にエラーが発生しました:', error);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <h1 className="text-center mb-4">My TODO App</h1>
      <TodoForm onAdd={handleAddTodo} />
      <TodoList todos={todos} onToggle={handleToggleComplete} onDelete={handleDelete} onEdit={handleEditTodo} />
    </div>
  );
}

export default App;
