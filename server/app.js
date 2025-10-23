const express = require('express');
const cors = require('cors');
const path = require('path');

// 環境変数を .env ファイルから読み込む
require('dotenv').config();

const app = express();

// ミドルウェアの設定
// CORSを有効にする (より詳細な設定)
app.use(cors({
  origin: '*', // すべてのオリジンを許可 (開発用)。本番環境では特定のドメインに制限することを推奨します。
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 許可するHTTPメソッド
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], // 許可するヘッダー
}));
app.use(express.json()); // JSON形式のリクエストボディを解析できるようにする

// APIルートの設定
const todosRouter = require('./domains/task/todos.routes.js');
const usersRouter = require('./domains/identity/users.routes.js');
const rolesRouter = require('./domains/organization/roles.routes.js');
const tenantsRouter = require('./domains/organization/tenants.routes.js');
const systemRouter = require('./domains/system/system.routes.js'); // ★ Superuser用のルートをインポート

app.use('/api/todos', todosRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/system', systemRouter); // ★ Superuser用のルートをマッピング

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