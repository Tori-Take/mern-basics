const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  // このユーザーが所属するテナントのID
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  username: {
    type: String,
    required: [true, 'ユーザー名は必須です。'],
    // unique: true, // この行を削除またはコメントアウト
    trim: true,
    minlength: [2, 'ユーザー名は2文字以上で入力してください。']
  },
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です。'],
    unique: true, // 同じメールアドレスは登録できないようにする
    trim: true,   // 前後の空白を自動で削除
    lowercase: true, // 保存する前に小文字に変換
    match: [/.+\@.+\..+/, '有効なメールアドレスを入力してください。'] // 簡単なメール形式のバリデーション
  },
  password: {
    type: String,
    required: [true, 'パスワードは必須です。'],
    minlength: [6, 'パスワードは6文字以上で入力してください。'], // パスワードは最低6文字以上
  },
  // 複数の役割（ロール）を保持するための配列
  roles: {
    type: [String],
    default: ['user'], // デフォルトで'user'ロールを付与
  },
  // アカウントの状態
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'], // 有効、無効、一時停止
    default: 'active',
  },
  // パスワードリセット用
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  // 管理者によるパスワード強制リセット用フラグ
  forcePasswordReset: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // createdAtとupdatedAtを自動で追加
});

// 複合ユニークインデックスを設定: tenantId と username の組み合わせがユニークであることを保証する
userSchema.index({ tenantId: 1, username: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
