const router = require('express').Router();
const Todo = require('./todo.model');
const Tenant = require('../organization/tenant.model'); // ★ Tenantモデルをインポート
const mongoose = require('mongoose'); // ★ Mongooseをインポート
const auth = require('../../core/middleware/auth'); // 認証ミドルウェアをインポート // No change needed here, it was correct
const { getAccessibleTenantIds } = require('../../core/services/permissionService'); // No change needed here, it was correct

// --- すべてのTODO APIを認証ミドルウェアで保護 ---
router.use(auth);

/**
 * @route   GET /api/todos
 * @desc    ログインユーザーのテナントに所属するTODOを全て取得
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    let todos;

    // ユーザーが管理者ロールを持っているかチェック
    if (req.user.roles.includes('admin')) {
      // 管理者の場合、配下の全テナントIDを取得
      const accessibleTenantIds = await getAccessibleTenantIds(req.user);
      // アクセス可能なテナントに所属するTODOを全て取得
      todos = await Todo.find({ tenantId: { $in: accessibleTenantIds } })
        .populate('tenantId', 'name')
        .populate('user', 'username')
        .populate('requester', 'username')
        .populate('completedBy', 'username') // ★ 完了者名を取得
        .sort({ createdAt: -1 });
    } else {
      // 一般ユーザーの場合、自分が作成者か依頼先に含まれるTODOのみ取得
      todos = await Todo.find({
        $or: [
          { user: req.user.id }, // 自分が作成者
          { requester: req.user.id } // 自分が依頼先リストに含まれる
        ]
      })
        .populate('tenantId', 'name')
        .populate('user', 'username')
        .populate('requester', 'username')
        .populate('completedBy', 'username') // ★ 完了者名を取得
        .sort({ createdAt: -1 });
    }

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
  const { text, priority, dueDate, startDateTime, endDateTime, tags, requester, creator } = req.body;

  try {
    const newTodo = new Todo({
      ...req.body,
      tenantId: req.user.tenantId, // ★ 自動で自テナントのIDを付与
      user: req.user.id,           // ★ 作成者としてログインユーザーのIDを記録
    });
    // requesterが空文字列の場合はnullを設定し、それ以外は設定
    if (!requester) newTodo.requester = null;

    let todo = await newTodo.save();
    // ★ フロントエンドに返す直前に、関連データをpopulateする
    todo = await todo.populate([
      { path: 'user', select: 'username' },
      { path: 'tenantId', select: 'name' },
      { path: 'requester', select: 'username' }
    ]);
    res.status(201).json(todo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   PATCH /api/todos/:id
 * @desc    特定のTODOの完了状態を切り替える
 * @access  Private
 */
router.patch('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'TODOが見つかりません。' });
    }

    // --- 権限チェック ---
    // 完了状態の切り替えは、編集権限と同じロジックを適用します
    const isCreator = todo.user.toString() === req.user.id;
    const isRequester = todo.requester.some(id => id.equals(req.user.id)); // ★ 自分が依頼先に含まれているか
    let isAdminAllowed = false;
    if (req.user.roles.includes('admin')) {
      const accessibleTenantIds = await getAccessibleTenantIds(req.user);
      isAdminAllowed = accessibleTenantIds.some(id => id.equals(todo.tenantId));
    }

    if (!isCreator && !isAdminAllowed && !isRequester) { // ★ isRequesterもチェック
      return res.status(403).json({ message: 'このTODOを操作する権限がありません。' });
    }

    todo.completed = !todo.completed;

    // 完了状態に応じて、完了者と完了日時を記録・リセットする
    if (todo.completed) {
      // タスクが完了になった場合
      todo.completedBy = req.user.id; // 操作したユーザーのIDを記録
      todo.completedAt = new Date();   // 現在の日時を記録
    } else {
      // タスクが未完了に戻された場合
      todo.completedBy = null; // 記録をリセット
      todo.completedAt = null; // 記録をリセット
    }

    await todo.save();

    // ★ 更新後のTODOを、関連情報を含めて再取得して返す
    const updatedTodo = await Todo.findById(todo._id)
      .populate('tenantId', 'name')
      .populate('user', 'username')
      .populate('requester', 'username')
      .populate('completedBy', 'username');

    res.json(updatedTodo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

/**
 * @route   PUT /api/todos/:id
 * @desc    特定のTODOを更新する
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'TODOが見つかりません。' });
    }

    // --- 権限チェック ---
    const isCreator = todo.user.toString() === req.user.id;
    let isAdminAllowed = false;
    if (req.user.roles.includes('admin')) {
      const accessibleTenantIds = await getAccessibleTenantIds(req.user);
      isAdminAllowed = accessibleTenantIds.some(id => id.equals(todo.tenantId));
    }

    if (!isCreator && !isAdminAllowed) {
      return res.status(403).json({ message: 'このTODOを編集する権限がありません。' });
    }

    const updateData = { ...req.body };
    // requesterが空文字列で送られてきた場合、nullに変換してDBに保存する
    if (updateData.requester === '') {
      updateData.requester = null;
    }

    // リクエストボディの内容でTODOを更新
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true })
      .populate('tenantId', 'name')
      .populate('user', 'username')
      .populate('requester', 'username');

    res.json(updatedTodo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

/**
 * @route   DELETE /api/todos/:id
 * @desc    特定のTODOを削除する
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'TODOが見つかりません。' });
    }

    // --- 権限チェック ---
    const isCreator = todo.user.toString() === req.user.id;
    let isAdminAllowed = false;
    if (req.user.roles.includes('admin')) {
      const accessibleTenantIds = await getAccessibleTenantIds(req.user);
      isAdminAllowed = accessibleTenantIds.some(id => id.equals(todo.tenantId));
    }

    if (!isCreator && !isAdminAllowed) {
      return res.status(403).json({ message: 'このTODOを削除する権限がありません。' });
    }

    await Todo.findByIdAndDelete(req.params.id);

    res.json({ message: 'TODOが削除されました。' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

module.exports = router;
