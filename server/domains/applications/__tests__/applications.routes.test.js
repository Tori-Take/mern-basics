const request = require('supertest');
const app = require('../../../app');
const { Application } = require('../application.model');
const { connectDB, disconnectDB, clearDB } = require('../../../core/config/db.memory');
const User = require('../../identity/user.model');
const Tenant = require('../../organization/tenant.model'); // ★ Tenantモデルをインポート
const generateToken = require('../../../core/utils/generateToken');

// Applicationモデルのcreateメソッドをモック化
jest.mock('../application.model', () => ({
  Application: {
    create: jest.fn(), // POST用
    find: jest.fn(),   // GET用
  },
}));

describe('/api/applications', () => {
  let adminToken;

  // テストの前にDB接続とテストユーザー作成
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    // ★ 修正: テスト用のテナントを作成
    const testTenant = await new Tenant({ name: 'Test Tenant' }).save();

    // 管理者ユーザーを作成
    const adminUser = await new User({
      username: 'testadmin',
      email: 'testadmin@app.com',
      tenantId: testTenant._id, // ★ 修正: 作成したテナントのIDを渡す
      password: 'password',
      roles: ['admin', 'user'],
    }).save();
    adminToken = generateToken(adminUser._id);
  });

  // 各テストの後にDBをクリア
  // ★ 修正: clearDBは非同期処理なので、async/awaitで完了を待つ
  afterEach(async () => {
    await clearDB();
    jest.clearAllMocks();
  });

  // 全てのテストが終わったらDBから切断
  afterAll(async () => {
    await disconnectDB();
  });

  describe('POST /', () => {
    it('should create a new application and return 201 if user is admin', async () => {
      // 1. 準備 (Arrange)
      const newAppData = {
        name: 'Test App',
        description: 'A test application.',
        permissionKey: 'TEST_APP',
      };
      // モックされたApplication.createが返す値を設定
      const createdApp = { _id: 'app123', ...newAppData };
      Application.create.mockResolvedValue(createdApp);

      // 2. 実行 (Act)
      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${adminToken}`) // ★ 認証ヘッダーを追加
        .send(newAppData);

      // 3. 検証 (Assert)
      expect(response.status).toBe(201); // ★ 201 Createdで成功することを確認
      expect(response.body.data).toEqual(createdApp);
      expect(Application.create).toHaveBeenCalledWith(newAppData);
    });
  });

  // --- 【TDD Step1: RED】ここから新しいテストを追加 ---
  describe('GET /', () => {
    it('should return a list of all applications for an authenticated user', async () => {
      // 1. 準備 (Arrange)
      const mockApplications = [
        { _id: 'app1', name: 'TODO App', permissionKey: 'CAN_USE_TODO' },
        { _id: 'app2', name: 'Schedule App', permissionKey: 'CAN_USE_SCHEDULE' },
      ];
      // モックされたApplication.findが返す値を設定
      Application.find.mockResolvedValue(mockApplications);

      // 2. 実行 (Act)
      const response = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${adminToken}`);

      // 3. 検証 (Assert)
      // この時点ではGETルートが存在しないため、404エラーで失敗するはず
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockApplications);
      expect(Application.find).toHaveBeenCalled();
    });
  });
});
