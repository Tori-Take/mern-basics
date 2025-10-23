const mongoose = require('mongoose');
const Tenant = require('../../organization/tenant.model');
const User = require('../../identity/user.model');
const Todo = require('../../task/todo.model');

class SystemService {
  /**
   * @description Find all tenants in the database.
   */
  async findAllTenants() {
    return await Tenant.find({}).sort({ createdAt: -1 });
  }

  /**
   * @description Deletes a tenant and all associated data (Users, Todos) within a transaction.
   * @param {string} tenantId - The ID of the tenant to delete.
   */
  async deleteTenantAndAssociatedData(tenantId) {
    // テスト環境ではトランザクションをサポートしていないため、条件分岐
    if (process.env.NODE_ENV === 'test') {
      return this.deleteWithoutTransaction(tenantId);
    } else {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await this.deleteLogic(tenantId, session);
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  }

  async deleteWithoutTransaction(tenantId) {
    // トランザクションなしで削除ロジックを実行
    await this.deleteLogic(tenantId);
  }

  async deleteLogic(tenantId, session = null) {
    // 1. 削除対象のテナントが存在するか確認
    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      const error = new Error('指定されたテナントが見つかりません。');
      error.statusCode = 404;
      throw error;
    }

    // 2. 削除対象テナントに所属するユーザーのIDリストを取得
    const usersToDelete = await User.find({ tenantId: tenantId }).select('_id').session(session);
    const userIdsToDelete = usersToDelete.map(user => user._id);

    // 3. 関連するユーザーが作成したTodoをすべて削除
    if (userIdsToDelete.length > 0) {
      await Todo.deleteMany({ user: { $in: userIdsToDelete } }).session(session);
    }

    // 4. 関連するユーザーをすべて削除
    await User.deleteMany({ _id: { $in: userIdsToDelete } }).session(session);

    // 5. テナント自体を削除
    await Tenant.findByIdAndDelete(tenantId).session(session);
  }
}

module.exports = SystemService;
