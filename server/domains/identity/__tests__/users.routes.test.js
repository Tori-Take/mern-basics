const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app'); // 分離したExpressアプリ本体
const { connectDB, disconnectDB, clearDB } = require('../../../core/config/db.memory');
const User = require('../user.model');
const Tenant = require('../../organization/tenant.model');
const generateToken = require('../../../core/utils/generateToken');

// --- テスト全体のセットアップ ---
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

// ユーザー認証関連API（登録・ログイン）のテストをグループ化
describe('User Authentication Routes', () => {

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
      expect(user.roles).toContain('tenant-superuser'); // ★ 作成されたオーナーはtenant-superuserロールを持つ

      // 【TDD Step1: RED】
      // 新しく作成されたユーザーは、permissionsプロパティを空の配列として持つべき
      // このテストは、user.model.jsを修正するまで失敗するはず
      expect(user.permissions).toBeDefined();
      expect(Array.isArray(user.permissions)).toBe(true);
      expect(user.permissions.length).toBe(0);
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

describe('PUT /api/users/profile - User Profile Update', () => {
  let user;
  let token;
  const newName = '新しい名前';
  // 各テストの前に、DBをクリアし、テスト用のユーザーを作成・ログインしてトークンを生成する
  beforeEach(async () => {
    user = new User({
      // 修正: スキーマに合わせて `username` を使用する
      username: 'テストユーザー',
      email: 'test.profile@example.com',
      password: 'password123',
      tenantId: new mongoose.Types.ObjectId(),
      roles: ['user'],
    });
    await user.save();

    // ログインしてトークンを取得
    token = generateToken(user._id);
  });

  it('should allow a logged-in user to update their own name and return the updated user', async () => {
    // 1. APIにリクエストを送信
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`) // 認証ヘッダー
      .send({ username: newName }); // 修正: `username` を送信する

    // 2. レスポンスを検証
    expect(res.statusCode).toEqual(200); // 成功ステータスが返ってくるはず
    expect(res.body).toHaveProperty('username', newName); // 修正: `username` を検証する
    expect(res.body).not.toHaveProperty('password'); // パスワードは含まれていないはず

    // 3. データベースの状態を検証
    const updatedUserInDb = await User.findById(user._id);
    expect(updatedUserInDb.username).toBe(newName); // 修正: `username` を検証する
  });

  it('should allow a logged-in user to update their own email and return the updated user', async () => {
    const newEmail = 'new.profile@example.com';

    // 1. APIにリクエストを送信
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newEmail });

    // 2. レスポンスを検証
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', newEmail);
    expect(res.body).not.toHaveProperty('password');

    // 3. データベースの状態を検証
    const updatedUserInDb = await User.findById(user._id);
    expect(updatedUserInDb.email).toBe(newEmail);
  });

  it('should return 400 if the new email is already taken by another user', async () => {
    const existingEmail = 'existing@example.com';

    // 1. 準備: 別のユーザーが使用しているメールアドレスを準備
    await new User({
      username: 'anotherUser',
      email: existingEmail,
      password: 'password123',
      tenantId: new mongoose.Types.ObjectId(),
      roles: ['user'],
    }).save();

    // 2. APIにリクエストを送信 (ログイン中のユーザーが、既存のメールアドレスに更新しようとする)
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: existingEmail });

    // 3. レスポンスを検証
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'このメールアドレスは既に使用されています。');
  });
});

describe('PUT /api/users/:id - User Update by Admin', () => {
  let topTenant, subTenantA, subTenantB;
  let adminUser, targetUser;
  let adminToken;

  beforeEach(async () => {
    // 1. テスト用の組織構造を作成
    topTenant = await new Tenant({ name: '本社' }).save();
    subTenantA = await new Tenant({ name: '営業部', parent: topTenant._id }).save();
    subTenantB = await new Tenant({ name: '開発部', parent: topTenant._id }).save();

    // 2. テスト用のユーザーを作成
    // 営業部長（管理者）
    adminUser = await new User({
      username: '営業部長',
      email: 'admin-a@example.com',
      password: 'password123',
      tenantId: subTenantA._id, // 営業部に所属
      roles: ['admin', 'user'],
    }).save();

    // 異動対象の営業部員
    targetUser = await new User({
      username: '営業部員',
      email: 'user-a@example.com',
      password: 'password123',
      tenantId: subTenantA._id, // 営業部に所属
      roles: ['user'],
    }).save();

    // 3. 管理者用のトークンを生成
    adminToken = generateToken(adminUser._id);
  });

  it('should return 403 Forbidden when an admin tries to move a user to a tenant they do not manage', async () => {
    // 営業部長が、権限のない「開発部」に営業部員を異動させようとする
    const res = await request(app)
      .put(`/api/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tenantId: subTenantB._id, // 権限外の部署ID
      });

    // 403エラーが返ってくることを期待
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', '指定された部署にユーザーを移動する権限がありません。');

    // データベースの値が変更されていないことも確認
    const userInDb = await User.findById(targetUser._id);
    expect(userInDb.tenantId.toString()).toBe(subTenantA._id.toString());
  });

  // 【TDD Step2: RED】
  it('should allow an admin to update a user\'s permissions', async () => {
    // 1. テストデータ: このユーザーに新しく付与したい権限のリスト
    const newPermissions = ['CAN_USE_TODO', 'CAN_USE_SCHEDULE'];

    // 2. APIリクエストを実行
    const res = await request(app)
      .put(`/api/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        permissions: newPermissions,
      });

    // 3. レスポンスを検証
    expect(res.statusCode).toEqual(200);
    expect(res.body.permissions).toEqual(expect.arrayContaining(newPermissions));

    // 4. データベースの状態を検証
    const updatedUser = await User.findById(targetUser._id);
    expect(updatedUser.permissions).toEqual(expect.arrayContaining(newPermissions));
  });
});