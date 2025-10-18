const router = require('express').Router();
const Role = require('../models/role.model');
const User = require('../models/user.model');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 保護された必須ロールのリスト
const PROTECTED_ROLES = ['user', 'admin'];

// --- 全てのロール管理APIは、ログイン済みかつ管理者である必要がある ---
router.use(auth); // このファイル内のAPIは全てログイン必須

/**
 * @route   GET /api/roles
 * @desc    全てのロールを取得
 * @access  Private (Admin)
 */
router.get('/', admin, async (req, res) => { // ★ adminミドルウェアを個別に追加
  try {
    // ログイン中の管理者と同じテナントに所属するロールのみを取得
    const roles = await Role.find({ tenantId: req.user.tenantId }).sort({ createdAt: 'asc' });
    res.json(roles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   POST /api/roles
 * @desc    新しいロールを作成
 * @access  Private (Admin)
 */
router.post('/', admin, async (req, res) => { // ★ adminミドルウェアを個別に追加
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'ロール名は必須です。' });
  }

  try {
    const newRole = new Role({
      tenantId: req.user.tenantId, // ★ 管理者と同じテナントに作成
      name: name.trim(),
      description: description || '',
    });

    const role = await newRole.save();
    res.status(201).json(role);
  } catch (err) {
    // データ品質: 重複エラー(E11000)のハンドリング
    if (err.code === 11000) {
      return res.status(400).json({ message: 'そのロール名は既に使用されています。' });
    }
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   PUT /api/roles/:id
 * @desc    ロールを更新
 * @access  Private (Admin)
 */
router.put('/:id', admin, async (req, res) => { // ★ adminミドルウェアを個別に追加
  const { name, description } = req.body;

  try {
    // ★ IDとテナントIDの両方で検索し、他テナントのデータを操作できないようにする
    const role = await Role.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!role) {
      return res.status(404).json({ message: 'ロールが見つかりません。' });
    }

    // 更新内容を適用
    if (name) role.name = name;
    if (description) role.description = description;

    const updatedRole = await role.save();
    if (PROTECTED_ROLES.includes(role.name)) {
      return res.status(400).json({ message: `保護されたロール '${role.name}' の名前は変更できません。` });
    }
    res.json(updatedRole);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'そのロール名は既に使用されています。' });
    }
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   DELETE /api/roles/:id
 * @desc    ロールを削除
 * @access  Private (Admin)
 */
router.delete('/:id', admin, async (req, res) => { // ★ adminミドルウェアを個別に追加
  try {
    // ★ IDとテナントIDの両方で検索
    const roleToDelete = await Role.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!roleToDelete) {
      return res.status(404).json({ message: 'ロールが見つかりません。' });
    }

    // 安全性: 保護されたロールは削除させない
    if (PROTECTED_ROLES.includes(roleToDelete.name)) {
      return res.status(400).json({ message: `保護されたロール '${roleToDelete.name}' は削除できません。` });
    }

    // データ整合性: このロールを使用しているユーザーがいないか確認
    const userCount = await User.countDocuments({ tenantId: req.user.tenantId, roles: roleToDelete.name });
    if (userCount > 0) {
      return res.status(400).json({ message: `このロールは ${userCount} 人のユーザーに割り当てられているため、削除できません。` });
    }

    await roleToDelete.deleteOne();
    res.json({ message: 'ロールが正常に削除されました。' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

module.exports = router;
