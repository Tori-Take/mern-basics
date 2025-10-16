// このスクリプトは、ロールシステムの更新後にユーザーデータを移行するためのものです。
// 古い `isAdmin` フィールドをすべてのユーザーから削除します。

// server/scripts ディレクトリから実行されることを想定し、
// .env ファイルのパスを一つ上の階層に設定します。
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/user.model');

const cleanupIsAdminField = async () => {
  if (!process.env.ATLAS_URI) {
    console.error('エラー: ATLAS_URI が .env ファイルに設定されていません。');
    process.exit(1);
  }

  try {
    // 1. データベースに接続
    console.log('データベースに接続しています...');
    await mongoose.connect(process.env.ATLAS_URI);
    console.log('データベースに接続しました。');

    // 2. `isAdmin` フィールドを持つユーザーを検索
    const usersWithIsAdmin = await User.find({ isAdmin: { $exists: true } }).countDocuments();

    if (usersWithIsAdmin === 0) {
      console.log('クリーンアップ対象の `isAdmin` フィールドを持つユーザーは見つかりませんでした。');
      return; // 処理を終了
    }

    console.log(`\n[タスク実行] ${usersWithIsAdmin}人のユーザーから古い \`isAdmin\` フィールドを削除します...`);

    // 3. `updateMany` を使って `isAdmin` フィールドを削除
    const result = await User.updateMany(
      { isAdmin: { $exists: true } }, // `isAdmin`フィールドが存在するドキュメントを対象
      { $unset: { isAdmin: "" } }      // `isAdmin`フィールドを削除
    );

    console.log('\n--- 結果 ---');
    console.log(`検索されたドキュメント数: ${result.matchedCount}`);
    console.log(`更新されたドキュメント数: ${result.modifiedCount}`);
    console.log('クリーンアップが正常に完了しました。');

  } catch (error) {
    console.error('クリーンアップ処理中にエラーが発生しました:', error);
  } finally {
    // 4. データベース接続を閉じる
    await mongoose.disconnect();
    console.log('\nデータベース接続を閉じました。');
    process.exit(0);
  }
};

// スクリプトを実行
cleanupIsAdminField();