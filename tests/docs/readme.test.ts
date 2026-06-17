import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const readme = readFileSync(
  fileURLToPath(new URL('../../README.md', import.meta.url)),
  'utf-8',
);

describe('README', () => {
  it('2つの localStorage キーが記載されている', () => {
    expect(readme).toContain('lifePlanLab:livingCost');
    expect(readme).toContain('lifePlanLab:livingCostDraft');
  });

  it('確定データと下書きの区別が記載されている', () => {
    expect(readme).toMatch(/確定データ/);
    expect(readme).toMatch(/下書き|入力途中/);
  });

  it('URL パラメータ仕様が記載されている', () => {
    expect(readme).toContain('livingCostMonthly');
    expect(readme).toContain('livingCostSource');
  });

  it('総合版リポジトリは変更しない旨が記載されている', () => {
    expect(readme).toMatch(/総合版.*変更しません|変更しません.*総合版/s);
  });
});
