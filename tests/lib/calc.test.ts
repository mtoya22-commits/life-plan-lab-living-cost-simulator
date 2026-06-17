import { describe, it, expect } from 'vitest';
import {
  adjustedMonthly,
  buildStoragePayload,
  calcResult,
  improvementEffect,
  isResultEmpty,
  resolveSelectedMonthly,
  sanitizeAmount,
  sumBreakdown,
} from '../../src/lib/calc';
import { buildCategoryScenario } from '../../src/lib/categoryScenario';
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

// 代表的な入力: 内訳合計 31万円（固定12万・変動19万）。総額は内訳から自動計算。
const sampleInput: LivingCostInput = {
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

  it('毎月生活費は内訳合計と同値（自動計算）', () => {
    expect(result.monthlyTotal).toBe(310000);
    expect(result.monthlyTotal).toBe(result.breakdownTotal);
  });

  it('年間生活費は内訳合計 × 12', () => {
    expect(result.annualTotal).toBe(310000 * 12);
    expect(result.annualTotal).toBe(3720000);
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

  it('固定/変動の割合は内訳合計を分母にする（合計はほぼ 1）', () => {
    expect(result.fixedRatio).toBeCloseTo(120000 / 310000, 6);
    expect(result.variableRatio).toBeCloseTo(190000 / 310000, 6);
    expect(result.fixedRatio + result.variableRatio).toBeCloseTo(1, 6);
  });

  it('支出額が大きいカテゴリ上位3つを抽出する', () => {
    expect(result.topCategories.map((c) => c.key)).toEqual(['food', 'car', 'insurance']);
  });

  it('0 円カテゴリは見直しポイントに含めない', () => {
    const sparse = calcResult({ categories: withCategories({ food: 50000, car: 30000 }) });
    expect(sparse.topCategories.map((c) => c.key)).toEqual(['food', 'car']);
    expect(sparse.topCategories).toHaveLength(2);
  });

  it('カテゴリ割合は内訳合計が分母（0〜1 に収まる）', () => {
    const food = result.shares.find((s) => s.key === 'food');
    expect(food?.ratio).toBeCloseTo(90000 / 310000, 6);
    expect(result.shares.every((s) => s.ratio >= 0 && s.ratio <= 1)).toBe(true);
  });

  it('内訳合計が 0 のとき割合は 0（0除算しない）', () => {
    const zero = calcResult({ categories: emptyCategories });
    expect(zero.shares.every((s) => s.ratio === 0)).toBe(true);
    expect(zero.fixedRatio).toBe(0);
    expect(zero.variableRatio).toBe(0);
  });

  it('空入力でもクラッシュせず 0 を返す', () => {
    const empty = calcResult({ categories: emptyCategories });
    expect(empty.monthlyTotal).toBe(0);
    expect(empty.annualTotal).toBe(0);
    expect(empty.breakdownTotal).toBe(0);
    expect(empty.topCategories).toHaveLength(0);
  });

  it('参考値が無ければ referenceMonthlyTotal / referenceDiff は undefined', () => {
    expect(result.referenceMonthlyTotal).toBeUndefined();
    expect(result.referenceDiff).toBeUndefined();
  });

  it('参考値があれば referenceDiff = 参考値 − 内訳合計', () => {
    const withRef = calcResult({ ...sampleInput, referenceMonthlyTotal: 350000 });
    expect(withRef.referenceMonthlyTotal).toBe(350000);
    expect(withRef.referenceDiff).toBe(350000 - 310000);
  });
});

describe('isResultEmpty', () => {
  it('全カテゴリ0円なら true（やさしいガード対象）', () => {
    expect(isResultEmpty(calcResult({ categories: emptyCategories }))).toBe(true);
  });

  it('1カテゴリでも入力があれば false（結果へ進める）', () => {
    expect(isResultEmpty(calcResult({ categories: withCategories({ food: 30000 }) }))).toBe(false);
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
  const values = {
    breakdownTotal: 310000,
    quickAdjustedMonthlyTotal: 280000,
    categoryScenarioMonthlyTotal: 297000,
  };

  it('breakdownTotal を選ぶ', () => {
    expect(resolveSelectedMonthly('breakdownTotal', values)).toBe(310000);
  });

  it('quickAdjust を選ぶ', () => {
    expect(resolveSelectedMonthly('quickAdjust', values)).toBe(280000);
  });

  it('categoryScenario を選ぶ', () => {
    expect(resolveSelectedMonthly('categoryScenario', values)).toBe(297000);
  });

  it('値が無ければ breakdownTotal にフォールバック', () => {
    expect(resolveSelectedMonthly('quickAdjust', { breakdownTotal: 310000 })).toBe(310000);
    expect(resolveSelectedMonthly('categoryScenario', { breakdownTotal: 310000 })).toBe(310000);
  });
});

describe('buildStoragePayload', () => {
  const result = calcResult(sampleInput);

  it('保存データが期待する形になる（内訳合計を反映）', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'breakdownTotal',
      savedAt: '2026-06-16T00:00:00.000Z',
    });

    expect(payload).toEqual({
      version: 1,
      source: 'living-cost-simulator',
      savedAt: '2026-06-16T00:00:00.000Z',
      livingCost: {
        monthlyTotal: 310000,
        selectedMonthlyTotal: 310000,
        selectedMonthlySource: 'breakdownTotal',
        annualTotal: 3720000,
        breakdownTotal: 310000,
        fixedCostTotal: 120000,
        variableCostTotal: 190000,
        categories: sampleInput.categories,
      },
    });
  });

  it('monthlyTotal は内訳合計、uncategorizedAmount は含まない', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'breakdownTotal',
    });
    expect(payload.livingCost.monthlyTotal).toBe(310000);
    expect('uncategorizedAmount' in payload.livingCost).toBe(false);
  });

  it('breakdownTotal / selectedMonthlyTotal / selectedMonthlySource を含む', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'breakdownTotal',
    });
    expect(payload.livingCost.breakdownTotal).toBe(310000);
    expect(payload.livingCost.selectedMonthlyTotal).toBe(310000);
    expect(['breakdownTotal', 'quickAdjust', 'categoryScenario']).toContain(
      payload.livingCost.selectedMonthlySource,
    );
  });

  it('現在の生活費（内訳合計）を反映 → source は breakdownTotal', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'breakdownTotal',
      quickAdjustedMonthlyTotal: 280000,
    });
    expect(payload.livingCost.selectedMonthlySource).toBe('breakdownTotal');
    expect(payload.livingCost.selectedMonthlyTotal).toBe(310000);
    expect(payload.livingCost.quickAdjustedMonthlyTotal).toBe(280000);
  });

  it('ざっくり調整後を反映 → source は quickAdjust、値も調整後', () => {
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'quickAdjust',
      quickAdjustedMonthlyTotal: 280000,
    });
    expect(payload.livingCost.selectedMonthlySource).toBe('quickAdjust');
    expect(payload.livingCost.selectedMonthlyTotal).toBe(280000);
  });

  it('カテゴリ別見直し後を反映 → source は categoryScenario、scenario も保存', () => {
    const scenario = buildCategoryScenario(result, { communication: 13000 });
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'categoryScenario',
      categoryScenario: scenario,
    });
    expect(payload.livingCost.selectedMonthlySource).toBe('categoryScenario');
    expect(payload.livingCost.selectedMonthlyTotal).toBe(scenario.scenarioMonthlyTotal);
    expect(payload.livingCost.categoryScenarioMonthlyTotal).toBe(scenario.scenarioMonthlyTotal);
    expect(payload.livingCost.categoryScenario).toEqual(scenario);
  });

  it('quickAdjust と categoryScenario は別 source として扱える', () => {
    const scenario = buildCategoryScenario(result, { communication: 13000 });
    const q = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'quickAdjust',
      quickAdjustedMonthlyTotal: 280000,
      categoryScenario: scenario,
    });
    // quickAdjust を選んでも categoryScenario の情報は保存され、選択ソースは quickAdjust。
    expect(q.livingCost.selectedMonthlySource).toBe('quickAdjust');
    expect(q.livingCost.selectedMonthlyTotal).toBe(280000);
    expect(q.livingCost.categoryScenario).toEqual(scenario);
  });
});

describe('世帯人数別の参考比較', () => {
  it('世帯人数 未入力なら householdComparison を作らない', () => {
    const result = calcResult(sampleInput);
    expect(result.householdComparison).toBeUndefined();
  });

  it('世帯人数 入力時は内訳合計ベースで比較結果を作る', () => {
    const result = calcResult({ ...sampleInput, householdSize: 3 }); // 内訳 310000, 目安 324000
    const hc = result.householdComparison;
    expect(hc).toBeDefined();
    expect(hc?.householdSize).toBe(3);
    expect(hc?.referenceMonthly).toBe(324000);
    expect(hc?.actualMonthly).toBe(310000); // 内訳合計ベース
    expect(hc?.diffMonthly).toBe(310000 - 324000);
    expect(hc?.level).toBe('near'); // ±10%以内
  });

  it('保存データに世帯人数が含まれる（入力時）', () => {
    const result = calcResult({ ...sampleInput, householdSize: 3 });
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'breakdownTotal',
    });
    expect(payload.livingCost.householdSize).toBe(3);
    expect(payload.livingCost.householdReferenceMonthly).toBe(324000);
    expect(payload.livingCost.householdReferenceDiffMonthly).toBe(310000 - 324000);
  });

  it('世帯人数 未入力なら保存データに含めない', () => {
    const result = calcResult(sampleInput);
    const payload = buildStoragePayload({
      result,
      categories: sampleInput.categories,
      selectedSource: 'breakdownTotal',
    });
    expect('householdSize' in payload.livingCost).toBe(false);
    expect('householdReferenceMonthly' in payload.livingCost).toBe(false);
    expect('householdReferenceDiffMonthly' in payload.livingCost).toBe(false);
  });
});
