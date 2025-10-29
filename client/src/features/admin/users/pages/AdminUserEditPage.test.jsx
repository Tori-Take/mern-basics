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
    // ★ 修正: 3回のAPI呼び出しを順番にモックする
    axios.get.mockResolvedValueOnce({ data: mockUser }); // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 2. 全ロール情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 3. 全テナント情報
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // 4. 全アプリケーション情報

    // 2. コンポーネントをレンダリング
    // useParamsからIDを取得できるよう、実際のルートと同じパスでラップする
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. 検証: ユーザー名が表示されるまで待つ
    expect(await screen.findByDisplayValue('Taro Yamada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('taro@example.com')).toBeInTheDocument();
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
    axios.get.mockResolvedValueOnce({ data: mockUser }); // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 2. 全ロール情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 3. 全テナント情報
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // 4. 全アプリケーション情報

    // 2. コンポーネントをレンダリング
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. 検証: ユーザー情報が表示された後で、ボタンが存在することを確認
    await screen.findByDisplayValue('Taro Yamada');
    expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
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
    // ★ 修正: ページ表示(3回) + モーダル(1回) = 4回のAPI呼び出しをモック
    axios.get.mockResolvedValueOnce({ data: mockUser }); // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 2. 全ロール情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 3. 全テナント情報
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // 4. 全アプリケーション情報
    axios.get.mockResolvedValueOnce({ data: [{ _id: 'root-1', name: 'Root' }] }); // 4. 組織図データ

    // 2. コンポーネントをレンダリング
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. ボタンをクリック
    const changeDeptButton = await screen.findByRole('button', { name: '変更' });
    await user.click(changeDeptButton);

    // 4. 検証: モーダルのタイトルが表示されることを確認
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
    // ★ 修正: ページ表示(3回) + モーダル(1回) = 4回のAPI呼び出しをモック
    axios.get.mockResolvedValueOnce({ data: mockUser }); // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 2. 全ロール情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 3. 全テナント情報
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // 4. 全アプリケーション情報
    axios.get.mockResolvedValueOnce({ data: [{ _id: 'root-1', name: 'Root' }] }); // 4. 組織図データ

    // 2. コンポーネントをレンダリング
    render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 3. ボタンをクリックしてモーダルを開く
    const changeDeptButton = await screen.findByRole('button', { name: '変更' });
    await user.click(changeDeptButton);

    // 4. 検証: モックされた組織図コンポーネントのテキストが表示されることを確認
    expect(await screen.findByText('Mocked Organization Chart')).toBeInTheDocument();
  });

  it('should highlight the selected department and show an update button', async () => {
    const user = userEvent.setup();
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = { _id: userId, username: 'Taro Yamada', email: 'taro@example.com', roles: [] };
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

    // ★ 修正: ページ表示(3回) + モーダル(1回) = 4回のAPI呼び出しをモック
    axios.get.mockResolvedValueOnce({ data: mockUser });     // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });           // 2. 全ロール情報
    axios.get.mockResolvedValueOnce({ data: [] });           // 3. 全テナント情報
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // 4. 全アプリケーション情報
    axios.get.mockResolvedValueOnce({ data: mockTreeData }); // 4. 組織図データ

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
    await user.click(await screen.findByRole('button', { name: '変更' }));
    const salesDepartmentNode = await screen.findByText('営業部');
    await user.click(salesDepartmentNode);

    // 3. 検証
    expect(salesDepartmentNode).toHaveClass('selected'); // 選択した部署に 'selected' クラスが付与されるか
    expect(await screen.findByRole('button', { name: '選択' })).toBeInTheDocument(); // モーダル内に「選択」ボタンが表示されるか
  });

  it('should call the API to update user department and close the modal on successful update', async () => {
    const user = userEvent.setup();
    // 1. モックの準備
    const userId = 'user-123';
    const mockUser = { _id: userId, username: 'Taro Yamada', email: 'taro@example.com', tenantId: 'tenant-root', roles: [] };
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

    // ★ 修正: ページ表示(3回) + モーダル(1回) = 4回のAPI呼び出しをモック
    axios.get.mockResolvedValueOnce({ data: mockUser }); // 1. ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 2. 全ロール情報
    axios.get.mockResolvedValueOnce({ data: [{ _id: 'tenant-sales', name: '営業部' }] }); // 3. 全テナント情報
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // 4. 全アプリケーション情報
    axios.get.mockResolvedValueOnce({ data: mockTreeData }); // 4. 組織図データ
    
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
    await user.click(await screen.findByRole('button', { name: '変更' })); // モーダルを開く
    await user.click(await screen.findByText('営業部')); // 部署を選択
    await user.click(await screen.findByRole('button', { name: '選択' })); // 選択ボタンをクリック

    // 3. 検証
    // 3.1: 部署名がフォームのテキストボックスに反映されることを確認
    const departmentInput = await screen.findByDisplayValue('営業部');
    expect(departmentInput).toBeInTheDocument();

    // 3.2: 更新ボタンをクリックしてAPIが呼ばれることを確認
    await user.click(screen.getByRole('button', { name: '更新' }));
    expect(axios.put).toHaveBeenCalledWith(`/api/users/${userId}`, expect.objectContaining({ tenantId: selectedTenantId }));
  });

  // ★ 修正: テストケースをチェックボックスUIに合わせて修正
  it('should display and allow updating user permissions via checkboxes', async () => {
    const user = userEvent.setup();
    const userId = 'user-perm-123';
    const mockUser = {
      _id: userId,
      username: 'Permission User',
      email: 'perm@example.com',
      roles: ['user'],
      tenantId: 'tenant-1',
      permissions: ['CAN_USE_TODO'], // 初期権限はTODOのみ
    };
    const mockApplications = [
      { _id: 'app1', name: 'TODOリスト', permissionKey: 'CAN_USE_TODO' },
      { _id: 'app2', name: 'スケジュール管理', permissionKey: 'CAN_USE_SCHEDULE' },
    ]; // ★ 修正: オブジェクトの閉じ括弧 `}` を配列の閉じ括弧 `]` に修正

    // 1. モックの準備
    axios.get.mockResolvedValueOnce({ data: mockUser }); // ユーザー情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 全ロール情報
    axios.get.mockResolvedValueOnce({ data: [] });       // 全テナント情報
    axios.get.mockResolvedValueOnce({ data: { data: mockApplications } }); // ★ 全アプリケーション情報
    axios.put.mockResolvedValue({ data: {} }); // 更新APIのモック

    // 2. レンダリング
    render(<MemoryRouter initialEntries={[`/admin/users/${userId}`]}><Routes><Route path="/admin/users/:id" element={<AdminUserEditPage />} /></Routes></MemoryRouter>);

    // 3. 検証: チェックボックスが表示され、初期状態が正しいか
    const todoCheckbox = await screen.findByLabelText(/TODOリスト/);
    const scheduleCheckbox = await screen.findByLabelText(/スケジュール管理/);
    expect(todoCheckbox).toBeChecked();
    expect(scheduleCheckbox).not.toBeChecked();

    // 4. 操作: 「スケジュール管理」のチェックボックスをクリックし、更新ボタンをクリック
    await user.click(scheduleCheckbox);
    await user.click(screen.getByRole('button', { name: /更新/i }));

    // 5. 検証: 更新APIが正しいpermissionsデータと共に呼ばれたか
    expect(axios.put).toHaveBeenCalledWith(`/api/users/${userId}`, expect.objectContaining({
      permissions: ['CAN_USE_TODO', 'CAN_USE_SCHEDULE'], // 両方の権限が含まれていること
    }));
  });
});
