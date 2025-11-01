import { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート
import { format } from 'date-fns'; // ★ date-fnsからformatをインポート
import { useAuth } from '../../../providers/AuthProvider';
import TodoCreateModal from '../components/TodoCreateModal';
import TodoEditModal from '../components/TodoEditModal';
import TodoFilterSortModal from '../components/TodoFilterSortModal';
import { ListGroup, Badge, Button, Card, Accordion, Form, Alert } from 'react-bootstrap'; // ★ Alertを追加

const API_URL = '/api/todos';

function TodoPage() {
  const { user } = useAuth(); // ★ ログイン中のユーザー情報を取得
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
  const [error, setError] = useState(''); // ★ エラーメッセージを管理するStateを追加

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
        setError('TODOリストの取得に失敗しました。');
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
      setError('TODOの追加に失敗しました。');
      console.error('TODOの追加中にエラーが発生しました:', error);
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      // サーバーに更新をリクエスト
      const response = await axios.patch(`${API_URL}/${id}`);
      const updatedTodo = response.data;

      // 画面の状態を更新
      setTodos(todos.map((todo) => (todo._id === id ? updatedTodo : todo)));
    } catch (error) {
      setError('TODOの完了状態の更新に失敗しました。');
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
        handleCloseEditModal(); // ★ 削除が成功したらモーダルを閉じる
      } catch (error) {
        setError(error.response?.data?.message || 'TODOの削除に失敗しました。');
        console.error('TODOの削除中にエラーが発生しました:', error);
        handleCloseEditModal(); // ★ エラーでもモーダルは閉じる
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
      setError(error.response?.data?.message || 'TODOの編集に失敗しました。');
      console.error('TODOの編集中にエラーが発生しました:', error); // ログは残す
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
      {/* 画面幅に応じてレイアウトを調整 */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center my-4">
        <h2 className="mb-3 mb-md-0">TODOリスト</h2> {/* スマホで下余白、PCで余白なし */}
        {/* ボタンをスマホでは縦に、PCでは横に並べる */}
        <div className="d-grid gap-2 d-md-block">
          <Button
            variant="outline-secondary"
            className="me-md-2" // PCでのみ右マージン
            onClick={() => setIsFilterSortModalOpen(true)}
            size="sm" // ボタンを小さくする
          >
            絞り込み・並び替え
          </Button>
          <Button variant="primary" type="button" onClick={() => setIsCreateModalOpen(true)} size="sm">
            ＋ 新規TODOを追加
          </Button>
        </div>
      </div>

      {/* ★ エラーメッセージ表示用のAlertコンポーネント */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {/* 未完了のTODOリスト */}
      <Card className="mb-4">
        <Card.Header as="h5">未完了 ({incompleteTodos.length})</Card.Header>
        <ListGroup variant="flush">
          {incompleteTodos.length > 0 ? incompleteTodos.map(todo => {
            // ★ このTODOに対する編集権限を判断
            const canEdit = user && (user._id === todo.user?._id || user.roles.includes('admin'));

            return (
              <ListGroup.Item key={todo._id} className="d-flex justify-content-between align-items-center">
                <div>
                  <Form.Check
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo._id)}
                    className="d-inline-block me-3"
                  />
                  <span className={todo.completed ? 'text-muted text-decoration-line-through' : ''}>
                    {todo.text}
                  </span>
                  <div className="text-muted small mt-1">
                    <Badge bg="secondary" pill className="me-2 align-middle">{todo.tenantId?.name || '不明な部署'}</Badge>
                    <span className="me-3"><i className="bi bi-person"></i> 作成者: {todo.user?.username || '不明'}</span>
                    {todo.requester && todo.requester.length > 0 && (
                      <span className="me-3"><i className="bi bi-person-check"></i> 依頼先: {todo.requester.map(r => r.username).join(', ')}</span>
                    )}
                    {todo.dueDate && (
                      <span className="me-3"><i className="bi bi-calendar-check"></i> 期日: {new Date(todo.dueDate).toLocaleDateString()}</span>
                    )}
                    {/* ★ 修正: 開始日時と終了日時を表示 */}
                    {todo.startDateTime && (
                      <span className="me-3"><i className="bi bi-play-circle"></i> 開始: {todo.isAllDay ? format(new Date(todo.startDateTime), 'yyyy/MM/dd') : format(new Date(todo.startDateTime), 'yyyy/MM/dd HH:mm')}</span>
                    )}
                    {todo.endDateTime && (
                      <span className="me-3"><i className="bi bi-stop-circle"></i> 終了: {todo.isAllDay ? format(new Date(todo.endDateTime), 'yyyy/MM/dd') : format(new Date(todo.endDateTime), 'yyyy/MM/dd HH:mm')}</span>
                    )}
                    <span className="me-3"><i className="bi bi-clock"></i> 作成日: {new Date(todo.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleOpenEditModal(todo)}>
                    {canEdit ? '編集' : '詳細'}
                  </Button>
                </div>
              </ListGroup.Item>
            );
          }) : <ListGroup.Item className="text-muted">未完了のTODOはありません。</ListGroup.Item>}
        </ListGroup>
      </Card>

      {/* 完了済みのTODOリスト */}
      <Accordion>
        <Accordion.Item eventKey="0">
          <Accordion.Header>完了済み ({completedTodos.length})</Accordion.Header>
          <Accordion.Body className="p-0">
            <ListGroup variant="flush">
              {completedTodos.length > 0 ? completedTodos.map(todo => (
                <ListGroup.Item key={todo._id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <Form.Check
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo._id)}
                      className="d-inline-block me-3"
                    />
                    <span className="text-muted text-decoration-line-through">
                      {todo.text}
                    </span>
                    <div className="text-muted small mt-1">
                      <Badge bg="secondary" pill className="me-2 align-middle">{todo.tenantId?.name || '不明な部署'}</Badge>
                      <span className="me-3"><i className="bi bi-person"></i> 作成者: {todo.user?.username || '不明'}</span>
                      {todo.requester && todo.requester.length > 0 && (
                        <span className="me-3"><i className="bi bi-person-check"></i> 依頼先: {todo.requester.map(r => r.username).join(', ')}</span>
                      )}
                      {todo.dueDate && (
                        <span className="me-3"><i className="bi bi-calendar-check"></i> 期日: {new Date(todo.dueDate).toLocaleDateString()}</span>
                      )}
                      {/* ★ 修正: 開始日時と終了日時を表示 */}
                      {todo.startDateTime && (
                        <span className="me-3"><i className="bi bi-play-circle"></i> 開始: {todo.isAllDay ? format(new Date(todo.startDateTime), 'yyyy/MM/dd') : format(new Date(todo.startDateTime), 'yyyy/MM/dd HH:mm')}</span>
                      )}
                      {todo.endDateTime && (
                        <span className="me-3"><i className="bi bi-stop-circle"></i> 終了: {todo.isAllDay ? format(new Date(todo.endDateTime), 'yyyy/MM/dd') : format(new Date(todo.endDateTime), 'yyyy/MM/dd HH:mm')}</span>
                      )}
                      <span className="me-3"><i className="bi bi-clock"></i> 作成: {new Date(todo.createdAt).toLocaleDateString()}</span>
                      {todo.completedBy && (
                        <span className="me-3 text-success"><i className="bi bi-check-circle-fill"></i> 完了: {todo.completedBy.username} ({new Date(todo.completedAt).toLocaleDateString()})</span>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              )) : <ListGroup.Item className="text-muted">完了済みのTODOはありません。</ListGroup.Item>}
            </ListGroup>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

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
        onDelete={handleDelete}
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
