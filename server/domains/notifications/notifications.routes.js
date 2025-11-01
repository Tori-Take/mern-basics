const router = require('express').Router();
const auth = require('../../core/middleware/auth');
const Notification = require('./notification.model');
const Todo = require('../task/todo.model'); // ★ Todoモデルをインポート

// --- このドメインの全てのAPIは、ログインが必須 ---
router.use(auth);

/**
 * @route   GET /api/notifications
 * @desc    ログインユーザーの通知一覧を取得する (新しい順)
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'username') // 送信者のユーザー名を取得
      .sort({ createdAt: -1 }); // 新しい順にソート
    res.json(notifications);
  } catch (err) {
    console.error('通知一覧の取得エラー:', err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    ログインユーザーの未読通知件数を取得する
 * @access  Private
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    console.error('未読件数の取得エラー:', err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    特定の通知を既読にする
 * @access  Private
 */
router.patch('/:id/read', async (req, res) => {
  try {
    // ★ 修正: findOneAndUpdateではなく、まずfindで見つける
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id }, // 自分宛の通知のみを対象
      { isRead: true },
      { new: true } // 更新後のドキュメントを返す
    ).populate('sender', 'username'); // ★ 通知生成のためにsender情報を取得

    if (!notification) {
      return res.status(404).json({ message: '通知が見つからないか、操作する権限がありません。' });
    }

    // ★★★ ここからが「既読確認」通知の生成ロジック ★★★
    // 1. 既読にした通知が「タスク依頼」であり、かつ依頼主が存在する場合
    if (notification.type === 'TASK_ASSIGNED' && notification.sender && notification.link) {
      // 2. リンクからタスクIDを抽出
      const urlParams = new URLSearchParams(notification.link.split('?')[1]);
      const todoId = urlParams.get('todoId');
      let taskText = 'あるタスク'; // デフォルトのテキスト

      if (todoId) {
        const todo = await Todo.findById(todoId).select('text').lean();
        if (todo) {
          taskText = `タスク「${todo.text}」`;
        }
      }

      // 3. 新しい「既読確認」通知を作成
      const readReceiptNotification = new Notification({
        recipient: notification.sender._id, // 宛先は、元の通知の送り主
        sender: req.user.id, // 送り主は、今操作しているユーザー
        sourceApplication: 'CAN_USE_TODO',
        type: 'TASK_READ', // ★ 新しい通知タイプ（後でモデルに追加）
        message: `${req.user.username}さんが、${taskText}の依頼を確認しました。`, // ★ 具体的なメッセージに変更
        link: notification.link, // 元の通知と同じリンク先
      });
      // 4. 非同期でDBに保存（APIレスポンスを待たせない）
      readReceiptNotification.save().catch(err => console.error('既読通知の作成に失敗:', err));
    }
    // ★★★ ここまで ★★★

    res.json(notification);
  } catch (err) {
    console.error('通知の既読化エラー:', err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   POST /api/notifications/read-all
 * @desc    ログインユーザーの全ての未読通知を既読にする
 * @access  Private
 */
router.post('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: '全ての通知を既読にしました。' });
  } catch (err) {
    console.error('全件既読化エラー:', err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

module.exports = router;