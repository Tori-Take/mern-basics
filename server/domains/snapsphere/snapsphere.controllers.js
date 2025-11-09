const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');
const Post = require('./post.model'); // ★★★ Postモデルをインポート ★★★

class SnapSphereController {
  /**
   * @desc    Cloudinary APIへの接続をテストする
   * @route   GET /api/snapsphere/ping
   */
  static pingCloudinary = asyncHandler(async (req, res) => {
    const result = await cloudinary.v2.api.ping();
    if (result.status === 'ok') {
      res.json({ message: 'Cloudinaryへの接続に成功しました！', data: result });
    } else {
      res.status(500).json({ message: 'Cloudinaryへの接続に失敗しました。', data: result });
    }
  });

  /**
   * @desc    Cloudinaryへの署名付きアップロードのための署名とパラメータを生成する
   * @route   POST /api/snapsphere/upload-signature
   */
  static generateUploadSignature = asyncHandler(async (req, res) => {
    // アップロードポリシーを定義
    const timestamp = Math.round((new Date).getTime() / 1000);
    const publicId = `snapsphere/${req.user.tenantId}/${req.user.id}/${timestamp}`; // フォルダ構造を定義

    // ★★★ デバッグ用ログを追加 ★★★
    const paramsToSign = {
      timestamp: timestamp,
      public_id: publicId,
      upload_preset: 'snapsphere_preset', // ★★★ 作成した専用プリセット名に変更 ★★★
    };
    console.log('[Backend] 署名生成に使用するパラメータ:', paramsToSign);

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    console.log('[Backend] 生成された署名:', signature);

    res.json({ signature, timestamp, publicId, cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY });
  });

  /**
   * @desc    新しい写真投稿を作成する
   * @route   POST /api/snapsphere/posts
   */
  static createPost = asyncHandler(async (req, res) => {
    const { title, description, photo, shotDate, location, visibility } = req.body; // ★ visibility を受け取る

    // 基本的なバリデーション
    if (!title || !photo || !photo.public_id || !photo.secure_url) {
      res.status(400);
      throw new Error('タイトルと写真は必須項目です。');
    }

    const newPost = new Post({
      title,
      description,
      photo,
      shotDate,
      location,
      visibility, // ★★★ この行を追加 ★★★
      postedBy: req.user.id,
      tenantId: req.user.tenantId,
    });

    const createdPost = await newPost.save();
    res.status(201).json(createdPost);
  });

  /**
   * @desc    写真投稿の一覧を取得する
   * @route   GET /api/snapsphere/posts
   */
  static getPosts = asyncHandler(async (req, res) => {
    // ★★★ ここからが新しい閲覧権限ロジック ★★★
    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    const userId = req.user.id;

    const query = {
      $or: [
        // 1. 自分が投稿したプライベートな投稿
        { visibility: 'private', postedBy: userId },
        // 2. 自分が所属する部署内の投稿
        { visibility: 'department', tenantId: req.user.tenantId },
        // 3. 自分がアクセス可能な全ての組織・部署の投稿
        { visibility: 'tenant', tenantId: { $in: accessibleTenantIds } },
        // 4. (将来拡張用) 特定のユーザーに許可された投稿
        // { visibility: 'specific_users', allowedUsers: userId },
      ]
    };

    const posts = await Post.find(query)
      .populate('postedBy', 'username') // 投稿者のユーザー名を取得
      .populate('tenantId', 'name') // 投稿部署名を取得
      .sort({ createdAt: -1 });
    res.json(posts);
  });
}

module.exports = SnapSphereController;
