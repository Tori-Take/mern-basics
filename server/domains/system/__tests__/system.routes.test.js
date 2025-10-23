const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app'); // ★ 分割代入をやめて、appを直接インポート
const { connectDB, disconnectDB, clearDB } = require('../../../core/config/db.memory');
const generateToken = require('../../../core/utils/generateToken'); // ★ generateTokenユーティリティをインポート
const User = require('../../identity/user.model');
const Tenant = require('../../organization/tenant.model');

describe('Superuser System Routes', () => {
  // 全てのテストの前に一度だけDBに接続
  beforeAll(async () => {
    await connectDB();
  });

  // 各テストの後にDBをクリア
  afterEach(async () => {
    await clearDB();
  });

  // 全てのテストが終わったらDBから切断
  afterAll(async () => {
    await disconnectDB();
  });

  let superuserToken, adminToken;
  let superuser, adminUser;

  // 各テストケースの前に、クリーンな状態でテストデータを作成する
  const setupUsersAndTokens = async () => {
    // テナントを2つ作成
    const tenant1 = await new Tenant({ name: 'Superuser Corp' }).save();
    const tenant2 = await new Tenant({ name: 'Admin Corp' }).save();

    // Superuserを作成して保存
    const newSuperuser = new User({
      tenantId: tenant1._id,
      username: 'superuser',
      email: 'superuser@test.com',
      password: 'password123',
      roles: ['superuser', 'admin', 'user'],
    });
    await newSuperuser.save();

    // 通常のAdminユーザーを作成して保存
    const newAdminUser = new User({
      tenantId: tenant2._id,
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      roles: ['admin', 'user'],
    });
    await newAdminUser.save();

    // ★★★ 解決策: DBから最新のMongooseモデルインスタンスを再取得する ★★★
    superuser = await User.findById(newSuperuser._id);
    adminUser = await User.findById(newAdminUser._id);

    // ★★★ 修正: generateTokenユーティリティを直接呼び出す ★★★
    // generateTokenはユーザーIDを引数に取り、トークンを生成します。
    // 実際のアプリケーションの挙動と一致させるため、ユーザーIDを渡します。
    superuserToken = generateToken(superuser._id);
    adminToken = generateToken(adminUser._id);

  };

  describe('System API Access Control', () => {
    // このdescribeブロック内の各テストが実行される前に、
    // 毎回クリーンなユーザーとトークンを作成する
    beforeEach(async () => {
      await setupUsersAndTokens();
    });

    describe('GET /api/system/tenants', () => {
      it('should return all tenants for a superuser', async () => {
      // SuperuserとしてAPIをコール
      const res = await request(app)
        .get('/api/system/tenants')
        .set('x-auth-token', superuserToken);

      // 期待する結果
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(2);
      expect(res.body.some(t => t.name === 'Superuser Corp')).toBe(true);
      expect(res.body.some(t => t.name === 'Admin Corp')).toBe(true);
    });
      it('should return 403 Forbidden for a non-superuser (admin)', async () => {
      // 通常のAdminとしてAPIをコール
      const res = await request(app)
        .get('/api/system/tenants')
        .set('x-auth-token', adminToken);

      // 権限がないため403エラーになることを確認
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Superuser権限が必要');
    });
      it('should return 401 Unauthorized for a non-authenticated user', async () => {
      // トークンなしでAPIをコール
      const res = await request(app).get('/api/system/tenants');

      // 認証がないため401エラーになることを確認
      expect(res.statusCode).toBe(401);
    });
    });

    describe('DELETE /api/system/tenants/:id', () => {
      it('should allow a superuser to delete a tenant and its associated users', async () => {
      const tenantToDelete = await new Tenant({ name: 'Tenant to Delete' }).save();
      await new User({
        tenantId: tenantToDelete._id,
        username: 'doomed_user',
        email: 'doomed@test.com',
        password: 'password123',
        roles: ['user'],
      }).save();
      // 事前確認：ユーザーが3人（superuser, admin, doomed_user）いること
      let userCount = await User.countDocuments();
      expect(userCount).toBe(3);

      const res = await request(app)
        .delete(`/api/system/tenants/${tenantToDelete._id}`)
        .set('x-auth-token', superuserToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('テナントおよび関連データが正常に削除されました');

      // 事後確認：テナントと関連ユーザーが削除されていること
      const deletedTenant = await Tenant.findById(tenantToDelete._id);
      expect(deletedTenant).toBeNull();
      userCount = await User.countDocuments();
      expect(userCount).toBe(2); // doomed_userが削除され、2人になっている
    });
      it('should return 403 Forbidden for a non-superuser (admin)', async () => {
      const tenantToDelete = await new Tenant({ name: 'Another Tenant to Delete' }).save();
      await new User({
        tenantId: tenantToDelete._id,
        username: 'doomed_user',
        email: 'doomed@test.com',
        password: 'password123',
        roles: ['user'],
      }).save();
      const res = await request(app)
        .delete(`/api/system/tenants/${tenantToDelete._id}`)
        .set('x-auth-token', adminToken);

      expect(res.statusCode).toBe(403);
    });
    });
  });
});
