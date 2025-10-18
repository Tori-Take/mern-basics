const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // ★ この行を追加
const User = require('../models/user.model');
const Tenant = require('../models/tenant.model'); // Tenantモデルをインポート
const Role = require('../models/role.model'); // Roleモデルをインポート
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @route   POST /api/users/register
 * @desc    新しいテナントと、そのテナントの最初の管理者ユーザーを登録する
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, tenantName } = req.body;

    // --- 入力値のバリデーション ---
    if (!username || !email || !password || !tenantName) {
      return res.status(400).json({ message: 'すべての必須項目（組織名, ユーザー名, メールアドレス, パスワード）を入力してください。' });
    }

    // --- テナント名とメールアドレスの重複チェック ---
    const existingTenant = await Tenant.findOne({ name: tenantName });
    if (existingTenant) {
      return res.status(400).json({ message: 'その組織名は既に使用されています。' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
    }

    // --- 1. 新しいテナントを作成 ---
    const newTenant = new Tenant({ name: tenantName });
    await newTenant.save();

    // --- 2. 新しいテナント用の基本ロールを作成 ---
    // このテナントに所属する 'user' と 'admin' ロールを作成します。
    await Role.insertMany([
      { name: 'user', description: '一般ユーザー', tenantId: newTenant._id },
      { name: 'admin', description: '管理者', tenantId: newTenant._id }
    ]);

    // --- 3. パスワードのハッシュ化 ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- 4. 新しいユーザー（最初の管理者）を作成 ---
    const newUser = new User({
      tenantId: newTenant._id, // 作成したテナントのIDを紐付け
      username,
      email,
      password: hashedPassword,
      roles: ['user', 'admin'], // 最初のユーザーは管理者権限を持つ
    });

    await newUser.save();

    res.status(201).json({ message: 'ユーザー登録が成功しました。' });
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
    const { email, password } = req.body; // emailでログインするように変更

    // 2. 必須項目チェック
    if (!email || !password) {
      return res.status(400).json({ message: 'メールアドレスとパスワードを入力してください。' });
    }

    // 3. ユーザーをメールアドレスで検索
    const user = await User.findOne({ email });
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
        // tenantIdはミドルウェアでDBから取得するため、トークンには含めない
      },
    };

    // 7. JWTに署名してトークンを生成
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;

      // パスワード強制リセットフラグをチェック
      if (user.forcePasswordReset) {
        return res.json({
          token,
          forceReset: true, // フロントエンドへの目印
        });
      }
      // ログイン成功時に、JWTトークンとユーザー情報を返す
      const { password, ...userWithoutPassword } = user.toObject();
      res.json({ token, user: userWithoutPassword });
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
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

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
    // ログイン中の管理者と同じテナントに所属するユーザーのみを取得
    // パスワードを除外し、作成日が新しい順にソートして全ユーザーを取得
    const users = await User.find({ tenantId: req.user.tenantId })
      .select('-password')
      .sort({ createdAt: -1 });
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
    // IDとテナントIDの両方で検索し、他テナントの情報を取得できないようにする
    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .select('-password');

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
    const { username, email, roles, status } = req.body;

    // 更新対象のユーザーを検索
    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // --- 重複チェック ---
    // 1. メールアドレスが変更され、かつ他のユーザーに既に使用されていないかチェック
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email });
      if (existingEmail) {
        return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
      }
      user.email = email;
    }

    // 2. ユーザー名が変更され、かつ同じテナント内の他のユーザーに既に使用されていないかチェック
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username: username, tenantId: req.user.tenantId, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
      }
      user.username = username;
    }

    // statusを更新
    if (status) user.status = status;

    // rolesを更新
    if (roles) user.roles = roles; // rolesを更新

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
    const { username, email, password, roles, status } = req.body;

    // 必須項目チェック
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
    }

    // 重複チェック
    const existingUser = await User.findOne({ $or: [{ email }, { username, tenantId: req.user.tenantId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'そのユーザー名またはメールアドレスは既に使用されています。' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const finalRoles = roles ? [...new Set(['user', ...roles])] : ['user'];

    const newUser = new User({
      tenantId: req.user.tenantId, // 管理者と同じテナントに作成
      username,
      email,
      password: hashedPassword,
      roles: finalRoles,
      status: status || 'active',
    });
    const savedUser = await newUser.save();
    
    // フロントエンドの期待に合わせてレスポンスを整形
    const userObject = savedUser.toObject();
    userObject.name = userObject.username;
    delete userObject.username;
    delete userObject.password;
    
    res.status(201).json(userObject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

// @route   POST /api/users/:id/force-reset
// @desc    管理者がユーザーのパスワードリセットを強制する
// @access  Private/Admin
router.post('/:id/force-reset', [auth, admin], async (req, res) => {
  const { temporaryPassword } = req.body;

  if (!temporaryPassword || temporaryPassword.length < 6) {
    return res.status(400).json({ message: '6文字以上の一時パスワードを指定してください。' });
  }

  try {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // 一時パスワードをハッシュ化して設定
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(temporaryPassword, salt);
    user.forcePasswordReset = true;
    await user.save();

    res.json({ message: `${user.username} のパスワードが一時パスワードに更新され、リセット待機状態に設定されました。` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

// @route   POST /api/users/force-reset-password
// @desc    ユーザーが強制的にパスワードを再設定する
// @access  Private (Logged-in user)
router.post('/force-reset-password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'パスワードは6文字以上で入力してください。' });
    }

    // authミドルウェアからユーザーIDを取得
    const user = await User.findById(req.user.id);

    // パスワードをハッシュ化して更新
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.forcePasswordReset = false; // フラグを元に戻す
    await user.save();

    res.json({ message: 'パスワードが正常に更新されました。新しいパスワードで再度ログインしてください。' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

module.exports = router;