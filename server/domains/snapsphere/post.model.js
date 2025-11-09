const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  // --- 基本情報 ---
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  photo: {
    public_id: { type: String, required: true }, // CloudinaryでのファイルID
    secure_url: { type: String, required: true }, // HTTPSでの画像URL
  },
  
  // --- コンテキスト情報 ---
  shotDate: {
    type: Date,
    default: Date.now
  }, // 撮影日時
  location: {
    // ★★★ ここからが修正箇所 ★★★
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [経度, 緯度] の順
      index: '2dsphere' // 地図検索のためのインデックス
    },
    address: { type: String, trim: true } // (任意) 住所文字列 (将来用)
  },

  // --- 投稿者と所属 ---
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

  // --- 公開範囲設定 (初期実装ではシンプルに、後で拡張) ---
  // 現時点では、visibilityはデフォルト値のみを考慮し、allowedUsersは省略
  visibility: {
    type: String,
    enum: ['private', 'department', 'tenant', 'specific_users', 'public'],
    default: 'department', // デフォルトは部署内公開
  },

}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
