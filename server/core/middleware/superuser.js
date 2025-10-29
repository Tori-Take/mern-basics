/**
 * @file superuser.js
 * @description Superuser権限を検証するミドルウェア
 */

const { authorize } = require('./authorize');

// 汎用的なauthorizeミドルウェアを使い、'superuser'ロールを要求する
module.exports = authorize('superuser');
