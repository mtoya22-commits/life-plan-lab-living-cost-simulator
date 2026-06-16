import type { ComparisonLevel, HouseholdComparison, HouseholdSize } from '../types/livingCost';
import { COMPARISON } from '../strings/ja';

// Source: 総務省「家計調査年報」2025年をもとに、
// 生命保険文化センターが掲載している世帯人数別消費支出目安。
// Monthly yen amounts. Reference only.
// LIFE PLAN LAB の生活費定義（住宅ローン返済額・大学費用などの大きな教育費を除く）とは
// 完全には一致しないため、画面上では「平均」ではなく「一般的な支出目安」として表示する。
export const HOUSEHOLD_SIZE_REFERENCES = {
  1: 173000,
  2: 281000,
  3: 324000,
  4: 363000, // 5 は「5人以上」を表す。
  5: 364000,
} as const;

/** 世帯人数別の一般的な支出目安（円/月）を返す。 */
export function getHouseholdReference(size: HouseholdSize): number {
  return HOUSEHOLD_SIZE_REFERENCES[size];
}

/** 差額比率から参考比較の度合いを決める（評価ではなく参考表示）。 */
function levelFromRatio(diffRatio: number): ComparisonLevel {
  if (diffRatio >= 0.2) return 'high';
  if (diffRatio >= 0.1) return 'slightlyHigh';
  if (diffRatio <= -0.2) return 'low';
  if (diffRatio <= -0.1) return 'slightlyLow';
  return 'near';
}

/**
 * 今回の生活費（内訳合計ベース）を、世帯人数別の一般的な支出目安と参考比較する純粋関数。
 * 断定・評価ではなく、やわらかいコメントを返す。
 */
export function compareWithReference(
  monthlyTotal: number,
  size: HouseholdSize,
): HouseholdComparison {
  const referenceMonthly = getHouseholdReference(size);
  const actualMonthly = Number.isFinite(monthlyTotal) && monthlyTotal > 0 ? monthlyTotal : 0;
  const diffMonthly = actualMonthly - referenceMonthly;
  const diffRatio = referenceMonthly > 0 ? diffMonthly / referenceMonthly : 0;
  const level = levelFromRatio(diffRatio);

  return {
    householdSize: size,
    referenceMonthly,
    actualMonthly,
    diffMonthly,
    diffRatio,
    level,
    label: COMPARISON.labels[level],
  };
}
