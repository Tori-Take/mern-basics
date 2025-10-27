// c:\client\src\features\admin\users\pages\AdminUserListPage.test.jsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminUserListPage from './AdminUserListPage';
import axios from 'axios';

// axiosをモックする
vi.mock('axios');

// useAuthフックをモックする
vi.mock('../../../../providers/AuthProvider', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      user: { roles: ['admin'] }, // テスト用の管理者ユーザー
      loading: false,
    }),
  };
});

describe('AdminUserListPage', () => {
  // 各テストの前にモックの状態をリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title and handle loading state', async () => {
    // For this simple test, we just need axios to resolve so the component can finish loading.
    axios.get.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <AdminUserListPage />
      </BrowserRouter>
    );

    // 1. Assert that the main title is always present.
    expect(screen.getByRole('heading', { name: /ユーザー管理/i })).toBeInTheDocument();

    // 2. Assert that the loading text is initially visible.
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    // 3. Wait for the loading to complete and the loading text to disappear.
    //    This ensures the test waits for the useEffect's state updates to finish.
    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });

  it('should fetch users on component mount and display them in a table', async () => {
    // 1. モックの準備: axios.getが呼ばれたら、テスト用のユーザーデータを返すように設定
    const mockUsers = [
      { _id: '1', username: 'Taro Yamada', email: 'taro@example.com', roles: ['user'] },
      { _id: '2', username: 'Hanako Suzuki', email: 'hanako@example.com', roles: ['admin', 'user'] },
    ];
    axios.get.mockResolvedValue({ data: mockUsers });

    // 2. コンポーネントをレンダリング
    render(
      <BrowserRouter>
        <AdminUserListPage />
      </BrowserRouter>
    );

    // 3. 検証: APIが呼び出され、その結果が画面に表示されるまで待つ
    // findBy... クエリは要素が表示されるまで自動的に待機するため、act警告を解消できる
    expect(await screen.findByText('Taro Yamada')).toBeInTheDocument();
    expect(screen.getByText('Hanako Suzuki')).toBeInTheDocument();

    // 念のため、APIが正しく呼ばれたことも確認
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/users');
    });
  });

  it('should navigate to the user edit page when a user link is clicked', async () => {
    const user = userEvent.setup();
    // 1. モックの準備
    const mockUsers = [
      { _id: 'user-123', username: 'Taro Yamada', email: 'taro@example.com', roles: ['user'] },
    ];
    axios.get.mockResolvedValue({ data: mockUsers });

    // 2. コンポーネントをレンダリング
    render(
      <BrowserRouter>
        <AdminUserListPage />
      </BrowserRouter>
    );

    // 3. "Taro Yamada" のリンクが表示されるまで待つ
    const userLink = await screen.findByRole('link', { name: /Taro Yamada/i });

    // 4. 検証: リンクが正しい遷移先を持っているか
    expect(userLink).toHaveAttribute('href', '/admin/users/user-123');
  });
});
