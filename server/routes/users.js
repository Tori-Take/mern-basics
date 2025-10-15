const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   POST /api/users/register
// @desc    新しいユーザーを登録する
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // 1. リクエストボディからユーザー情報を取得
    const { username, email, password, group } = req.body;

    // 2. 必須項目が入力されているか簡易チェック
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
    }

    // 3. メールアドレスが既に存在するかチェック
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
    }

    // 4. ユーザー名が既に存在するかチェック
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
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
      return res.status(400).json({ message: 'ユーザー名とパスワードを入力してください。' });
    }

    // 3. ユーザーをユーザー名で検索
    const user = await User.findOne({ username });
    if (!user) {
      // セキュリティのため、どちらが間違っているか特定させないメッセージを返す
      return res.status(400).json({ message: 'ユーザー名またはパスワードが無効です。' });
    }

    // 4. パスワードを比較
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'ユーザー名またはパスワードが無効です。' });
    }

    // 5. アカウントがアクティブかチェック
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'このアカウントは現在利用できません。' });
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

// @route   GET /api/users
// @desc    全ユーザーのリストを取得する (管理者のみ)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    // パスワードを除外し、作成日が新しい順にソートして全ユーザーを取得
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

// @route   GET /api/users/:id
// @desc    特定のユーザー情報を取得する (管理者のみ)
// @access  Private/Admin
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

// @route   PUT /api/users/:id
// @desc    ユーザー情報を更新する (管理者のみ)
// @access  Private/Admin
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { username, email, status, isAdmin } = req.body;

    // 更新対象のユーザーを検索
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // --- 重複チェック ---
    // 1. メールアドレスが変更され、かつ他のユーザーに既に使用されていないかチェック
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
      }
      user.email = email;
    }

    // 2. ユーザー名が変更され、かつ他のユーザーに既に使用されていないかチェック
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username: username, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
      }
      user.username = username;
    }

    // リクエストボディに値があれば更新する
    if (status) user.status = status;
    // isAdminはbooleanなので、undefinedでないことを確認
    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;

    const updatedUser = await user.save();
    res.json(updatedUser);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

// @route   POST /api/users
// @desc    管理者が新しいユーザーを作成する
// @access  Private/Admin
router.post('/', [auth, admin], async (req, res) => {
  try {
    const { username, email, password, status, isAdmin } = req.body;

    // 必須項目チェック
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
    }

    // 重複チェック
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'そのユーザー名またはメールアドレスは既に使用されています。' });
    }

    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      status: status || 'active',
      isAdmin: isAdmin || false,
    });

    const savedUser = await newUser.save();

    res.status(201).json(savedUser); // トークンは返さず、作成されたユーザー情報を返す
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

module.exports = router;