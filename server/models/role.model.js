const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = new Schema({
  name: {
    type: String,
    required: [true, 'ロール名は必須です。'],
    unique: true, // データ品質: 重複したロール名を許可しない
    trim: true,
  },
  description: { // 将来的な拡張性のため、説明フィールドも追加
    type: String,
    trim: true,
    default: '',
  }
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
