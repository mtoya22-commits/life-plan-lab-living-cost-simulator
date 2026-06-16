import type {
  CategoryKey,
  CompositionComparisonItem,
  CompositionComparisonResult,
  CompositionLevel,
  LivingCostResult,
} from '../types/livingCost';
import { COMPOSITION } from '../strings/ja';

// Source: 総務省「家計調査報告 家計収支編 2025年平均結果」二人以上の世帯。
// 2025年の二人以上世帯の消費支出314,001円をもとに、LIFE PLAN LAB のカテゴリに近い費目を
// 対応させた参考比率（monthlyAmount は円/月）。
// 住宅ローン返済や大学費用など、LIFE PLAN LAB 側の生活費定義とは完全には一致しないため、
// 画面上では「平均」ではなく「参考比較」として扱う。
// insurance / subscription / other は家計調査の費目との対応が不安定なため、外部比率比較からは外す。
export const REFERENCE_COMPOSITION_2025 = {
  food: { label: '食費・外食費', sourceLabel: '食料', monthlyAmount: 94895, totalRatio: 0.302, foodRatio: 1.0 },
  utilities: { label: '水道光熱費', sourceLabel: '光熱・水道', monthlyAmount: 24547, totalRatio: 0.078, foodRatio: 0.26 },
  dailyGoods: { label: '日用品・雑費', sourceLabel: '家具・家事用品', monthlyAmount: 13068, totalRatio: 0.042, foodRatio: 0.14 },
  communication: { label: '通信費', sourceLabel: '通信', monthlyAmount: 11672, totalRatio: 0.037, foodRatio: 0.12 },
  car: { label: '車関連費', sourceLabel: '自動車等関係費', monthlyAmount: 28355, totalRatio: 0.09, foodRatio: 0.3 },
  medical: { label: '医療費', sourceLabel: '保健医療', monthlyAmount: 15863, totalRatio: 0.051, foodRatio: 0.17 },
  children: { label: '子ども関連費', sourceLabel: '教育', monthlyAmount: 11939, totalRatio: 0.038, foodRatio: 0.13 },
  leisure: { label: 'レジャー・交際費', sourceLabel: '教養娯楽', monthlyAmount: 32125, totalRatio: 0.102, foodRatio: 0.34 },
} as const;

/** 構成比比較の対象カテゴリ（insurance / subscription / other は対象外）。 */
export const COMPARABLE_CATEGORIES = Object.keys(
  REFERENCE_COMPOSITION_2025,
) as (keyof typeof REFERENCE_COMPOSITION_2025)[];

/** 食費=1の参考比率を表示する最低ライン（これ未満は歪むので非表示）。 */
const FOOD_RATIO_MIN = 30000;

function levelFromIndex(balanceIndex: number): CompositionLevel {
  if (balanceIndex >= 1.5) return 'muchHigher';
  if (balanceIndex >= 1.2) return 'higher';
  if (balanceIndex >= 0.8) return 'near';
  return 'lower';
}

function userAmountOf(result: LivingCostResult, key: CategoryKey): number {
  return result.shares.find((s) => s.key === key)?.amount ?? 0;
}

/**
 * 金額そのものではなく「比較対象カテゴリの中での構成比」で参考比較する純粋関数。
 * メイン判定は balanceIndex（構成比の比）。食費=1の比は補助として付ける。
 */
export function buildCompositionComparison(result: LivingCostResult): CompositionComparisonResult {
  const referenceComparableTotal = COMPARABLE_CATEGORIES.reduce(
    (sum, key) => sum + REFERENCE_COMPOSITION_2025[key].monthlyAmount,
    0,
  );
  const userFood = userAmountOf(result, 'food');
  const referenceFood = REFERENCE_COMPOSITION_2025.food.monthlyAmount;

  // 比較対象は「入力済み（>0）」のカテゴリのみ。
  const present = COMPARABLE_CATEGORIES.filter((key) => userAmountOf(result, key) > 0);
  const comparableTotal = present.reduce((sum, key) => sum + userAmountOf(result, key), 0);

  if (comparableTotal === 0) {
    return { comparableTotal: 0, referenceComparableTotal, items: [], highlightedItems: [] };
  }

  const items: CompositionComparisonItem[] = present.map((key) => {
    const ref = REFERENCE_COMPOSITION_2025[key];
    const userMonthly = userAmountOf(result, key);
    const userShare = userMonthly / comparableTotal;
    const referenceShare = ref.monthlyAmount / referenceComparableTotal;
    const balanceIndex = referenceShare > 0 ? userShare / referenceShare : 0;
    const level = levelFromIndex(balanceIndex);
    // 食費が小さすぎると食費=1比が歪むため、その場合は付けない。食費自身も補助比は付けない。
    const showFoodRatio = key !== 'food' && userFood >= FOOD_RATIO_MIN;
    return {
      categoryKey: key,
      label: ref.label,
      userMonthly,
      userShare,
      referenceShare,
      balanceIndex,
      ...(showFoodRatio
        ? { userFoodRatio: userMonthly / userFood, referenceFoodRatio: ref.monthlyAmount / referenceFood }
        : {}),
      level,
      message: COMPOSITION.levels[level],
    };
  });

  const highlightedItems = items
    .filter((i) => i.level === 'higher' || i.level === 'muchHigher')
    .sort((a, b) => b.balanceIndex - a.balanceIndex)
    .slice(0, 3);

  return { comparableTotal, referenceComparableTotal, items, highlightedItems };
}
