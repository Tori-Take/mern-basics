const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HiyariSchema = new Schema({
  // この報告がどの部署に属するか
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  // 報告者
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // 発生日時
  incidentDate: {
    type: Date,
    required: true,
  },
  // 発生場所
  location: {
    type: String,
    required: true,
    trim: true,
  },
  // 状況
  description: {
    type: String,
    required: true,
    trim: true,
  },
  // 対策
  measures: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Hiyari', HiyariSchema);