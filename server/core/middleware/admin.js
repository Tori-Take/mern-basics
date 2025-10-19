// server/middleware/admin.js

const User = require('../../domains/identity/user.model');

const admin = async (req, res, next) => {
  try {
    // 既存の 'auth' ミドルウェアによって req.user.id がセットされていることが前提
    const user = await User.findById(req.user.id);

    // ユーザーが存在し、かつ roles 配列に 'admin' が含まれているかをチェック
    if (user && user.roles.includes('admin')) {
      // 管理者であれば、リクエストされたAPIの処理へ進む
      next();
    } else {
      // 管理者でなければ、403 Forbidden エラーを返す
      return res.status(403).json({ message: 'アクセス権がありません。管理者権限が必要です。' });
    }
  } catch (err) {
    console.error('管理者認証ミドルウェアでエラーが発生しました。', err);
    res.status(500).send('サーバーエラー');
  }
};

module.exports = admin;
