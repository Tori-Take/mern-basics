const jwt = require('jsonwebtoken');
const User = require('../../domains/identity/user.model'); // Userモデルをインポート

const auth = async (req, res, next) => {
  let token;

  // 1. モダンな 'Authorization: Bearer <token>' 形式を優先してチェック
  if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer ')) {
    token = req.header('Authorization').substring(7);
  } else {
    // 2. 従来の 'x-auth-token' やボディ、クエリからの取得もフォールバックとして残す
    token = req.header('x-auth-token') || req.body.token || req.query.token;
  }

  // 2. トークンが存在しない場合はエラー
  if (!token) {
    return res.status(401).json({ message: '認証トークンがありません。アクセスが拒否されました。' });
  }

  try {
    // 3. トークンを検証し、ペイロード（ユーザーID）をデコード
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. ★★★【重要】★★★
    //    デコードしたIDを使って、データベースから完全なユーザー情報を取得
    const user = await User.findById(decoded.user.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません。認証が無効です。' });
    }

    // 5. 取得した完全なユーザーオブジェクトをリクエストに添付
    req.user = user;

    // 6. 次のミドルウェアまたはAPIルートへ処理を渡す
    next();
  } catch (err) {
    res.status(401).json({ message: 'トークンが無効です。' });
  }
};

module.exports = auth;
