import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 1. Contextオブジェクトの作成
const AuthContext = createContext();

// 2. Contextにアクセスするためのカスタムフック
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Contextを提供するプロバイダーコンポーネント
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token'), // localStorageからトークンを読み込む
    isAuthenticated: null,
    isLoading: true,
    user: null,
  });

  // アプリケーションの初回起動時にユーザー情報を読み込む
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      loadUser();
    } else {
      // トークンがない場合はローディングを終了
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []); // 初回レンダリング時に一度だけ実行

  // トークンが更新されたらlocalStorageにも保存
  useEffect(() => {
    localStorage.setItem('token', authState.token);
  }, [authState.token]);

  // ユーザー情報を読み込む処理
  const loadUser = async () => {
    console.log('【Auth】1. loadUser: ユーザー情報の読み込みを開始します。');
    try {
      const res = await axios.get('/api/users/auth'); // 正しいエンドポイントURLに修正
      console.log('【Auth】2. loadUser: ユーザー情報の取得に成功しました。', res.data);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        user: res.data,
      }));
    } catch (err) {
      console.error('【Auth】3. loadUser: ユーザー情報の取得に失敗しました。', err.response ? err.response.data : err.message);
      logout();
    }
  };

  // 登録処理
  const register = async (username, email, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ username, email, password });
    console.log('【Auth】A. register: 登録APIを呼び出します。');
    try {
      const res = await axios.post('/api/users/register', body, config);
      console.log('【Auth】B. register: トークンの取得に成功しました。', res.data.token);
      const { token } = res.data;
      // 新しいトークンをlocalStorageとaxiosヘッダーに即時セット
      localStorage.setItem('token', token);
      axios.defaults.headers.common['x-auth-token'] = token;
      // stateのtokenも更新
      setAuthState(prev => ({ ...prev, token }));
      // ユーザー情報を読み込み、完了するまで待つ
      await loadUser();
    } catch (err) {
      console.error('【Auth】C. register: 登録に失敗しました。', err.response ? err.response.data : err.message);
      throw err; // エラーを呼び出し元に再スローする
    }
  };

  // ログイン処理
  const login = async (username, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ username, password });
    console.log('【Auth】A. login: ログインAPIを呼び出します。');
    try {
      const res = await axios.post('/api/users/login', body, config);
      console.log('【Auth】B. login: トークンの取得に成功しました。', res.data.token);
      const { token } = res.data;
      // 新しいトークンをlocalStorageとaxiosヘッダーに即時セット
      localStorage.setItem('token', token);
      axios.defaults.headers.common['x-auth-token'] = token;
      // stateのtokenも更新
      setAuthState(prev => ({ ...prev, token }));
      // ユーザー情報を読み込み、完了するまで待つ
      await loadUser();
    } catch (err) {
      console.error('【Auth】C. login: ログインに失敗しました。', err.response ? err.response.data : err.message);
      throw err; // エラーを呼び出し元に再スローする
    }
  };

  // ログアウト処理
  const logout = () => {
    console.log('【Auth】logout: ログアウト処理を実行します。');
    delete axios.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('token');
    setAuthState({ token: null, isAuthenticated: false, isLoading: false, user: null });
  };

  const value = {
    ...authState,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
