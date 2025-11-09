const express = require('express');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary'); // ★★★ Cloudinaryライブラリをインポート ★★★

// 環境変数を .env ファイルから読み込む
require('dotenv').config();

// ★★★ ここからが新しいコード ★★★
// Cloudinaryに.envファイルから読み込んだ設定を渡す
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// ミドルウェアの設定
// CORSを有効にする (より詳細な設定)
app.use(cors({
  origin: '*', // すべてのオリジンを許可 (開発用)。本番環境では特定のドメインに制限することを推奨します。
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 許可するHTTPメソッド
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], // 許可するヘッダー
}));
app.use(express.json()); // JSON形式のリクエストボディを解析できるようにする

// --- APIルートの設定 ---
//【開発ルール】循環参照を避けるため、以下のルールを厳守すること。
// 1. 全てのルートファイルは、このセクションでrequireする。
// 2. 依存される側（User, Tenantなど）のルートを先に読み込む。
// 3. 新しい機能（ドメイン）を追加する際は、このセクションの一番下に追加する。

// (A) 基本モデル（User, Tenant, Roleなど）を持つ、依存される側のルート
const usersRouter = require('./domains/identity/users.routes.js');
const rolesRouter = require('./domains/organization/roles.routes.js');
const tenantsRouter = require('./domains/organization/tenants.routes.js');

// (B) 他のモデルに依存する側のルート
const todosRouter = require('./domains/task/todos.routes.js');
const notificationRoutes = require('./domains/notifications/notifications.routes.js');
const hiyariRoutes = require('./domains/hiyari/hiyari.routes.js');
const systemRoutes = require('./domains/system/system.routes.js');
const applicationRoutes = require('./domains/applications/applications.routes.js');
const snapSphereRoutes = require('./domains/snapsphere/snapsphere.routes.js'); // ★★★ Snap-Sphereのルートをインポート ★★★

app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hiyari', hiyariRoutes); // ★ Hiyari-Naviのルートを登録
app.use('/api/system', systemRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/snapsphere', snapSphereRoutes); // ★★★ Snap-Sphereのルートを登録 ★★★

// --- 本番環境用の設定 ---
if (process.env.NODE_ENV === 'production') {
  // Reactのビルド成果物（静的ファイル）を提供
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // API以外のすべてのGETリクエストに対してReactアプリを返す
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

module.exports = app;