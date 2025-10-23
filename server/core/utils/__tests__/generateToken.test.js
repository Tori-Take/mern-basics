const generateToken = require('../generateToken');
const jwt = require('jsonwebtoken');

describe('generateToken utility', () => {
  it('should generate a valid JWT for a given user ID', () => {
    // 1. テスト用のIDを準備
    const userId = '60d5f3f5e7b3c9a4b4f4b4f4'; // MongoDBのObjectID形式のダミーID

    // 2. テスト対象の関数を実行
    const token = generateToken(userId);

    // 3. 結果を検証
    // jwt.verifyでトークンが正しい秘密鍵で署名されているか、中身が正しいかを確認
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.user.id).toBe(userId);
  });
});