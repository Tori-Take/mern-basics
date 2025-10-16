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
    const { name, email, password } = req.body; // "username" を "name" に変更

    // 2. 必須項目が入力されているか簡易チェック
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
    }

    // 3. メールアドレスが既に存在するかチェック
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
    }

    // 4. ユーザー名が既に存在するかチェック
    const existingUsername = await User.findOne({ username: name }); // クエリを "name" に合わせる
    if (existingUsername) {
      return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
    }

    // 4. パスワードをハッシュ化（暗号化）
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. 新しいユーザーオブジェクトを作成
    const newUser = new User({
      username: name, // "name" をモデルの "username" フィールドにマッピング
      email,
      password: hashedPassword, // ハッシュ化したパスワードを保存
      // rolesはモデルのデフォルト値['user']が自動的に設定される
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
    const { name, password } = req.body; // "username" を "name" に変更

    // 2. 必須項目チェック
    if (!name || !password) {
      return res.status(400).json({ message: 'ユーザー名とパスワードを入力してください。' });
    }

    // 3. ユーザーをユーザー名で検索
    const user = await User.findOne({ username: name }); // クエリを "name" に合わせる
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

      // パスワード強制リセットフラグをチェック
      if (user.forcePasswordReset) {
        return res.json({
          token,
          forceReset: true, // フロントエンドへの目印
        });
      }
      res.json({ token }); // 通常のレスポンス
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

    // フロントエンドの期待に合わせてレスポンスを整形
    const userObject = user.toObject();
    userObject.name = userObject.username;
    userObject.isActive = user.status === 'active';
    delete userObject.username;
    // isAdminはスキーマから削除するので、こちらも不要

    res.json(userObject);
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
    // フロントエンドの期待に合わせて、username を name として返す
    const userObject = user.toObject();
    userObject.name = userObject.username;
    userObject.isActive = user.status === 'active'; // 不足していた isActive を追加
    delete userObject.username;

    res.json(userObject); // 修正点1: 変換後のオブジェクトを返す
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
    const { name, email, roles, isActive } = req.body; // 修正点2: フロントエンドのデータ形式に合わせる

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
    if (name && name !== user.username) {
      const existingUsername = await User.findOne({ username: name, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
      }
      user.username = name;
    }

    // --- デバッグログ ---
    console.log('[PUT /api/users/:id] 受信したデータ:', { name, email, roles, isActive });
    console.log('[PUT /api/users/:id] 更新前のユーザー状態:', { username: user.username, roles: user.roles, status: user.status });

    // statusをisActiveに基づいて更新 (より安全な方法に修正)
    if (typeof isActive === 'boolean') {
      user.status = isActive ? 'active' : 'inactive';
    }

    if (roles) user.roles = roles; // rolesを更新

    const updatedUser = await user.save();
    console.log('[PUT /api/users/:id] 更新後のユーザー状態:', { username: updatedUser.username, roles: updatedUser.roles, status: updatedUser.status });

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
    // 新しいデータ形式に合わせる
    const { name, email, password, roles, isActive } = req.body;

    // 必須項目チェック
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
    }

    // 重複チェック
    const existingUser = await User.findOne({ $or: [{ email }, { username: name }] });
    if (existingUser) {
      return res.status(400).json({ message: 'そのユーザー名またはメールアドレスは既に使用されています。' });
    }

    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 'user' ロールが必ず含まれるようにする
    const finalRoles = roles ? [...new Set(['user', ...roles])] : ['user'];

    const newUser = new User({
      username: name,
      email,
      password: hashedPassword,
      roles: finalRoles,
      status: (typeof isActive === 'boolean' && !isActive) ? 'inactive' : 'active',
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
    const user = await User.findById(req.params.id);
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