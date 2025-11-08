const canManageHiyari = (req, res, next) => {
  // ユーザー情報がない、またはrolesがない場合は権限なし
  if (!req.user || !req.user.roles) {
    return res.status(403).json({ message: 'この操作を実行する権限がありません。' });
  }

  const { roles } = req.user;

  // 'hiyari-admin' ロールを持っているかチェック
  if (roles.includes('hiyari-admin')) {
    return next(); // 権限があれば次のミドルウェアへ
  }

  // 権限がなければ403エラー
  return res.status(403).json({ message: 'ヒヤリ-Naviの管理権限がありません。' });
};

module.exports = canManageHiyari;