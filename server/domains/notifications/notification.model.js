const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  // 通知の宛先ユーザー
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // 通知の送り主 (システム通知の場合はnull)
  sender: { type: Schema.Types.ObjectId, ref: 'User' },

  // ★★★ アップグレード案 ★★★
  // どのアプリケーションからの通知かを示すキー
  // 'CAN_USE_TODO', 'CAN_USE_SCHEDULE' などのpermissionKeyと連動させる
  sourceApplication: { type: String, required: true },

  // 通知の種類 (より具体的に)
  type: { type: String, enum: ['TASK_ASSIGNED', 'TASK_UNASSIGNED', 'TASK_MEMBER_CHANGED', 'TASK_READ', 'TASK_COMPLETED', 'TASK_UPDATED', 'TASK_DELETED', 'COMMENT_ADDED'], required: true },

  // 通知メッセージ
  message: { type: String, required: true },

  // クリック時の遷移先URL (例: /todos?taskId=12345)
  link: { type: String },

  // 既読フラグ
  isRead: { type: Boolean, default: false, index: true },

}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;