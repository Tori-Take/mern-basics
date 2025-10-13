const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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
const todosRouter = require('./routes/todos');
// '/todos' というパスにルーターを適用する
app.use('/todos', todosRouter);

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
    app.listen(port, () => {
      console.log(`サーバーがポート ${port} で起動しました。`);
    });
  } catch (error) {
    console.error("データベースへの接続に失敗しました:", error);
    process.exit(1); // 接続に失敗した場合はプロセスを終了
  }
};

startServer();
