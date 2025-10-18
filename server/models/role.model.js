const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = new Schema({
  // このロールが所属するテナントのID
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'ロール名は必須です。'],
    // unique: true, // ← この行を削除またはコメントアウトします
    trim: true,
  },
  description: { // 将来的な拡張性のため、説明フィールドも追加
    type: String,
    trim: true,
    default: '',
  }
}, { timestamps: true });

// 複合ユニークインデックスを設定: tenantId と name の組み合わせがユニークであることを保証する
roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
