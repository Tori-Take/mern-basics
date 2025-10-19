const User = require('../models/user.model');

/**
 * 指定されたロールを持つユーザーのみアクセスを許可するミドルウェアを生成する。
 * @param {string[]} allowedRoles - アクセスを許可するロールの配列。例: ['editor', 'admin']
 * @returns Expressミドルウェア関数
 */
const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // `auth`ミドルウェアによってセットされたユーザーIDを使用
      const user = await User.findById(req.user.id).select('roles isAdmin');

      if (!user) {
        return res.status(401).json({ message: 'ユーザーが見つかりません。認証が無効です。' });
      }

      // スーパー管理者(isAdmin)は全てのアクセスを許可
      if (user.isAdmin) {
        return next();
      }

      // ユーザーが許可されたロールのいずれかを持っているかチェック
      const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));

      if (hasRequiredRole) {
        next(); // 権限があれば次の処理へ
      } else {
        res.status(403).json({ message: 'この操作を実行する権限がありません。' });
      }
    } catch (err) {
      console.error('認可ミドルウェアでエラーが発生しました。', err);
      res.status(500).send('サーバーエラー');
    }
  };
};

module.exports = authorize;