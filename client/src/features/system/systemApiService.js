import axios from 'axios';

// APIのエンドポイントURL
const API_URL = '/api/system/tenants';

/**
 * 全てのテナントを取得します。
 * Superuser権限が必要です。
 * @returns {Promise<Array>} テナントの配列
 */
const getAllTenants = async () => {
  // AuthProviderでaxiosのデフォルトヘッダーにトークンが設定されていることを想定
  const response = await axios.get(API_URL);
  return response.data;
};

/**
 * 指定されたIDのテナントを削除します。
 * Superuser権限が必要です。
 * @param {string} tenantId 削除するテナントのID
 * @returns {Promise<object>} バックエンドからの成功メッセージ
 */
const deleteTenant = async (tenantId) => {
  const response = await axios.delete(`${API_URL}/${tenantId}`);
  return response.data;
};

// 各関数をオブジェクトにまとめてエクスポート
export const systemApiService = {
  getAllTenants,
  deleteTenant,
};
