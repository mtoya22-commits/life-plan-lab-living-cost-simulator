import type {
  CategoryAdjustment,
  CategoryKey,
  CategoryScenarioResult,
  LivingCostResult,
} from '../types/livingCost';
import { CATEGORY_KEYS } from './classification';
import { sanitizeAmount } from './calc';

// カテゴリ別見直しシナリオの純粋関数。
// 元入力は上書きせず、「見直し後の金額」を一時的に試算するためのもの。

const MONTHS_PER_YEAR = 12;
const YEARS = 10;

// カテゴリごとの減額ステップ（円）。金額感がカテゴリで違うため出し分ける。
// medical / children は「減らす」前提にしないため、減額ボタンを出さない（空配列）。
export const SCENARIO_STEPS: Record<CategoryKey, number[]> = {
  communication: [1000, 3000, 5000],
  subscription: [1000, 3000, 5000],
  insurance: [3000, 5000, 10000],
  car: [5000, 10000, 20000],
  food: [5000, 10000, 20000],
  leisure: [5000, 10000, 20000],
  utilities: [5000, 10000, 20000],
  dailyGoods: [3000, 5000, 10000],
  other: [3000, 5000, 10000],
  medical: [],
  children: [],
};

/** 慎重に扱うカテゴリ（減額を促さない）。 */
export const CAREFUL_CATEGORIES: CategoryKey[] = ['medical', 'children'];

/** 現在の入力金額をカテゴリ別に取り出す。 */
function currentOf(result: LivingCostResult, key: CategoryKey): number {
  const s = result.shares.find((x) => x.key === key);
  return s ? s.amount : 0;
}

/**
 * カテゴリ別の見直し後金額（overrides）から、見直し後生活費と差額を試算する。
 * overrides に含まれないカテゴリは現状維持。金額は 0 円未満にならない。
 */
export function buildCategoryScenario(
  result: LivingCostResult,
  overrides: Partial<Record<CategoryKey, number>>,
): CategoryScenarioResult {
  const baseMonthlyTotal = result.breakdownTotal;

  const adjustments: CategoryAdjustment[] = CATEGORY_KEYS.filter(
    (key) => overrides[key] != null,
  ).map((key) => {
    const currentMonthly = currentOf(result, key);
    const scenarioMonthly = sanitizeAmount(overrides[key]);
    return { categoryKey: key, currentMonthly, scenarioMonthly, diffMonthly: scenarioMonthly - currentMonthly };
  });

  const diffSum = adjustments.reduce((sum, a) => sum + a.diffMonthly, 0);
  const scenarioMonthlyTotal = Math.max(0, baseMonthlyTotal + diffSum);
  const diffMonthly = scenarioMonthlyTotal - baseMonthlyTotal;

  return {
    baseMonthlyTotal,
    scenarioMonthlyTotal,
    diffMonthly,
    diffAnnual: diffMonthly * MONTHS_PER_YEAR,
    diffTenYears: diffMonthly * MONTHS_PER_YEAR * YEARS,
    adjustments,
  };
}

/** シナリオに実質的な調整があるか（見直し後ボタンの表示判定に使う）。 */
export function hasCategoryScenario(scenario: CategoryScenarioResult): boolean {
  return scenario.adjustments.length > 0 && scenario.diffMonthly !== 0;
}

/**
 * カテゴリチップの並び順を決める。
 * priorityKeys（見直しポイント→構成比が大きめ→金額が大きい、の順で重複排除済み）を
 * available の範囲で先頭に置き、残りは CATEGORY_KEYS の順で続ける。
 */
export function orderScenarioKeys(
  available: CategoryKey[],
  priorityKeys: CategoryKey[],
): CategoryKey[] {
  const head: CategoryKey[] = [];
  for (const key of priorityKeys) {
    if (available.includes(key) && !head.includes(key)) head.push(key);
  }
  const rest = CATEGORY_KEYS.filter((k) => available.includes(k) && !head.includes(k));
  return [...head, ...rest];
}
