const mongoose = require('mongoose');
const Tenant = require('../../domains/organization/tenant.model');
const User = require('../../domains/identity/user.model');

/**
 * ログイン中の管理者がアクセス可能な全てのテナントIDのリストを取得する
 * @param {object} operator - 操作を実行している管理者ユーザーのオブジェクト (req.user)
 * @returns {Promise<Array<mongoose.Types.ObjectId>>} - アクセス可能なテナントIDの配列
 */
const getAccessibleTenantIds = async (operator) => {
  if (!operator) {
    return [];
  }

  // ★★★ Superuserの特別扱いロジックを追加 ★★★
  if (operator && operator.roles.includes('superuser')) {
    // もしSuperuserなら、全てのテナントIDを返す
    const allTenants = await Tenant.find({}).select('_id');
    return allTenants.map(t => t._id);
  }
  // ★★★ ここまで ★★★

  const operatorTenantId = operator.tenantId;

  // Ensure tenantId is a valid ObjectId
  const tenantId = mongoose.Types.ObjectId.isValid(operatorTenantId) ? new mongoose.Types.ObjectId(operatorTenantId) : null;

  if (!tenantId) {
    return [];
  }

  const aggregationResult = await Tenant.aggregate([
    { $match: { _id: tenantId } },
    {
      $graphLookup: {
        from: 'tenants',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parent',
        as: 'descendants'
      }
    }
  ]);

  const resultIds = aggregationResult[0] ? [aggregationResult[0]._id, ...aggregationResult[0].descendants.map(d => d._id)] : [];
  return resultIds;
};

module.exports = { getAccessibleTenantIds };
