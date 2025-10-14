const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // 1. リクエストヘッダーからトークンを取得
  const token = req.header('x-auth-token');

  // 2. トークンがない場合はアクセスを拒否
  if (!token) {
    return res.status(401).json({ msg: '認証トークンがありません。アクセスが拒否されました。' });
  }

  try {
    // 3. トークンを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. 検証成功後、リクエストオブジェクトにユーザー情報を追加
    req.user = decoded.user;
    next(); // 次の処理（API本体）へ進む
  } catch (e) {
    res.status(400).json({ msg: 'トークンが無効です。' });
  }
}

module.exports = auth;