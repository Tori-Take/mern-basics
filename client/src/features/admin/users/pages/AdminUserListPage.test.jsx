// c:\client\src\features\admin\users\pages\AdminUserListPage.test.jsx

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminUserListPage from './AdminUserListPage';
import axios from 'axios'; // ★ userApiServiceからaxiosに戻す
import { AuthProvider } from '../../../../providers/AuthProvider';
import { within } from '@testing-library/react'; // ★ withinをインポート
import userEvent from '@testing-library/user-event';

vi.mock('axios'); // ★ axiosをモックする

// useAuthフックをモックする
vi.mock('../../../../contexts/AuthContext', async (importOriginal) => {
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title and handle loading state', async () => {
    axios.get.mockResolvedValue({ data: [] }); // ★ axiosのモックに戻す

    render(
      <MemoryRouter>
        <AdminUserListPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /ユーザー管理/i })).toBeInTheDocument();
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });

  it('should fetch users on component mount and display them in a table', async () => {
    const mockUsers = [
      { _id: '1', username: 'Taro Yamada', email: 'taro@example.com', roles: ['user'], status: 'active' },
      { _id: '2', username: 'Hanako Suzuki', email: 'hanako@example.com', roles: ['admin', 'user'], status: 'active' },
    ];
    axios.get.mockResolvedValue({ data: mockUsers }); // ★ axiosのモックに戻す

    render(
      <MemoryRouter>
        <AdminUserListPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Taro Yamada')).toBeInTheDocument();
    expect(screen.getByText('Hanako Suzuki')).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/users'); // ★ axiosの呼び出しを検証
    });
  });

  it('should navigate to the user edit page when a user link is clicked', async () => {
    const mockUsers = [
      { _id: 'user-123', username: 'Taro Yamada', email: 'taro@example.com', roles: ['user'], status: 'active' },
    ];
    axios.get.mockResolvedValue({ data: mockUsers }); // ★ axiosのモックに戻す

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/admin/users" element={<AdminUserListPage />} />
          <Route path="/admin/users/:id" element={<div>Edit User Page for user-123</div>} />
        </Routes>
      </MemoryRouter>
    );

    // 1. "Taro Yamada" を含む行を探す
    const userRow = await screen.findByRole('row', { name: /Taro Yamada/i });

    // 2. その行の中から「編集」リンクを探す
    const editLink = within(userRow).getByRole('link', { name: '編集' });

    // 3. 検証: リンクが正しい遷移先を持っているか
    expect(editLink).toHaveAttribute('href', '/admin/users/user-123');

    // 4. リンクをクリック
    await userEvent.click(editLink);

    // 5. 検証: ページが遷移したか
    expect(await screen.findByText('Edit User Page for user-123')).toBeInTheDocument();
  });
});
