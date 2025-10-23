import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from './LoginPage';
import { AuthProvider, useAuth } from '../../../providers/AuthProvider';

// useAuthフックをモック（偽物）に置き換える
vi.mock('../../../providers/AuthProvider', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    // useAuthが呼ばれたら、テストで定義する偽の関数/値を返すようにする
    useAuth: vi.fn(),
  };
});

describe('LoginPage Component', () => {
  // 各テストの前に、モックを初期状態に戻す
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // テストケース: フォームの入力フィールドに正しく入力できるか
  it('should allow user to type into email and password fields', async () => {
    // userEventを使うテストは非同期になるため、async/awaitを使います
    const user = userEvent.setup();

    // 1. コンポーネントをレンダリング
    // LoginPageは内部で<Link>などを使っている可能性があるため、MemoryRouterでラップします
    // このテストではuseAuthをモックしていないため、本物のAuthProviderが必要
    useAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false,
    });
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // 2. 入力フィールドを取得 (ラベルのテキストで探すのが推奨される方法です)
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);

    // 3. ユーザーのタイピングをシミュレート
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // 4. 入力された値が正しいかを検証
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  // テストケース: フォーム送信時にlogin関数が正しい引数で呼ばれるか
  it('should call login function with form data on submit', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn(); // login関数のモックを作成
    // useAuthが呼ばれたら、このテストケース用の値を返すように設定
    useAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
    });

    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    // フォームに入力
    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com');
    await user.type(screen.getByLabelText(/パスワード/i), 'password123');

    // ログインボタンをクリック
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    // loginモック関数が、正しい引数で呼び出されたことを検証
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  // テストケース: ログイン失敗時にエラーメッセージが表示されるか
  it('should display an error message on failed login', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockRejectedValue({
      response: { data: { message: 'ログインに失敗しました。' } },
    }); // 失敗をシミュレートするモック
    useAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
    });

    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    // フォームに入力して送信
    await user.type(screen.getByLabelText(/メールアドレス/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/パスワード/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    // エラーメッセージが画面に表示されるのを待って検証
    // findBy... は要素が表示されるまで待機する非同期クエリ
    const errorMessage = await screen.findByText('ログインに失敗しました。');
    expect(errorMessage).toBeInTheDocument();
  });
});