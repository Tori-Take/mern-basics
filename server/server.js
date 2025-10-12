const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// 環境変数を .env ファイルから読み込む
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors()); // CORSを有効にする
app.use(express.json()); // JSON形式のリクエストボディを解析できるようにする

// MongoDBへの接続 (今はまだ接続文字列がありません)
const uri = process.env.ATLAS_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB データベースへの接続が正常に確立されました");
})

// ルートURLへのGETリクエストに対するレスポンス
app.get('/', (req, res) => {
  res.send('Hello from Express Server!');
});

// サーバーを起動
app.listen(port, () => {
    console.log(`サーバーがポート ${port} で起動しました。`);
});
