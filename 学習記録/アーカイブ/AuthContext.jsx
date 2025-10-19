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

  // トークンが変更されるたびにaxiosのデフォルトヘッダーを設定
  useEffect(() => {
    if (authState.token) {
      axios.defaults.headers.common['x-auth-token'] = authState.token;
      localStorage.setItem('token', authState.token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  }, [authState.token]);


  // 登録処理
  const register = async (username, email, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ username, email, password });

    try {
      const res = await axios.post('/api/users/register', body, config);
      setAuthState({
        ...authState,
        token: res.data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      // エラー処理は後ほど追加
      console.error(err.response.data);
    }
  };

  // ログイン処理
  const login = async (username, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ username, password });

    try {
      const res = await axios.post('/api/users/login', body, config);
      setAuthState({
        ...authState,
        token: res.data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      // エラー処理は後ほど追加
      console.error(err.response.data);
    }
  };

  // ログアウト処理
  const logout = () => {
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
