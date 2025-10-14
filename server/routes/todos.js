const router = require('express').Router();
let Todo = require('../models/todo.model');

// ルートURL ('/todos/') へのGETリクエストを処理します
router.route('/')
  .get(async (req, res) => {
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

      // 3. Mongooseでクエリを実行
      const todos = await Todo.find(queryFilters)
        .sort(sort || '-createdAt'); // デフォルトは作成日の降順

      res.json(todos);
    } catch (err) {
      res.status(400).json('Error: ' + err);
    }
  })
  .post(async (req, res) => {
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

      const newTodo = new Todo({ text, priority, dueDate, scheduledDate, tags, creator, requester });
      const savedTodo = await newTodo.save();
      res.status(201).json(savedTodo);
    } catch (err) {
      res.status(400).json('Error: ' + err);
    }
  });

// 特定のIDを持つTODOに対する処理
router.route('/:id')
  // 特定のIDを持つTODOを更新する (PATCH /todos/:id)
  .patch(async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id);
      if (!todo) return res.status(404).json('Error: Todo not found');
      
      todo.completed = !todo.completed;
      const updatedTodo = await todo.save();
      res.json(updatedTodo);
    } catch (err) {
      res.status(400).json('Error: ' + err);
    }
  })
  // 特定のIDを持つTODOを削除する (DELETE /todos/:id)
  .delete(async (req, res) => {
    try {
      await Todo.findByIdAndDelete(req.params.id);
      res.json('Todo deleted.');
    } catch (err) {
      res.status(400).json('Error: ' + err);
    }
  })
  // 特定のIDを持つTODOのテキストを更新する (PUT /todos/:id)
  .put(async (req, res) => {
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
      res.status(400).json('Error: ' + err);
    }
  });

module.exports = router;
