/**
 * 指定されたロールのいずれかを持つユーザーのみアクセスを許可するミドルウェアを生成する。
 * @param  {...string} allowedRoles - アクセスを許可するロールのリスト
 * @returns {function} Expressミドルウェア関数
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: '権限情報がありません。' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ message: 'この操作を実行する権限がありません。' });
    }

    next();
  };
};

module.exports = { authorize };
