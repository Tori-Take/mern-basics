/**
 * @file admin.js
 * @description 管理者(admin)権限を検証するミドルウェア
 */
const admin = (req, res, next) => {
  // 'auth'ミドルウェアがセットしたreq.userオブジェクトを検証
  if (req.user && req.user.roles.includes('admin')) {
    next();
  } else {
    res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

module.exports = admin;
