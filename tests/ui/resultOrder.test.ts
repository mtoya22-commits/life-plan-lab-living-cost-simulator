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

describe('生活費で確認したいポイントの表示位置', () => {
  const review = source.indexOf('<ReviewPoints');

  it('カードが結果画面に存在する', () => {
    expect(review).toBeGreaterThan(-1);
  });

  it('QuickAdjust より後ろに表示される', () => {
    expect(review).toBeGreaterThan(source.indexOf('<QuickAdjust'));
  });

  it('固定費/変動費ドーナツより前に表示される', () => {
    expect(review).toBeLessThan(source.indexOf('<FixedVariableDonut'));
  });
});

describe('支出バランスの参考比較の表示位置', () => {
  const composition = source.indexOf('<CompositionReference');

  it('カードが結果画面に存在する', () => {
    expect(composition).toBeGreaterThan(-1);
  });

  it('生活費で確認したいポイントより後ろに表示される', () => {
    expect(composition).toBeGreaterThan(source.indexOf('<ReviewPoints'));
  });

  it('気になる項目を動かしてみる（カテゴリ別シナリオ）より前に表示される', () => {
    expect(composition).toBeLessThan(source.indexOf('<CategoryScenario'));
  });
});

describe('気になる項目を動かしてみる（カテゴリ別シナリオ）の表示位置', () => {
  const scenario = source.indexOf('<CategoryScenario');

  it('カードが結果画面に存在する', () => {
    expect(scenario).toBeGreaterThan(-1);
  });

  it('支出バランスの参考比較より後ろに表示される', () => {
    expect(scenario).toBeGreaterThan(source.indexOf('<CompositionReference'));
  });

  it('固定費/変動費ドーナツより前に表示される', () => {
    expect(scenario).toBeLessThan(source.indexOf('<FixedVariableDonut'));
  });
});
