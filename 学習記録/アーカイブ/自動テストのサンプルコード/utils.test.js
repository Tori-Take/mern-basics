// テスト対象のファイルから `sum` 関数をインポートします
const { sum } = require('./utils.js');

// `describe` は、関連するテストをグループ化するためのものです。
// 第一引数には、テストグループの説明を記述します。
describe('sum function', () => {
  // `it` (または `test`) は、個々のテストケースを定義します。
  // 第一引数には、このテストが何を検証するのかを具体的に記述します。
  it('should return the sum of two positive numbers', () => {
    // `expect` は、値が特定の条件を満たすことを表明（アサーション）します。
    // ここでは `sum(1, 2)` の結果が `3` であることを期待しています。
    const result = sum(1, 2);
    // `.toBe()` は「マッチャー」の一つで、厳密な等価性（===）をチェックします。
    expect(result).toBe(3);
  });

  // 別のテストケースを追加してみましょう
  it('should return a negative number when summing a positive and a larger negative number', () => {
    expect(sum(5, -10)).toBe(-5);
  });
});
