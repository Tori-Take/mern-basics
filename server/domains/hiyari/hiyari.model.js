const mongoose = require('mongoose');

const hiyariSchema = new mongoose.Schema({
  // 誰が投稿したか
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // どの組織に属する投稿か
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  // いつ発生したか
  incidentDate: {
    type: Date,
    required: true,
  },
  // ★★★ 欠落していたフィールドを追加 ★★★
  location: {
    type: String,
    trim: true, // 前後の空白を自動で除去
  },
  // どんな内容だったか
  details: {
    type: String,
    required: [true, '詳細は必須項目です。'],
    trim: true,
  },
  // どんなカテゴリか
  category: {
    type: String,
    required: true,
    enum: ['転倒・つまずき', '衝突', '誤操作', '火災・感電', 'その他'],
  },
  // タグ
  tags: [String],
}, { timestamps: true });

// ★★★ ドキュメントが保存される前に実行されるミドルウェアを追加 ★★★
hiyariSchema.pre('save', function(next) {
  // incidentDateフィールドが変更されている、または新規作成の場合のみ実行
  if (this.isModified('incidentDate') && this.incidentDate) {
    // 秒とミリ秒を0に設定する
    this.incidentDate.setSeconds(0, 0);
  }
  // 次の処理へ進む
  next();
});

module.exports = mongoose.model('Hiyari', hiyariSchema);