const router = require('express').Router();
const Todo = require('../models/todo.model');
const auth = require('../middleware/auth'); // 認証ミドルウェアをインポート

// --- すべてのTODO APIを認証ミドルウェアで保護 ---
router.use(auth);

/**
 * @route   GET /api/todos
 * @desc    ログインユーザーのテナントに所属するTODOを全て取得
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // req.user は認証ミドルウェアによって設定される
    const todos = await Todo.find({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 }); // 作成日が新しい順にソート
    res.json(todos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   POST /api/todos
 * @desc    新しいTODOを作成する
 * @access  Private
 */
router.post('/', async (req, res) => {
  const { text, priority, dueDate, scheduledDate, tags } = req.body;

  try {
    const newTodo = new Todo({
      ...req.body,
      tenantId: req.user.tenantId, // ★ 自動で自テナントのIDを付与
      user: req.user.id,           // ★ 作成者としてログインユーザーのIDを記録
    });

    const todo = await newTodo.save();
    res.status(201).json(todo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   PUT /api/todos/:id
 * @desc    特定のTODOを更新する
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // ★ IDとテナントIDの両方で検索し、他テナントのデータを操作できないようにする
    let todo = await Todo.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!todo) {
      return res.status(404).json({ message: 'TODOが見つかりません。' });
    }

    // リクエストボディの内容でTODOを更新
    todo = await Todo.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });

    res.json(todo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   DELETE /api/todos/:id
 * @desc    特定のTODOを削除する
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // ★ IDとテナントIDの両方で検索し、他テナントのデータを操作できないようにする
    const todo = await Todo.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!todo) {
      return res.status(404).json({ message: 'TODOが見つかりません。' });
    }

    await Todo.findByIdAndDelete(req.params.id);

    res.json({ message: 'TODOが削除されました。' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

module.exports = router;
