import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 世帯人数別の参考比較は「主役にしない」方針。結果画面のソース上で、
// 比較カードが主要表示（QuickAdjust・改善効果表・ドーナツ・横棒）より後ろに
// あることを検証する（依存追加なしでソース順を確認）。
const source = readFileSync(
  fileURLToPath(new URL('../../src/features/results/ResultScreen.tsx', import.meta.url)),
  'utf-8',
);

describe('結果画面の表示順', () => {
  const household = source.indexOf('<HouseholdComparison');

  it('世帯比較カードが結果画面に存在する', () => {
    expect(household).toBeGreaterThan(-1);
  });

  it('世帯比較カードは QuickAdjust より後ろ', () => {
    expect(household).toBeGreaterThan(source.indexOf('<QuickAdjust'));
  });

  it('世帯比較カードは固定費/変動費ドーナツより後ろ', () => {
    expect(household).toBeGreaterThan(source.indexOf('<FixedVariableDonut'));
  });

  it('世帯比較カードはカテゴリ別内訳（横棒）より後ろ', () => {
    expect(household).toBeGreaterThan(source.indexOf('<BreakdownBars'));
  });
});
