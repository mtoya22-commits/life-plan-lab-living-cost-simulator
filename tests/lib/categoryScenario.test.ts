import { describe, it, expect } from 'vitest';
import { calcResult } from '../../src/lib/calc';
import {
  CAREFUL_CATEGORIES,
  SCENARIO_STEPS,
  buildCategoryScenario,
  hasCategoryScenario,
  orderScenarioKeys,
} from '../../src/lib/categoryScenario';
import { SCENARIO } from '../../src/strings/ja';
import type { CategoryAmounts, CategoryKey, LivingCostInput } from '../../src/types/livingCost';

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

// 内訳合計 310,000円。
const sampleInput: LivingCostInput = {
  categories: {
    ...emptyCategories,
    food: 90000,
    communication: 18000,
    insurance: 30000,
    car: 50000,
    subscription: 8000,
    utilities: 20000,
    leisure: 30000,
    dailyGoods: 20000,
    medical: 14000,
    children: 30000,
  },
};

const baseResult = calcResult(sampleInput);

describe('buildCategoryScenario', () => {
  it('1カテゴリ調整で scenarioMonthlyTotal が正しく変わる', () => {
    const s = buildCategoryScenario(baseResult, { communication: 12000 });
    expect(s.baseMonthlyTotal).toBe(310000);
    expect(s.scenarioMonthlyTotal).toBe(310000 - 6000); // 18000 -> 12000
    expect(s.diffMonthly).toBe(-6000);
    expect(s.diffAnnual).toBe(-72000);
    expect(s.diffTenYears).toBe(-720000);
  });

  it('複数カテゴリを調整すると diffMonthly が合算される', () => {
    const s = buildCategoryScenario(baseResult, {
      communication: 13000, // -5000
      subscription: 5000, // -3000
      insurance: 25000, // -5000
    });
    expect(s.diffMonthly).toBe(-13000);
    expect(s.scenarioMonthlyTotal).toBe(310000 - 13000);
    expect(s.adjustments).toHaveLength(3);
  });

  it('scenarioMonthly は0円未満にならない', () => {
    const s = buildCategoryScenario(baseResult, { communication: -5000 });
    const adj = s.adjustments.find((a) => a.categoryKey === 'communication');
    expect(adj?.scenarioMonthly).toBe(0);
    expect(s.scenarioMonthlyTotal).toBeGreaterThanOrEqual(0);
  });

  it('見直し後の生活費は0円未満にならない', () => {
    const s = buildCategoryScenario(baseResult, { food: 0, car: 0, insurance: 0 });
    expect(s.scenarioMonthlyTotal).toBeGreaterThanOrEqual(0);
  });

  it('空 overrides（リセット相当）で adjustments 空・差分0', () => {
    const s = buildCategoryScenario(baseResult, {});
    expect(s.adjustments).toHaveLength(0);
    expect(s.diffMonthly).toBe(0);
    expect(s.scenarioMonthlyTotal).toBe(s.baseMonthlyTotal);
    expect(hasCategoryScenario(s)).toBe(false);
  });

  it('差分があれば hasCategoryScenario が true', () => {
    expect(hasCategoryScenario(buildCategoryScenario(baseResult, { communication: 12000 }))).toBe(true);
  });

  it('現在と同額の override は差分0扱い', () => {
    const s = buildCategoryScenario(baseResult, { communication: 18000 });
    expect(s.diffMonthly).toBe(0);
    expect(hasCategoryScenario(s)).toBe(false);
  });
});

describe('SCENARIO_STEPS — 慎重カテゴリ', () => {
  it('医療費には減額ボタン（ステップ）を出さない', () => {
    expect(SCENARIO_STEPS.medical).toEqual([]);
  });
  it('子ども関連費には減額ボタン（ステップ）を出さない', () => {
    expect(SCENARIO_STEPS.children).toEqual([]);
  });
  it('慎重カテゴリに医療費・子ども関連費が含まれる', () => {
    expect(CAREFUL_CATEGORIES).toContain('medical');
    expect(CAREFUL_CATEGORIES).toContain('children');
  });
  it('見直しやすい固定費にはステップがある', () => {
    expect(SCENARIO_STEPS.communication.length).toBeGreaterThan(0);
    expect(SCENARIO_STEPS.subscription.length).toBeGreaterThan(0);
  });
});

describe('orderScenarioKeys — チップ並び順', () => {
  const available: CategoryKey[] = ['food', 'communication', 'car', 'leisure'];

  it('優先カテゴリ（構成比が大きめ等）を先頭に並べる', () => {
    // car を構成比高として優先指定 → 先頭に来る。
    const ordered = orderScenarioKeys(available, ['car']);
    expect(ordered[0]).toBe('car');
    expect(ordered).toEqual(['car', 'food', 'communication', 'leisure']);
  });

  it('priorityKeys の順序を保ち、重複・対象外は無視する', () => {
    const ordered = orderScenarioKeys(available, ['leisure', 'communication', 'leisure', 'utilities']);
    expect(ordered).toEqual(['leisure', 'communication', 'food', 'car']);
  });

  it('available に無いカテゴリは並びに入らない', () => {
    const ordered = orderScenarioKeys(available, ['medical']);
    expect(ordered).not.toContain('medical');
    expect(ordered).toHaveLength(available.length);
  });
});

describe('SCENARIO 文言 — 禁止表現を含まない', () => {
  const forbidden = /削る|無駄|高すぎ|節約しましょう|解約しましょう|手放|減らしましょう|平均より悪い/;
  it('SCENARIO の文字列値に禁止表現が無い', () => {
    for (const v of Object.values(SCENARIO)) {
      if (typeof v === 'string') expect(v).not.toMatch(forbidden);
    }
  });
});
