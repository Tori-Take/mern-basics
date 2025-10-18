import { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート
import TodoList from '../TodoList';
import TodoCreateModal from '../TodoCreateModal';
import TodoEditModal from '../TodoEditModal';
import TodoFilterSortModal from '../TodoFilterSortModal';

const API_URL = '/api/todos';

function TodoPage() {
  const [todos, setTodos] = useState([]); // 初期値は空の配列にする
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null); // 編集対象のTODOを保持
  const [isCompletedListOpen, setIsCompletedListOpen] = useState(false); // 完了済みリストの開閉状態
  const [isFilterSortModalOpen, setIsFilterSortModalOpen] = useState(false); // 絞り込みモーダルの開閉状態
  // 絞り込みとソートの状態を管理
  const [queryOptions, setQueryOptions] = useState({
    sort: '-createdAt',
    priority: '',
    tags: '',
    creator: '',
    requester: '',
    text: '',
  });

  useEffect(() => {
    document.title = 'My TODO App';

    // サーバーからTODOリストを取得する
    const fetchTodos = async () => {
      // クエリパラメータを生成
      const params = new URLSearchParams(queryOptions).toString();
      try {
        // APIリクエスト時にクエリパラメータを付与
        const response = await axios.get(`${API_URL}?${params}`);
        setTodos(response.data); // 取得したデータでStateを更新
      } catch (error) {
        console.error('TODOリストの取得中にエラーが発生しました:', error);
      }
    };

    fetchTodos();
  }, [queryOptions]); // queryOptionsが変更されたら再取得

  const handleAddTodo = async (todoData) => {
    try {
      const response = await axios.post(API_URL, todoData);
      const newTodo = response.data; // サーバーから返された新しいTODOオブジェクト

      setTodos([...todos, newTodo]);
      setIsCreateModalOpen(false); // 成功したらモーダルを閉じる
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

  // 編集モーダルを開く処理
  const handleOpenEditModal = (todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };

  // 編集内容を保存する処理
  const handleSaveEdit = async (id, todoData) => {
    try {
      // サーバーに更新をリクエスト
      const response = await axios.put(`${API_URL}/${id}`, todoData);
      const updatedTodo = response.data;

      // 画面の状態を更新
      setTodos(
        todos.map((todo) => (todo._id === id ? updatedTodo : todo))
      );
      setIsEditModalOpen(false); // 成功したらモーダルを閉じる
    } catch (error) {
      console.error('TODOの編集中にエラーが発生しました:', error);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTodo(null);
  };

  // 絞り込み・並び替えを適用する処理
  const handleApplyFilterSort = (options) => {
    setQueryOptions(options);
    setIsFilterSortModalOpen(false);
  };

  // 1. todos配列を未完了と完了済みにフィルタリング
  const incompleteTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <>
      <div className="d-flex justify-content-between my-4">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setIsFilterSortModalOpen(true)}
        >
          絞り込み・並び替え
        </button>
        <button className="btn btn-primary" type="button" onClick={() => setIsCreateModalOpen(true)}>
          ＋ 新規TODOを追加
        </button>
      </div>

      {/* 2. 未完了のTODOリスト */}
      <h5 className="mt-4">未完了のTODO</h5>
      <TodoList todos={incompleteTodos} onToggle={handleToggleComplete} onDelete={handleDelete} onEdit={handleOpenEditModal} />

      {/* 3. 完了済みのTODOリスト（アコーディオン） */}
      <div className="mt-4">
        <button
          className="btn btn-secondary w-100"
          type="button"
          onClick={() => setIsCompletedListOpen(!isCompletedListOpen)}
        >
          完了済みのTODO ({completedTodos.length}件) {isCompletedListOpen ? '▲ 閉じる' : '▼ 開く'}
        </button>
        <div className={`collapse ${isCompletedListOpen ? 'show' : ''}`}>
          <TodoList todos={completedTodos} onToggle={handleToggleComplete} onDelete={handleDelete} onEdit={handleOpenEditModal} />
        </div>
      </div>

      <TodoCreateModal
        show={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdd={handleAddTodo}
      />

      <TodoEditModal
        show={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        todo={editingTodo}
      />

      <TodoFilterSortModal
        show={isFilterSortModalOpen}
        onClose={() => setIsFilterSortModalOpen(false)}
        onApply={handleApplyFilterSort}
        currentOptions={queryOptions}
      />
    </>
  );
}

export default TodoPage;
