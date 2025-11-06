// cleanup-users.js
const mongoose = require('mongoose');
const User = require('./domains/identity/user.model');

// ★★★ 修正: アプリケーションの作法に合わせ、パス指定を削除 ★★★
require('dotenv').config();

// ★★★ 削除したいユーザーが所属するテナントIDをここに指定 ★★★
const TARGET_TENANT_ID = '690b35867f1603b0696aead7';

const cleanup = async () => {
  if (!process.env.ATLAS_URI) {
    console.error('エラー: ATLAS_URIが.envファイルに設定されていません。');
    return;
  }

  try {
    // データベースに接続
    await mongoose.connect(process.env.ATLAS_URI);
    console.log('MongoDB データベースへの接続が正常に確立されました。');

    // 対象テナントに所属するユーザーを検索
    const usersToDelete = await User.find({ tenantId: TARGET_TENANT_ID });

    if (usersToDelete.length === 0) {
      console.log(`テナントID: ${TARGET_TENANT_ID} に所属するユーザーは見つかりませんでした。`);
      return;
    }

    console.log(`テナントID: ${TARGET_TENANT_ID} に所属する ${usersToDelete.length} 人のユーザーを削除します...`);
    
    // ユーザーを一括削除
    const deleteResult = await User.deleteMany({ tenantId: TARGET_TENANT_ID });

    console.log(`完了: ${deleteResult.deletedCount} 人のユーザーを削除しました。`);

  } catch (error) {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
  } finally {
    // データベース接続を閉じる
    await mongoose.disconnect();
    console.log('データベース接続を閉じました。');
  }
};

// スクリプトを実行
cleanup();
