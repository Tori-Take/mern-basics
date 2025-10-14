const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const auth = require('../middleware/auth');

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

    // 7. 登録成功後、そのままログインさせるためにJWTを生成
    const payload = {
      user: {
        id: savedUser.id,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token }); // トークンを返す
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

// @route   POST /api/users/login
// @desc    ユーザーを認証し、トークンを取得する
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // 1. リクエストボディから情報を取得
    const { username, password } = req.body;

    // 2. 必須項目チェック
    if (!username || !password) {
      return res.status(400).json({ msg: 'ユーザー名とパスワードを入力してください。' });
    }

    // 3. ユーザーをユーザー名で検索
    const user = await User.findOne({ username });
    if (!user) {
      // セキュリティのため、どちらが間違っているか特定させないメッセージを返す
      return res.status(400).json({ msg: 'ユーザー名またはパスワードが無効です。' });
    }

    // 4. パスワードを比較
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'ユーザー名またはパスワードが無効です。' });
    }

    // 5. アカウントがアクティブかチェック
    if (user.status !== 'active') {
      return res.status(403).json({ msg: 'このアカウントは現在利用できません。' });
    }

    // 6. JWTペイロードを作成 (トークンに含める情報)
    const payload = {
      user: {
        id: user.id,
      },
    };

    // 7. JWTに署名してトークンを生成
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

// @route   GET /api/auth
// @desc    トークンからユーザー情報を取得する
// @access  Private
router.get('/auth', auth, async (req, res) => {
  try {
    // authミドルウェアでreq.userにIDがセットされている
    const user = await User.findById(req.user.id).select('-password'); // パスワードを除外して取得
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

module.exports = router;