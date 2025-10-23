import { render, screen } from '@testing-library/react';
import AlertMessage from './AlertMessage';

describe('AlertMessage Component', () => {

  // テストケース1: メッセージが正しく表示されるか
  it('should render the message correctly', () => {
    const testMessage = 'これはテストメッセージです。';
    render(<AlertMessage>{testMessage}</AlertMessage>);

    // `screen.getByText` を使って、指定したテキストが画面上に存在するかを探します。
    // `toBeInTheDocument` マッチャーで、要素がDOM内に存在することを検証します。
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  // テストケース2: variantに応じて正しいスタイルが適用されるか
  it('should apply the correct variant class', () => {
    const testMessage = 'これは危険を知らせるメッセージです。';
    render(<AlertMessage variant="danger">{testMessage}</AlertMessage>);

    const alertElement = screen.getByText(testMessage);
    // Bootstrapの命名規則に従い、'alert-danger'というCSSクラスを持っていることを検証します。
    expect(alertElement).toHaveClass('alert-danger');
  });
});