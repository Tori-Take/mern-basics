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
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
