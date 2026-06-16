import { describe, it, expect } from 'vitest';
import {
  adjustedMonthly,
  buildStoragePayload,
  calcResult,
  improvementEffect,
  resolveSelectedMonthly,
  sanitizeAmount,
  sumBreakdown,
} from '../../src/lib/calc';
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

function withCategories(overrides: Partial<CategoryAmounts>): CategoryAmounts {
  return { ...emptyCategories, ...overrides };
}

// 代表的な入力: 合計 35万円、内訳 31万円（未分類 4万円）。
const sampleInput: LivingCostInput = {
  monthlyTotal: 350000,
  categories: withCategories({
    food: 90000, // 変動
    dailyGoods: 20000, // 変動
    utilities: 20000, // 固定
    communication: 15000, // 固定
    insurance: 30000, // 固定
    car: 50000, // 固定
    medical: 5000, // 変動
    children: 30000, // 変動
    leisure: 30000, // 変動
    subscription: 5000, // 固定
    other: 15000, // 変動
  }),
};

describe('sanitizeAmount', () => {
  it('負値・NaN・undefined を 0 に丸める', () => {
    expect(sanitizeAmount(-100)).toBe(0);
    expect(sanitizeAmount(Number.NaN)).toBe(0);
    expect(sanitizeAmount(undefined)).toBe(0);
    expect(sanitizeAmount(null)).toBe(0);
    expect(sanitizeAmount(1234)).toBe(1234);
  });
});

describe('sumBreakdown', () => {
  it('内訳合計が正しく計算される', () => {
    expect(sumBreakdown(sampleInput.categories)).toBe(310000);
  });

  it('空欄・0 入力でも 0 を返しクラッシュしない', () => {
    expect(sumBreakdown(emptyCategories)).toBe(0);
  });

  it('負の値が混ざっても 0 として扱う', () => {
    expect(sumBreakdown(withCategories({ food: -5000, dailyGoods: 1000 }))).toBe(1000);
  });
});

describe('calcResult', () => {
  const result = calcResult(sampleInput);

  it('年間生活費は monthlyTotal × 12', () => {
    expect(result.annualTotal).toBe(350000 * 12);
    expect(result.annualTotal).toBe(4200000);
  });

  it('内訳合計を計算する', () => {
    expect(result.breakdownTotal).toBe(310000);
  });

  it('未分類支出 = 合計 − 内訳', () => {
    expect(result.uncategorized).toBe(40000);
  });

  it('固定費合計が正しい（水道光熱・通信・保険・車・サブスク）', () => {
    expect(result.fixedTotal).toBe(20000 + 15000 + 30000 + 50000 + 5000);
    expect(result.fixedTotal).toBe(120000);
  });

  it('変動費合計が正しい（食費・日用品・医療・子ども・レジャー・その他）', () => {
    expect(result.variableTotal).toBe(90000 + 20000 + 5000 + 30000 + 30000 + 15000);
    expect(result.variableTotal).toBe(190000);
  });

  it('固定費 + 変動費 = 内訳合計', () => {
    expect(result.fixedTotal + result.variableTotal).toBe(result.breakdownTotal);
  });

  it('支出額が大きいカテゴリ上位3つを抽出する', () => {
    expect(result.topCategories.map((c) => c.key)).toEqual(['food', 'car', 'insurance']);
  });

  it('0 円カテゴリは見直しポイントに含めない', () => {
    const sparse = calcResult({
      monthlyTotal: 100000,
      categories: withCategories({ food: 50000, car: 30000 }),
    });
    expect(sparse.topCategories.map((c) => c.key)).toEqual(['food', 'car']);
    expect(sparse.topCategories).toHaveLength(2);
  });

  it('割合は monthlyTotal を分母にする', () => {
    const food = result.shares.find((s) => s.key === 'food');
    expect(food?.ratio).toBeCloseTo(90000 / 350000, 6);
  });

  it('monthlyTotal が 0 のとき割合は 0（0除算しない）', () => {
    const zero = calcResult({ monthlyTotal: 0, categories: withCategories({ food: 1000 }) });
    expect(zero.shares.every((s) => s.ratio === 0)).toBe(true);
  });

  it('空入力でもクラッシュせず 0 を返す', () => {
    const empty = calcResult({ monthlyTotal: 0, categories: emptyCategories });
    expect(empty.annualTotal).toBe(0);
    expect(empty.breakdownTotal).toBe(0);
    expect(empty.uncategorized).toBe(0);
    expect(empty.topCategories).toHaveLength(0);
    expect(empty.isOverBudget).toBe(false);
  });

  it('内訳合計が生活費合計を超える場合 isOverBudget が true', () => {
    const over = calcResult({
      monthlyTotal: 200000,
      categories: withCategories({ food: 150000, car: 100000 }),
    });
    expect(over.breakdownTotal).toBe(250000);
    expect(over.isOverBudget).toBe(true);
    // 超過時、未分類は負にならず 0。
    expect(over.uncategorized).toBe(0);
  });

  it('内訳が合計以下なら isOverBudget は false', () => {
    expect(result.isOverBudget).toBe(false);
  });
});

describe('improvementEffect', () => {
  it('月1万円改善 → 年間12万円', () => {
    expect(improvementEffect(10000).annual).toBe(120000);
  });

  it('月3万円改善 → 年間36万円', () => {
    expect(improvementEffect(30000).annual).toBe(360000);
  });

  it('月5万円改善 → 年間60万円', () => {
    expect(improvementEffect(50000).annual).toBe(600000);
  });

  it('10年効果は月額 × 120', () => {
    expect(improvementEffect(10000).tenYear).toBe(1200000);
  });

  it('+1万円の支出増シナリオは符号付き（負）で返る', () => {
    const inc = improvementEffect(-10000);
    expect(inc.monthly).toBe(-10000);
    expect(inc.annual).toBe(-120000);
    expect(inc.tenYear).toBe(-1200000);
  });
});

describe('adjustedMonthly', () => {
  it('改善後生活費 = 合計 − 改善額', () => {
    expect(adjustedMonthly(350000, 30000)).toBe(320000);
  });

  it('改善後生活費は 0円未満にならない', () => {
    expect(adjustedMonthly(20000, 50000)).toBe(0);
  });

  it('支出増（負の reduction）では増額する', () => {
    expect(adjustedMonthly(350000, -10000)).toBe(360000);
  });
});

describe('resolveSelectedMonthly', () => {
  const values = { monthlyTotal: 350000, adjustedMonthlyTotal: 320000, breakdownTotal: 310000 };

  it('monthlyTotal を選ぶ', () => {
    expect(resolveSelectedMonthly('monthlyTotal', values)).toBe(350000);
  });

  it('adjustedMonthlyTotal を選ぶ', () => {
    expect(resolveSelectedMonthly('adjustedMonthlyTotal', values)).toBe(320000);
  });

  it('breakdownTotal を選ぶ', () => {
    expect(resolveSelectedMonthly('breakdownTotal', values)).toBe(310000);
  });

  it('改善値が無ければ monthlyTotal にフォールバック', () => {
    expect(
      resolveSelectedMonthly('adjustedMonthlyTotal', { monthlyTotal: 350000, breakdownTotal: 310000 }),
    ).toBe(350000);
  });
});

describe('buildStoragePayload', () => {
  const result = calcResult(sampleInput);

  it('保存データが期待する形になる（現在の生活費を反映）', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'monthlyTotal',
      savedAt: '2026-06-16T00:00:00.000Z',
    });

    expect(payload).toEqual({
      version: 1,
      source: 'living-cost-simulator',
      savedAt: '2026-06-16T00:00:00.000Z',
      livingCost: {
        monthlyTotal: 350000,
        selectedMonthlyTotal: 350000,
        selectedMonthlySource: 'monthlyTotal',
        annualTotal: 4200000,
        breakdownTotal: 310000,
        fixedCostTotal: 120000,
        variableCostTotal: 190000,
        uncategorizedAmount: 40000,
        categories: sampleInput.categories,
      },
    });
  });

  it('breakdownTotal / selectedMonthlyTotal / selectedMonthlySource を含む', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'monthlyTotal',
    });
    expect(payload.livingCost.breakdownTotal).toBe(310000);
    expect(payload.livingCost.selectedMonthlyTotal).toBe(350000);
    expect(['monthlyTotal', 'adjustedMonthlyTotal', 'breakdownTotal']).toContain(
      payload.livingCost.selectedMonthlySource,
    );
  });

  it('現在の生活費を反映 → source は monthlyTotal、値も monthlyTotal', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'monthlyTotal',
      adjustedMonthlyTotal: 320000,
    });
    expect(payload.livingCost.selectedMonthlySource).toBe('monthlyTotal');
    expect(payload.livingCost.selectedMonthlyTotal).toBe(350000);
    expect(payload.livingCost.adjustedMonthlyTotal).toBe(320000);
  });

  it('改善後の生活費を反映 → source は adjustedMonthlyTotal、値も改善後', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'adjustedMonthlyTotal',
      adjustedMonthlyTotal: 320000,
    });
    expect(payload.livingCost.selectedMonthlySource).toBe('adjustedMonthlyTotal');
    expect(payload.livingCost.selectedMonthlyTotal).toBe(320000);
  });

  it('内訳合計を反映 → source は breakdownTotal、値も内訳合計', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'breakdownTotal',
    });
    expect(payload.livingCost.selectedMonthlySource).toBe('breakdownTotal');
    expect(payload.livingCost.selectedMonthlyTotal).toBe(310000);
  });
});
