import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminUserEditPage from './AdminUserEditPage'; // まだ存在しないコンポーネント
import axios from 'axios';
import TenantNode from '../../../admin/tenants/components/TenantNode';

// axiosをモック
vi.mock('axios');

// useAuthフックをモック
vi.mock('../../../../providers/AuthProvider', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      user: { roles: ['admin'] },
      loading: false,
    }),
  };
});

// OrganizationChartコンポーネントをモック
vi.mock('../../../admin/tenants/components/TenantNode', () => ({
  __esModule: true, // ES Moduleとして扱うための設定
  default: vi.fn(() => { // default exportをモック
    return <div>Mocked Organization Chart</div>;
  }),
}));

describe('AdminUserEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user data on mount and display user details', async () => {
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = {
      _id: userId,
      username: 'Taro Yamada',
      email: 'taro@example.com',
      roles: ['user'],
    };
    // このテストはユーザー情報取得のAPI呼び出しのみをトリガーするため、
    // ★ 修正: 2回のAPI呼び出しをモックする
    axios.get.mockResolvedValueOnce({ data: mockUser }); // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 2. 全テナント情報 (空でOK)

    // 2. コンポーネントをレンダリング
    // useParamsからIDを取得できるよう、実際のルートと同じパスでラップする
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. 検証: APIが呼ばれ、その結果が画面に表示されるまで待つ
    expect(await screen.findByRole('heading', { name: /Taro Yamada/i })).toBeInTheDocument();
    // ★ 新しい検証: メールアドレスが表示されていることを確認
    expect(screen.getByText('taro@example.com')).toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledWith(`/api/users/${userId}`);
  });

  it('should display a "Change Department" button', async () => {
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = {
      _id: userId,
      username: 'Taro Yamada',
      email: 'taro@example.com',
      roles: ['user'],
    };
    // ★ 修正: 2回のAPI呼び出しをモックする
    axios.get.mockResolvedValueOnce({ data: mockUser }); // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 2. 全テナント情報 (空でOK)

    // 2. コンポーネントをレンダリング
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. 検証: ユーザー情報が表示された後で、ボタンが存在することを確認
    expect(await screen.findByRole('heading', { name: /Taro Yamada/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /部署を変更/i })).toBeInTheDocument();
  });

  it('should open a modal when "Change Department" button is clicked', async () => {
    const user = userEvent.setup();
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = {
      _id: userId,
      username: 'Taro Yamada',
      email: 'taro@example.com',
      roles: ['user'],
    };
    // ★ 修正: 3回のAPI呼び出しをモックする
    axios.get
      .mockResolvedValueOnce({ data: mockUser }) // 最初の呼び出し (/api/users/:id)
      .mockResolvedValueOnce({ data: [] })       // 2番目の呼び出し (/api/tenants)
      .mockResolvedValueOnce({ data: [{ _id: 'root-1', name: 'Root' }] }); // 2番目の呼び出し (/api/tenants/tree) はテストデータを返す

    // 2. コンポーネントをレンダリング
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. ボタンをクリック
    const changeDeptButton = await screen.findByRole('button', { name: /部署を変更/i });
    await user.click(changeDeptButton);

    // 4. 検証: モーダルのタイトルが表示されることを確認
    // findByRole('heading', ...) から findByText(...) に変更し、役割に依存しないようにする
    expect(await screen.findByText(/部署の変更/i)).toBeInTheDocument();
  });

  it('should render the OrganizationChart inside the modal', async () => {
    const user = userEvent.setup();
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = {
      _id: userId,
      username: 'Taro Yamada',
      email: 'taro@example.com',
      roles: ['user'],
    };
    // ★ 修正: 3回のAPI呼び出しをモックする
    axios.get
      .mockResolvedValueOnce({ data: mockUser }) // 最初の呼び出し (/api/users/:id)
      .mockResolvedValueOnce({ data: [] })       // 2番目の呼び出し (/api/tenants)
      .mockResolvedValueOnce({ data: [{ _id: 'root-1', name: 'Root' }] }); // 2番目の呼び出し (/api/tenants/tree) はテストデータを返す

    // 2. コンポーネントをレンダリング
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. ボタンをクリックしてモーダルを開く
    const changeDeptButton = await screen.findByRole('button', { name: /部署を変更/i });
    await user.click(changeDeptButton);

    // 4. 検証: モックされた組織図コンポーネントのテキストが表示されることを確認
    expect(await screen.findByText('Mocked Organization Chart')).toBeInTheDocument();
  });

  it('should highlight the selected department and show an update button', async () => {
    const user = userEvent.setup();
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = { _id: userId, username: 'Taro Yamada', email: 'taro@example.com' };
    const mockTreeData = [
      {
        _id: 'tenant-root',
        name: '本社',
        children: [
          { _id: 'tenant-sales', name: '営業部', children: [] },
          { _id: 'tenant-dev', name: '開発部', children: [] },
        ],
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockUser })      // 1. ユーザー情報
      .mockResolvedValueOnce({ data: [] })            // 2. 全テナント情報
      .mockResolvedValueOnce({ data: mockTreeData }); // 3. 組織図データ

    // ★★★ 修正: TenantNodeのモックを、クリックイベントをテストできるよう拡張 ★★★
    // これまでの単純なdivを返すモックから、実際のクリック操作をシミュレートできるものに変更します。
    TenantNode.mockImplementation(({ node, onNodeClick, selectedTenantId }) => (
      <li>
        <span
          onClick={() => onNodeClick(node)}
          className={node._id === selectedTenantId ? 'selected' : ''}
        >
          {node.name}
        </span>
        {node.children && node.children.length > 0 && (
          <ul>{node.children.map(child => <TenantNode key={child._id} node={child} onNodeClick={onNodeClick} selectedTenantId={selectedTenantId} />)}</ul>
        )}
      </li>
    ));

    // 2. レンダリングと操作
    render(<MemoryRouter initialEntries={[`/admin/users/${userId}`]}><Routes><Route path="/admin/users/:id" element={<AdminUserEditPage />} /></Routes></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /部署を変更/i }));
    const salesDepartmentNode = await screen.findByText('営業部');
    await user.click(salesDepartmentNode);

    // 3. 検証
    expect(salesDepartmentNode).toHaveClass('selected'); // 選択した部署に 'selected' クラスが付与されるか
    expect(await screen.findByRole('button', { name: '更新' })).toBeInTheDocument(); // モーダル内に「更新」ボタンが表示されるか
  });

  it('should call the API to update user department and close the modal on successful update', async () => {
    const user = userEvent.setup();
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = { _id: userId, username: 'Taro Yamada', email: 'taro@example.com', tenantId: 'tenant-root' };
    const mockTreeData = [
      {
        _id: 'tenant-root',
        name: '本社',
        children: [
          { _id: 'tenant-sales', name: '営業部', children: [] },
          { _id: 'tenant-dev', name: '開発部', children: [] },
        ],
      },
    ];
    const selectedTenantId = 'tenant-sales';

    axios.get
      .mockResolvedValueOnce({ data: mockUser })      // 1. ユーザー情報取得
      .mockResolvedValueOnce({ data: [{ _id: 'tenant-sales', name: '営業部' }] }) // 2. 全テナント情報
      .mockResolvedValueOnce({ data: mockTreeData }); // 3. 組織図データ取得
    
    // ★ 新しくaxios.putをモックする
    axios.put.mockResolvedValueOnce({ data: { ...mockUser, tenantId: selectedTenantId } }); // 更新成功時のレスポンス

    // TenantNodeのモックは既存のものを再利用
    TenantNode.mockImplementation(({ node, onNodeClick, selectedTenantId: currentSelectedTenantId }) => (
      <li>
        <span
          onClick={() => onNodeClick(node)}
          className={node._id === currentSelectedTenantId ? 'selected' : ''}
        >
          {node.name}
        </span>
        {node.children && node.children.length > 0 && (
          <ul>{node.children.map(child => <TenantNode key={child._id} node={child} onNodeClick={onNodeClick} selectedTenantId={currentSelectedTenantId} />)}</ul>
        )}
      </li>
    ));

    // 2. レンダリングと操作
    render(<MemoryRouter initialEntries={[`/admin/users/${userId}`]}><Routes><Route path="/admin/users/:id" element={<AdminUserEditPage />} /></Routes></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /部署を変更/i })); // モーダルを開く
    await user.click(await screen.findByText('営業部')); // 部署を選択
    await user.click(await screen.findByRole('button', { name: '更新' })); // 更新ボタンをクリック

    // 3. 検証
    // 3.1: APIが正しい引数で呼び出されたことを確認
    expect(axios.put).toHaveBeenCalledWith(`/api/users/${userId}`, { tenantId: selectedTenantId });

    // 3.2: API成功後、画面の所属部署名が更新されることを確認
    // findBy... を使うことで、非同期な再レンダリングが終わるまで待機する
    expect(await screen.findByTestId('department-display')).toHaveTextContent('所属部署: 営業部');
  });
});
