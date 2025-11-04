const mongoose = require('mongoose');
const app = require('./app'); // app.jsをインポート

// 環境変数を .env ファイルから読み込む
require('dotenv').config();

const port = process.env.PORT || 5000;

// MongoDBへの接続 (今はまだ接続文字列がありません)
const uri = process.env.ATLAS_URI;

// データベースに接続してからサーバーを起動する
const startServer = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB データベースへの接続が正常に確立されました");

    if (process.env.NODE_ENV !== 'test') {
      app.listen(port, () => {
        console.log(`サーバーがポート ${port} で起動しました。`);
      });
    }
  } catch (error) {
    console.error("データベースへの接続に失敗しました:", error);
    process.exit(1); // 接続に失敗した場合はプロセスを終了
  }
};

startServer();
