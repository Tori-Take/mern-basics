import axios from 'axios';

const setAuthToken = token => {
  if (token) {
    // ログインしている場合、すべてのaxiosリクエストのヘッダーにトークンを付与する
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    // ログアウトした場合、ヘッダーからトークンを削除する
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

export default setAuthToken;