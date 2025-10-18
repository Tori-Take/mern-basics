const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Role = require('./models/role.model');
const Tenant = require('./models/tenant.model'); // ★ Tenantモデルをインポート
const path = require('path');

// 環境変数を .env ファイルから読み込む
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors()); // CORSを有効にする
app.use(express.json()); // JSON形式のリクエストボディを解析できるようにする

// MongoDBへの接続 (今はまだ接続文字列がありません)
const uri = process.env.ATLAS_URI;

// APIルートの設定
const todosRouter = require('./routes/todos');
const usersRouter = require('./routes/users');
const rolesRouter = require('./routes/roles');
const tenantsRouter = require('./routes/tenants'); // ★ 新しく追加
// const authRouter = require('./routes/auth'); // auth.jsがまだ存在しないため一時的にコメントアウト

app.use('/api/todos', todosRouter);
// '/api/users' というパスにユーザー関連のルーターを適用する
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/tenants', tenantsRouter); // ★ 新しく追加

// --- 本番環境用の設定 ---
if (process.env.NODE_ENV === 'production') {
  // Reactのビルド成果物（静的ファイル）を提供
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // API以外のすべてのGETリクエストに対してReactアプリを返す
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// データベースに接続してからサーバーを起動する
const startServer = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB データベースへの接続が正常に確立されました");

    // サーバー起動前にロールを初期化
    // await initializeRoles(); // テナントごとにロールを作成するため、このグローバルな初期化は不要になりました。

    // --- ここから動作確認用のコード ---
    console.log('\n[動作確認] テナントモデルの動作を確認します...');
    try {
      const testTenantName = 'Default Tenant';
      const existingTenant = await Tenant.findOne({ name: testTenantName });

      if (!existingTenant) {
        console.log(`'${testTenantName}' が見つかりません。新規作成します...`);
        await Tenant.create({ name: testTenantName });
        console.log(`✅ [成功] '${testTenantName}' の作成が完了しました。`);
      } else {
        console.log(`✅ [成功] '${testTenantName}' は既に存在します。モデルは正常に動作しています。`);
      }
    } catch (error) {
      console.error('❌ [失敗] テナントの確認・作成中にエラーが発生しました:', error.message);
    }
    console.log('--- 動作確認完了 ---\n');
    // --- ここまで ---

    app.listen(port, () => {
      console.log(`サーバーがポート ${port} で起動しました。`);
    });
  } catch (error) {
    console.error("データベースへの接続に失敗しました:", error);
    process.exit(1); // 接続に失敗した場合はプロセスを終了
  }
};

startServer();
