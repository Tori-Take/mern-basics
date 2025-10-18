import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';

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
    loading: true, // isLoadingからloadingに統一
    user: null,
    forceReset: false, // パスワード強制リセット用のフラグを追加
  });

  // アプリケーションの初回起動時にユーザー情報を読み込む
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token); // axiosのデフォルトヘッダーにトークンを設定
      loadUser();
    } else {
      // トークンがない場合はローディングを終了
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []); // 初回レンダリング時に一度だけ実行

  // ユーザー情報を読み込む処理
  const loadUser = async () => {
    try {
      const res = await axios.get('/api/users/auth'); // ユーザー情報を取得するAPI
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        loading: false,
        user: res.data,
        forceReset: res.data.forcePasswordReset,
      }));
    } catch (err) {
      // トークンが無効などの理由で失敗した場合
      localStorage.removeItem('token');
      setAuthState({
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        forceReset: false,
      });
    }
  };

  // ログイン処理
  const login = async (email, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email, password });

    try {
      const res = await axios.post('/api/users/login', body, config);
      
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);

      // ログイン成功後、レスポンスに含まれるユーザー情報で直接stateを更新
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        loading: false,
        user: res.data.user,
        forceReset: res.data.forceReset || false,
      }));

    } catch (err) {
      // エラーが発生した場合は、呼び出し元にエラーを再スローしてLoginPageで処理させる
      throw err;
    }
  };

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem('token'); // トークンを削除
    setAuthState({ token: null, isAuthenticated: false, loading: false, user: null, forceReset: false }); // Stateを完全にリセット
    setAuthToken(null); // axiosのヘッダーからもトークンを削除
  };

  const value = {
    ...authState,
    login,
    logout,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
