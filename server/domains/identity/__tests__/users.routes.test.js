const request = require('supertest');
const app = require('../../../app'); // 分離したExpressアプリ本体
const { connectDB, disconnectDB, clearDB } = require('../../../core/config/db.memory');
const User = require('../user.model');
const Tenant = require('../../organization/tenant.model');

// ユーザー認証関連API（登録・ログイン）のテストをグループ化
describe('User Authentication Routes', () => {

  // 全てのテストの前に一度だけ実行：インメモリDBに接続
  beforeAll(async () => {
    await connectDB();
  });

  // 各テストケースの後処理：DBをクリーンアップ
  afterEach(async () => {
    await clearDB();
  });

  // 全てのテストの後に一度だけ実行：DBから切断
  afterAll(async () => {
    await disconnectDB();
  });

  // --- ユーザー登録APIのテスト ---
  describe('POST /api/users/register', () => {
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

  // --- ユーザーログインAPIのテスト ---
  describe('POST /api/users/login', () => {
    const loginUserData = {
      tenantName: 'Login Test Tenant',
      username: 'loginuser',
      email: 'login@test.com',
      password: 'password123',
    };

    // 各ログインテストの前に、ログイン対象のユーザーを登録しておく
    beforeEach(async () => {
      await request(app).post('/api/users/register').send(loginUserData);
    });

    // 正常系: 正しい認証情報でログインし、トークンとユーザー情報を返すこと
    it('should login with correct credentials and return a token and user info', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: loginUserData.email,
          password: loginUserData.password,
        });

      // レスポンスを検証
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token'); // トークンが含まれているか
      expect(res.body).toHaveProperty('user'); // ユーザー情報が含まれているか
      expect(res.body.user.email).toEqual(loginUserData.email); // メールアドレスが正しいか
    });

    // 異常系: 間違ったパスワードでログインを試みた場合、400エラーを返すこと
    it('should return 400 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: loginUserData.email,
          password: 'wrongpassword',
        });

      // レスポンスを検証
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'ユーザー名またはパスワードが無効です。');
    });

    // 異常系: 存在しないメールアドレスでログインを試みた場合、400エラーを返すこと
    it('should return 400 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@test.com',
          password: loginUserData.password,
        });

      // レスポンスを検証
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'ユーザー名またはパスワードが無効です。');
    });
  });

  // --- 保護されたルートのテスト ---
  describe('GET /api/users/auth', () => {
    let token;
    let testUser;

    // 各テストの前に、ユーザーを登録・ログインさせてトークンを取得
    beforeEach(async () => {
      // 1. ユーザー登録
      await request(app)
        .post('/api/users/register')
        .send({
          tenantName: 'Protected Tenant',
          username: 'protecteduser',
          email: 'protected@test.com',
          password: 'password123',
        });

      // 2. ログインしてトークンとユーザー情報を取得
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: 'protected@test.com', password: 'password123' });

      token = loginRes.body.token;
      testUser = loginRes.body.user;
    });

    // 正常系: 有効なトークンでアクセスし、ユーザー情報を取得できること
    it('should get user info with a valid token', async () => {
      const res = await request(app)
        .get('/api/users/auth')
        .set('x-auth-token', token); // ヘッダーにトークンをセット

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('_id', testUser._id);
      expect(res.body.email).toEqual(testUser.email);
    });

    // 異常系: トークンなしでアクセスした場合、401エラーを返すこと
    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/users/auth');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', '認証トークンがありません。アクセスが拒否されました。');
    });

    // 異常系: 無効なトークンでアクセスした場合、401エラーを返すこと
    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/users/auth')
        .set('x-auth-token', 'this-is-an-invalid-token');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'トークンが無効です。');
    });
  });

});