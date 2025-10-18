const mongoose = require('mongoose');
const Tenant = require('../../models/tenant.model');

/**
 * ログイン中の管理者がアクセス可能な全てのテナントIDのリストを取得する
 * @param {string | mongoose.Types.ObjectId} userTenantId - ログイン中管理者のテナントID
 * @returns {Promise<Array<mongoose.Types.ObjectId>>} - アクセス可能なテナントIDの配列
 */
const getAccessibleTenantIds = async (userTenantId) => {
  if (!userTenantId) {
    return [];
  }

  // Ensure tenantId is a valid ObjectId
  const tenantId = mongoose.Types.ObjectId.isValid(userTenantId) ? new mongoose.Types.ObjectId(userTenantId) : null;

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
