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
      const newTodo = new Todo({ text: req.body.text });
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
  });

module.exports = router;
