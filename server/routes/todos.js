const router = require('express').Router();
let Todo = require('../models/todo.model');

// ルートURL ('/todos/') へのGETリクエストを処理します
router.route('/')
  .get(async (req, res) => {
    try {
      const todos = await Todo.find();
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
