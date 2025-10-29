/**
 * @file admin.js
 * @description 管理者(admin)権限を検証するミドルウェア
 */
const { authorize } = require('./authorize');

// 汎用的なauthorizeミドルウェアを使い、'admin'ロールを要求する
module.exports = authorize('admin');
