const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Role = require('./models/role.model'); // Roleモデルをインポート
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
// TODO APIエンドポイントのルーターを読み込む
const todosRouter = require('./routes/todos'); // 既存
const usersRouter = require('./routes/users'); // 新しく追加

// '/todos' というパスにルーターを適用する
app.use('/todos', todosRouter);
// '/api/users' というパスにユーザー関連のルーターを適用する
app.use('/api/users', usersRouter);
app.use('/api/roles', require('./routes/roles'));

// --- 本番環境用の設定 ---
if (process.env.NODE_ENV === 'production') {
  // Reactのビルド成果物（静的ファイル）を提供
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // API以外のすべてのGETリクエストに対してReactアプリを返す
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// --- 基本的なロールが存在することを確認・作成する関数 ---
const initializeRoles = async () => {
  try {
    const count = await Role.estimatedDocumentCount();
    if (count === 0) {
      console.log("基本的なロール（user, admin）を初期化します...");
      await Role.create([
        { name: 'user', description: '一般ユーザー。基本的なアクセス権を持つ。' },
        { name: 'admin', description: '管理者。全てのアクセス権を持つ。' }
      ]);
      console.log("ロールの初期化が完了しました。");
    }
  } catch (error) {
    console.error("ロールの初期化中にエラーが発生しました:", error);
    // エラーが発生してもサーバー起動は続行するが、管理者に警告する
  }
};

// データベースに接続してからサーバーを起動する
const startServer = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB データベースへの接続が正常に確立されました");

    // サーバー起動前にロールを初期化
    await initializeRoles();

    app.listen(port, () => {
      console.log(`サーバーがポート ${port} で起動しました。`);
    });
  } catch (error) {
    console.error("データベースへの接続に失敗しました:", error);
    process.exit(1); // 接続に失敗した場合はプロセスを終了
  }
};

startServer();
