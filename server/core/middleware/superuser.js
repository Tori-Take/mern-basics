/**
 * @file superuser.js
 * @description Superuser権限を検証するミドルウェア
 */

const superuser = (req, res, next) => {
  // 'auth'ミドルウェアがセットしたreq.userオブジェクトを検証
  // req.user.rolesに'superuser'が含まれているかチェック
  if (req.user && req.user.roles && req.user.roles.includes('superuser')) {
    // 権限があれば、次のミドルウェアまたはAPIルートへ処理を渡す
    next();
  } else {
    // 権限がなければ、403 Forbiddenエラーを返す
    return res
      .status(403)
      .json({ message: 'アクセス権がありません。Superuser権限が必要です。' });
  }
};

module.exports = superuser;
