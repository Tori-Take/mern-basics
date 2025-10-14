const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

// @route   POST /api/users/register
// @desc    新しいユーザーを登録する
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // 1. リクエストボディからユーザー情報を取得
    const { username, email, password, group } = req.body;

    // 2. 必須項目が入力されているか簡易チェック
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'ユーザー名、メールアドレス、パスワードは必須です。' });
    }

    // 3. ユーザー名またはメールアドレスが既に存在するかチェック
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ msg: 'そのユーザー名またはメールアドレスは既に使用されています。' });
    }

    // 4. パスワードをハッシュ化（暗号化）
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. 新しいユーザーオブジェクトを作成
    const newUser = new User({
      username,
      email,
      password: hashedPassword, // ハッシュ化したパスワードを保存
      group: group || 'default', // groupが指定されていなければモデルのデフォルト値を使う
    });

    // 6. データベースに保存
    const savedUser = await newUser.save();

    // 7. 成功レスポンスを返す (セキュリティのためパスワードは返さない)
    res.status(201).json({
      msg: 'ユーザー登録が成功しました。',
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

module.exports = router;