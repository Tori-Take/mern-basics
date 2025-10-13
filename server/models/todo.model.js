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
}, {
  timestamps: true, // 作成日時(createdAt)と更新日時(updatedAt)を自動で追加
});

// スキーマからモデルを作成し、エクスポートします
const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;