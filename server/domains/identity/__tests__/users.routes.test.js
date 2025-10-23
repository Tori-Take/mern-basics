const request = require('supertest');
const app = require('../../../app'); // 分離したExpressアプリ本体
const { connectDB, disconnectDB, clearDB } = require('../../../core/config/db.memory');
const User = require('../user.model');
const Tenant = require('../../organization/tenant.model');

// 'User Registration'に関するテストをグループ化
describe('POST /api/users/register', () => {

  // テストスイート全体の前処理：インメモリDBに接続
  beforeAll(async () => {
    await connectDB();
  });

  // 各テストケースの後処理：DBをクリーンアップ
  afterEach(async () => {
    await clearDB();
  });

  // テストスイート全体の後処理：DBから切断
  afterAll(async () => {
    await disconnectDB();
  });

  // --- 正常系のテストケース ---
  // 正常系: 新しいテナントとオーナーを正常に登録し、ステータスコード201を返すこと
  it('should register a new tenant and owner, and return 201', async () => { 
    // 1. テスト用の入力データ
    const registrationData = {
      tenantName: 'Test Tenant',
      username: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
    };

    // 2. APIリクエストを実行
    const res = await request(app)
      .post('/api/users/register')
      .send(registrationData);

    // 3. レスポンスを検証
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'ユーザー登録が成功しました。');

    // 4. データベースの状態を検証 (より堅牢なテスト)
    const tenant = await Tenant.findOne({ name: 'Test Tenant' });
    expect(tenant).not.toBeNull(); // テナントが作成されたか

    const user = await User.findOne({ email: 'admin@test.com' });
    expect(user).not.toBeNull(); // ユーザーが作成されたか
    expect(user.tenantId).toEqual(tenant._id); // ユーザーが正しいテナントに紐づいているか
  });

  // --- 異常系のテストケース ---
  // 異常系: メールアドレスが重複している場合、ステータスコード400を返すこと
  it('should return 400 if email is duplicated', async () => { 
    const userData = {
      tenantName: 'Unique Tenant',
      username: 'Test User',
      email: 'duplicate@test.com',
      password: 'password123',
    };
    // 1. 最初のユーザーを登録しておく
    await request(app).post('/api/users/register').send(userData);

    // 2. 同じメールアドレスで再度登録を試みる
    const res = await request(app).post('/api/users/register').send({ ...userData, tenantName: 'Another Tenant' });

    // 3. 400エラーが返ってくることを検証
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'このメールアドレスは既に使用されています。');
  });
});