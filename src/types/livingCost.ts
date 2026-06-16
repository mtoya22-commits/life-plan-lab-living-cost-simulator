// 生活費見直しシミュレーターの型定義。
// UI からも計算ロジックからも参照する単一ソース。

/** 内訳の 11 カテゴリ。localStorage 保存形式の categories と一致させる。 */
export type CategoryKey =
  | 'food'
  | 'dailyGoods'
  | 'utilities'
  | 'communication'
  | 'insurance'
  | 'car'
  | 'medical'
  | 'children'
  | 'leisure'
  | 'subscription'
  | 'other';

/** カテゴリ別の月額（円）。すべて任意入力で、未入力は 0 として扱う。 */
export type CategoryAmounts = Record<CategoryKey, number>;

/** 固定費 / 変動費のざっくり分類（生活設計上の目安）。 */
export type CostType = 'fixed' | 'variable';

/** 入力状態。monthlyTotal は「現在の毎月生活費の合計（日常生活費の目安）」。 */
export interface LivingCostInput {
  monthlyTotal: number;
  categories: CategoryAmounts;
}

/** カテゴリ別の金額と割合。 */
export interface CategoryShare {
  key: CategoryKey;
  amount: number;
  /** monthlyTotal を分母にした割合（0〜1）。monthlyTotal が 0 なら 0。 */
  ratio: number;
  costType: CostType;
}

/** 改善（または支出増）シナリオの効果。reduction が負なら支出増。 */
export interface ImprovementEffect {
  /** 1 か月あたりの改善額（正＝改善、負＝支出増）。 */
  monthly: number;
  /** 年間効果（monthly × 12）。 */
  annual: number;
  /** 10 年間の単純効果（monthly × 120）。 */
  tenYear: number;
}

/** 計算結果。Hero・グラフ・保存処理が同じ結果を参照する。 */
export interface LivingCostResult {
  monthlyTotal: number;
  annualTotal: number;
  breakdownTotal: number;
  uncategorized: number;
  /** 内訳合計が生活費合計を上回っているか（やさしい注意表示に使う）。 */
  isOverBudget: boolean;
  fixedTotal: number;
  variableTotal: number;
  shares: CategoryShare[];
  /** 金額の大きい上位カテゴリ（0 円は除外。最大件数は呼び出し側で指定）。 */
  topCategories: CategoryShare[];
}

/** 総合版へ反映する生活費がどの値かを示す。 */
export type SelectedMonthlySource =
  | 'monthlyTotal'
  | 'adjustedMonthlyTotal'
  | 'breakdownTotal';

/** localStorage に保存する生活費データ本体。 */
export interface StoredLivingCost {
  monthlyTotal: number;
  adjustedMonthlyTotal?: number;
  selectedMonthlyTotal: number;
  selectedMonthlySource: SelectedMonthlySource;
  annualTotal: number;
  breakdownTotal: number;
  fixedCostTotal: number;
  variableCostTotal: number;
  uncategorizedAmount: number;
  categories: CategoryAmounts;
}

/** localStorage に保存する最終形（キー: lifePlanLab:livingCost）。 */
export interface StoredLivingCostPayload {
  version: 1;
  source: 'living-cost-simulator';
  savedAt: string;
  livingCost: StoredLivingCost;
}
