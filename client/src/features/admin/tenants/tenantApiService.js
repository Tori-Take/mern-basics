import axios from 'axios';

const API_URL = '/api/tenants';

/**
 * ログインユーザーがアクセス可能なテナントのリストを取得します。
 * @returns {Promise<Array>} テナントのフラットな配列
 */
const getTenants = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

/**
 * ログインユーザーのテナント階層をツリー構造で取得します。
 * @returns {Promise<Array>} テナントのツリー構造データ
 */
const getTenantTree = async () => {
  const response = await axios.get(`${API_URL}/tree`);
  return response.data;
};

export const tenantApiService = {
  getTenants,
  getTenantTree,
};
