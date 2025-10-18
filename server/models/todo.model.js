const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// TODOデータの設計図（スキーマ）を定義します
const todoSchema = new Schema({
  // TODOの内容
  text: {
    type: String,
    required: true, // 必須項目
    trim: true,     // 前後の空白を自動で削除
  },
  // 完了したかどうか
  completed: {
    type: Boolean,
    default: false, // デフォルトは未完了(false)
  },
  // このTODOを完了したユーザーのID
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // このTODOが完了した日時
  completedAt: {
    type: Date,
    default: null,
  },
  // --- 追加フィールド ---
  // 優先度
  priority: {
    type: String,
    enum: ['高', '中', '低'], // この3つの値のみ許可
    default: '中',
  },
  // 期日
  dueDate: {
    type: Date,
    default: null,
  },
  // 予定日
  scheduledDate: {
    type: Date,
    default: null,
  },
  // タグ（複数設定可能）
  tags: {
    type: [String],
    default: [],
  },
  // このTODOが所属するテナントのID
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  // 依頼先ユーザーのID
  requester: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ★ IDの配列に変更
    default: [],
  },  
  // このTODOを所有するユーザーのID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Userモデルと関連付ける
    required: true,
  },
}, {
  timestamps: true, // 作成日時(createdAt)と更新日時(updatedAt)を自動で追加
});

// スキーマからモデルを作成し、エクスポートします
const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;