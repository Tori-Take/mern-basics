const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// ★★★ 修正: serverディレクトリにある.envファイルを指定 ★★★
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Applicationモデルをインポート
// ★★★ 修正: 正しいパスを指定し、分割代入でモデルを取得 ★★★
const { Application } = require('../domains/applications/application.model');

// ここに追加したいアプリケーションの定義を記述します
const appsToSeed = [
 
  {
    name: 'ヒヤリ-Navi',
    description: '業務中のヒヤリハットを記録・共有し、安全意識を高めます。',
    permissionKey: 'CAN_USE_HIYARI',
  },
  // {
  //   name: 'スケジュール管理',
  //   description: 'チームの予定を共有するカレンダー',
  //   permissionKey: 'CAN_USE_SCHEDULE',
  // },
];

const seedApplications = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI);
    console.log('MongoDBに接続しました。');

    for (const appData of appsToSeed) {
      // 同じpermissionKeyを持つアプリが既に存在するか確認
      const existingApp = await Application.findOne({ permissionKey: appData.permissionKey });
      if (!existingApp) {
        await Application.create(appData);
        console.log(`✅ アプリケーション「${appData.name}」が正常に追加されました。`);
      } else {
        console.log(`ℹ️ アプリケーション「${appData.name}」は既に存在するため、スキップしました。`);
      }
    }
  } catch (error) {
    console.error('アプリケーションの追加中にエラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDBとの接続を切断しました。');
  }
};

seedApplications();