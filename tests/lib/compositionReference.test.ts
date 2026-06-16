import { describe, it, expect } from 'vitest';
import { calcResult } from '../../src/lib/calc';
import {
  REFERENCE_COMPOSITION_2025,
  buildCompositionComparison,
} from '../../src/lib/compositionReference';
import { COMPOSITION } from '../../src/strings/ja';
import type { CategoryAmounts, LivingCostInput } from '../../src/types/livingCost';

const emptyCategories: CategoryAmounts = {
  food: 0,
  dailyGoods: 0,
  utilities: 0,
  communication: 0,
  insurance: 0,
  car: 0,
  medical: 0,
  children: 0,
  leisure: 0,
  subscription: 0,
  other: 0,
};

function comp(overrides: Partial<CategoryAmounts>) {
  const input: LivingCostInput = { categories: { ...emptyCategories, ...overrides } };
  return buildCompositionComparison(calcResult(input));
}

const REF_TOTAL =
  REFERENCE_COMPOSITION_2025.food.monthlyAmount +
  REFERENCE_COMPOSITION_2025.utilities.monthlyAmount +
  REFERENCE_COMPOSITION_2025.dailyGoods.monthlyAmount +
  REFERENCE_COMPOSITION_2025.communication.monthlyAmount +
  REFERENCE_COMPOSITION_2025.car.monthlyAmount +
  REFERENCE_COMPOSITION_2025.medical.monthlyAmount +
  REFERENCE_COMPOSITION_2025.children.monthlyAmount +
  REFERENCE_COMPOSITION_2025.leisure.monthlyAmount;

describe('buildCompositionComparison — 比較対象', () => {
  it('insurance / subscription / other は比較対象から除外される', () => {
    const r = comp({ food: 100000, insurance: 50000, subscription: 30000, other: 40000 });
    const keys = r.items.map((i) => i.categoryKey);
    expect(keys).not.toContain('insurance');
    expect(keys).not.toContain('subscription');
    expect(keys).not.toContain('other');
    // comparableTotal は food のみ（保険等は除外）。
    expect(r.comparableTotal).toBe(100000);
  });

  it('referenceComparableTotal は対象8カテゴリの参考額合計', () => {
    const r = comp({ food: 100000 });
    expect(r.referenceComparableTotal).toBe(REF_TOTAL);
  });

  it('比較できる入力が無ければ items / highlighted は空', () => {
    const r = comp({ insurance: 50000 });
    expect(r.items).toHaveLength(0);
    expect(r.highlightedItems).toHaveLength(0);
  });
});

describe('buildCompositionComparison — 構成比と balanceIndex', () => {
  it('userShare / referenceShare / balanceIndex が正しい', () => {
    const r = comp({ food: 100000, communication: 100000 });
    const food = r.items.find((i) => i.categoryKey === 'food')!;
    expect(r.comparableTotal).toBe(200000);
    expect(food.userShare).toBeCloseTo(0.5, 6);
    expect(food.referenceShare).toBeCloseTo(REFERENCE_COMPOSITION_2025.food.monthlyAmount / REF_TOTAL, 6);
    expect(food.balanceIndex).toBeCloseTo(0.5 / (REFERENCE_COMPOSITION_2025.food.monthlyAmount / REF_TOTAL), 6);
  });

  it('balanceIndex 1.5以上で muchHigher', () => {
    // communication: userShare 0.5 vs ref ~0.05 → index ~10
    const r = comp({ food: 100000, communication: 100000 });
    expect(r.items.find((i) => i.categoryKey === 'communication')!.level).toBe('muchHigher');
  });

  it('balanceIndex 1.2〜1.5で higher', () => {
    // food: userShare 0.5 vs ref ~0.408 → index ~1.22
    const r = comp({ food: 100000, communication: 100000 });
    expect(r.items.find((i) => i.categoryKey === 'food')!.level).toBe('higher');
  });

  it('参考と同じ構成比なら near（balanceIndex≈1）', () => {
    const r = comp({
      food: REFERENCE_COMPOSITION_2025.food.monthlyAmount,
      utilities: REFERENCE_COMPOSITION_2025.utilities.monthlyAmount,
      dailyGoods: REFERENCE_COMPOSITION_2025.dailyGoods.monthlyAmount,
      communication: REFERENCE_COMPOSITION_2025.communication.monthlyAmount,
      car: REFERENCE_COMPOSITION_2025.car.monthlyAmount,
      medical: REFERENCE_COMPOSITION_2025.medical.monthlyAmount,
      children: REFERENCE_COMPOSITION_2025.children.monthlyAmount,
      leisure: REFERENCE_COMPOSITION_2025.leisure.monthlyAmount,
    });
    expect(r.items.every((i) => i.level === 'near')).toBe(true);
    expect(r.highlightedItems).toHaveLength(0);
  });
});

describe('buildCompositionComparison — 食費=1比のガード', () => {
  it('食費が30,000円未満なら userFoodRatio を付けない', () => {
    const r = comp({ food: 20000, communication: 20000 });
    const comm = r.items.find((i) => i.categoryKey === 'communication')!;
    expect(comm.userFoodRatio).toBeUndefined();
  });

  it('食費が30,000円以上なら userFoodRatio を付ける', () => {
    const r = comp({ food: 50000, communication: 20000 });
    const comm = r.items.find((i) => i.categoryKey === 'communication')!;
    expect(comm.userFoodRatio).toBeCloseTo(20000 / 50000, 6);
  });
});

describe('buildCompositionComparison — highlightedItems', () => {
  it('higher / muchHigher のみを最大3件返す', () => {
    const r = comp({
      food: 10000,
      communication: 50000,
      dailyGoods: 50000,
      medical: 50000,
      children: 50000,
    });
    expect(r.highlightedItems).toHaveLength(3);
    expect(r.highlightedItems.every((i) => i.level === 'higher' || i.level === 'muchHigher')).toBe(true);
  });
});

describe('COMPOSITION 文言 — 禁止表現を含まない', () => {
  // 「良い悪いを示すものではありません」は許容表現。禁止は否定的な断定フレーズ。
  const forbidden = /高すぎ|悪いです|無駄|削るべき|節約しましょう|減らしましょう|見直しが必要|平均より悪い/;
  it('levels と主要文言に禁止表現が無い', () => {
    for (const v of Object.values(COMPOSITION.levels)) expect(v).not.toMatch(forbidden);
    expect(COMPOSITION.intro).not.toMatch(forbidden);
    expect(COMPOSITION.note).not.toMatch(forbidden);
    expect(COMPOSITION.emptyNote).not.toMatch(forbidden);
  });
});
