const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// テナントの設計図（スキーマ）を定義します
const tenantSchema = new Schema({
  name: {
    type: String,
    required: [true, 'テナント名は必須です。'],
    unique: true, // テナント名は一意でなければならない
    trim: true,
  },
    // このテナントの親テナントを指し示すフィールド
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant', // 自分自身（'Tenant'モデル）を参照するのがポイント
    default: null, // 親がいない場合（最上位の組織）はnull
  }
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
