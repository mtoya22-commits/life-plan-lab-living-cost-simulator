import type { CategoryKey, CostType } from '../types/livingCost';

// 固定費 / 変動費のざっくり分類（申し送り §7 を簡略化）。
// あくまで生活設計上の目安であり、家庭ごとに異なる場合がある。
//   固定費寄り: 水道光熱費・通信費・保険料・車関連費・サブスク/会費
//   変動費寄り: 食費・日用品・医療費・子ども関連費・レジャー/交際費・その他
export const COST_TYPE: Record<CategoryKey, CostType> = {
  utilities: 'fixed',
  communication: 'fixed',
  insurance: 'fixed',
  car: 'fixed',
  subscription: 'fixed',
  food: 'variable',
  dailyGoods: 'variable',
  medical: 'variable',
  children: 'variable',
  leisure: 'variable',
  other: 'variable',
};

/** 入力 / 表示順を固定するためのカテゴリキー配列。 */
export const CATEGORY_KEYS: CategoryKey[] = [
  'food',
  'dailyGoods',
  'utilities',
  'communication',
  'insurance',
  'car',
  'medical',
  'children',
  'leisure',
  'subscription',
  'other',
];
