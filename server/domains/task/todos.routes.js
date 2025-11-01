const router = require('express').Router();
const Todo = require('./todo.model');
const Tenant = require('../organization/tenant.model'); // ★ Tenantモデルをインポート
const Notification = require('../notifications/notification.model'); // ★ Notificationモデルをインポート
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

    // ★★★ 通知生成ロジック (新規作成時) ★★★
    if (todo.requester && todo.requester.length > 0) {
      const notifications = todo.requester.map(requesterUser => ({
        recipient: requesterUser._id,
        sender: req.user.id,
        sourceApplication: 'CAN_USE_TODO',
        type: 'TASK_ASSIGNED',
        message: `${req.user.username}さんからタスク「${todo.text}」を依頼されました。`,
        link: `/todos?todoId=${todo._id}`, // ★ リンクにタスクIDを追加
      }));
      // 非同期で通知をDBに保存（APIのレスポンスを待たせない）
      Notification.insertMany(notifications).catch(err => {
        console.error('通知の作成に失敗しました:', err);
      });
    }

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

    // ★★★ ここからが「タスク完了」通知の生成ロジック ★★★
    // 1. タスクが「完了」状態になった場合のみ処理を実行
    if (updatedTodo.completed) {
      // 2. 通知の宛先リストを作成 (依頼元 + 他の依頼先)
      const recipientIds = new Set();
      // 2a. 依頼元(タスク作成者)を追加
      if (updatedTodo.user) {
        recipientIds.add(updatedTodo.user._id.toString());
      }
      // 2b. 依頼先リストを追加
      if (updatedTodo.requester && updatedTodo.requester.length > 0) {
        updatedTodo.requester.forEach(user => recipientIds.add(user._id.toString()));
      }
      // 2c. 自分自身への通知は除外
      recipientIds.delete(req.user.id);

      // 3. 通知データを作成
      const notifications = Array.from(recipientIds).map(recipientId => ({
        recipient: recipientId,
        sender: req.user.id,
        sourceApplication: 'CAN_USE_TODO',
        type: 'TASK_COMPLETED', // ★ 新しい通知タイプ
        message: `${req.user.username}さんが、タスク「${updatedTodo.text}」を完了しました。`,
        link: `/todos?todoId=${updatedTodo._id}`,
      }));

      // 4. 非同期でDBに保存
      if (notifications.length > 0) {
        Notification.insertMany(notifications).catch(err => console.error('完了通知の作成に失敗:', err));
      }
    }
    // ★★★ ここまで ★★★

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
    // ★ 通知生成のため、更新前のTODO情報を取得
    const originalTodo = await Todo.findById(req.params.id).lean();

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
    
    // ★★★ 通知生成ロジック (更新時) ★★★
    if (originalTodo && updatedTodo) {
      // --- 1. タスク内容の変更通知 ---
      const changes = [];
      if (originalTodo.text !== updatedTodo.text) {
        changes.push('内容');
      }
      const oldDueDate = originalTodo.dueDate ? new Date(originalTodo.dueDate).toISOString() : null;
      const newDueDate = updatedTodo.dueDate ? new Date(updatedTodo.dueDate).toISOString() : null;
      if (oldDueDate !== newDueDate) {
        changes.push(`期日が「${updatedTodo.dueDate ? new Date(updatedTodo.dueDate).toLocaleDateString('ja-JP') : '未設定'}」に`);
      }

      // ★★★ ここからが「予定時刻」変更の検知ロジック ★★★
      if (originalTodo.isAllDay !== updatedTodo.isAllDay) {
        changes.push(updatedTodo.isAllDay ? '終日タスクに' : '時間指定タスクに');
      }

      const oldStartDateTime = originalTodo.startDateTime ? new Date(originalTodo.startDateTime).toISOString() : null;
      const newStartDateTime = updatedTodo.startDateTime ? new Date(updatedTodo.startDateTime).toISOString() : null;
      if (oldStartDateTime !== newStartDateTime) {
        const dateStr = updatedTodo.startDateTime
          ? updatedTodo.isAllDay ? new Date(updatedTodo.startDateTime).toLocaleDateString('ja-JP') : new Date(updatedTodo.startDateTime).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
          : '未設定';
        changes.push(`開始日時が「${dateStr}」に`);
      }

      const oldEndDateTime = originalTodo.endDateTime ? new Date(originalTodo.endDateTime).toISOString() : null;
      const newEndDateTime = updatedTodo.endDateTime ? new Date(updatedTodo.endDateTime).toISOString() : null;
      if (oldEndDateTime !== newEndDateTime) {
        const dateStr = updatedTodo.endDateTime
          ? updatedTodo.isAllDay ? new Date(updatedTodo.endDateTime).toLocaleDateString('ja-JP') : new Date(updatedTodo.endDateTime).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
          : '未設定';
        changes.push(`終了日時が「${dateStr}」に`);
      }
      // ★★★ ここまで ★★★

      if (changes.length > 0) {
        const recipientIds = new Set([
          updatedTodo.user?._id.toString(),
          ...updatedTodo.requester.map(user => user._id.toString())
        ].filter(Boolean));
        recipientIds.delete(req.user.id); // 操作者自身は除く

        const updateMessage = changes.join('、') + '変更されました。';
        const updateNotifications = Array.from(recipientIds).map(recipientId => ({
          recipient: recipientId,
          sender: req.user.id,
          sourceApplication: 'CAN_USE_TODO',
          type: 'TASK_UPDATED',
          message: `${req.user.username}さんが、タスク「${updatedTodo.text}」の${updateMessage}`,
          link: `/todos?todoId=${updatedTodo._id}`,
        }));
        if (updateNotifications.length > 0) {
          Notification.insertMany(updateNotifications).catch(err => console.error('更新通知の作成に失敗:', err));
        }
      }

      // --- 2. 依頼先メンバーの変更通知 ---
      const oldRequesterIds = new Set(originalTodo.requester.map(id => id.toString()));
      const newRequesterIds = new Set(updatedTodo.requester.map(user => user._id.toString()));

      const added = [...newRequesterIds].filter(id => !oldRequesterIds.has(id));
      const removed = [...oldRequesterIds].filter(id => !newRequesterIds.has(id));
      const remaining = [...oldRequesterIds].filter(id => newRequesterIds.has(id));

      if (added.length > 0) {
        const assignedNotifications = added.map(requesterId => ({
          recipient: requesterId,
          sender: req.user.id,
          sourceApplication: 'CAN_USE_TODO',
          type: 'TASK_ASSIGNED',
          message: `${req.user.username}さんからタスク「${updatedTodo.text}」を依頼されました。`,
          link: `/todos?todoId=${updatedTodo._id}`,
        }));
        Notification.insertMany(assignedNotifications).catch(err => console.error('依頼通知の作成に失敗:', err));
      }

      if (removed.length > 0) {
        const unassignedNotifications = removed.map(requesterId => ({
          recipient: requesterId,
          sender: req.user.id,
          sourceApplication: 'CAN_USE_TODO',
          type: 'TASK_UNASSIGNED',
          message: `タスク「${updatedTodo.text}」の依頼から外れました。`,
          link: `/todos?todoId=${updatedTodo._id}`,
        }));
        Notification.insertMany(unassignedNotifications).catch(err => console.error('依頼解除通知の作成に失敗:', err));
      }

      if (added.length > 0 || removed.length > 0) {
        const memberChangeRecipients = new Set([...remaining, updatedTodo.user?._id.toString()].filter(Boolean));
        memberChangeRecipients.delete(req.user.id);
        const memberChangeNotifications = Array.from(memberChangeRecipients).map(recipientId => ({
          recipient: recipientId,
          sender: req.user.id,
          sourceApplication: 'CAN_USE_TODO',
          type: 'TASK_MEMBER_CHANGED',
          message: `${req.user.username}さんがタスク「${updatedTodo.text}」の依頼メンバーを変更しました。`,
          link: `/todos?todoId=${updatedTodo._id}`,
        }));
        if (memberChangeNotifications.length > 0) {
          Notification.insertMany(memberChangeNotifications).catch(err => console.error('メンバー変更通知の作成に失敗:', err));
        }
      }
    }
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

    // ★★★ ここからが「タスク削除」通知の生成ロジック ★★★
    // 1. 通知の宛先リストを作成 (依頼元 + 依頼先)
    const recipientIds = new Set();
    // 1a. 依頼元(タスク作成者)を追加
    if (todo.user) {
      recipientIds.add(todo.user.toString());
    }
    // 1b. 依頼先リストを追加
    if (todo.requester && todo.requester.length > 0) {
      todo.requester.forEach(userId => recipientIds.add(userId.toString()));
    }
    // 1c. 自分自身への通知は除外
    recipientIds.delete(req.user.id);

    // 2. 通知データを作成
    const notifications = Array.from(recipientIds).map(recipientId => ({
      recipient: recipientId,
      sender: req.user.id,
      sourceApplication: 'CAN_USE_TODO',
      type: 'TASK_DELETED', // ★ 新しい通知タイプ
      message: `${req.user.username}さんが、タスク「${todo.text}」を削除しました。`,
      // 削除されたタスクへのリンクは不要なため、linkは設定しない
    }));

    // 3. 非同期でDBに保存
    if (notifications.length > 0) {
      Notification.insertMany(notifications).catch(err => console.error('削除通知の作成に失敗:', err));
    }
    // ★★★ ここまで ★★★

    await Todo.findByIdAndDelete(req.params.id);

    res.json({ message: 'TODOが削除されました。' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

module.exports = router;
