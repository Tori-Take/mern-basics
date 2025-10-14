const router = require('express').Router();
let Todo = require('../models/todo.model');
const auth = require('../middleware/auth'); // 認証ミドルウェアをインポート

// ルートURL ('/todos/') へのGETリクエストを処理します
// 全てのルートに認証ミドルウェアを適用
router.use(auth);

router.get('/', async (req, res) => {
    try {
      // 1. クエリパラメータからソートとフィルタの条件を取得
      const { sort, ...filters } = req.query;

      // 2. フィルタ条件オブジェクトを構築
      const queryFilters = {};
      for (const key in filters) {
        // 空のパラメータは無視する
        if (filters[key]) {
          if (key === 'text') {
            // 'text' フィールドは部分一致・大文字小文字を区別しない検索にする
            queryFilters[key] = { $regex: filters[key], $options: 'i' };
          } else {
            queryFilters[key] = filters[key];
          }
        }
      }

      // ログインしているユーザーのIDを検索条件に追加
      queryFilters.user = req.user.id;

      // 3. Mongooseでクエリを実行
      const todos = await Todo.find(queryFilters)
        .sort(sort || '-createdAt'); // デフォルトは作成日の降順

      res.json(todos);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  });

router.post('/', async (req, res) => {
    try {
      const {
        text,
        priority,
        dueDate,
        scheduledDate,
        tags,
        creator,
        requester,
      } = req.body;

      // 新しいTODOに、ログインしているユーザーのIDを紐付ける
      const newTodo = new Todo({ text, priority, dueDate, scheduledDate, tags, creator, requester, user: req.user.id });
      const savedTodo = await newTodo.save();
      res.status(201).json(savedTodo);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  });

// 特定のIDを持つTODOに対する処理
router.patch('/:id', async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id);
      if (!todo) return res.status(404).json('Error: Todo not found');
      
      todo.completed = !todo.completed;
      const updatedTodo = await todo.save();
      res.json(updatedTodo);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  });

router.delete('/:id', async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id);
      if (!todo) return res.status(404).json({ msg: 'TODOが見つかりません。' });

      // ログインユーザーがTODOの所有者か確認
      if (todo.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: '権限がありません。' });
      }

      await todo.deleteOne();
      res.json('Todo deleted.');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  });

router.put('/:id', async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id);
      if (!todo) return res.status(404).json('Error: Todo not found');

      // リクエストボディから受け取ったデータでTODOドキュメントを更新
      todo.text = req.body.text || todo.text;
      todo.priority = req.body.priority || todo.priority;
      todo.dueDate = req.body.dueDate || todo.dueDate;
      todo.scheduledDate = req.body.scheduledDate || todo.scheduledDate;
      todo.tags = req.body.tags || todo.tags;
      todo.creator = req.body.creator || todo.creator;
      todo.requester = req.body.requester || todo.requester;

      const updatedTodo = await todo.save();
      res.json(updatedTodo);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  });

module.exports = router;
