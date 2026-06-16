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

/** 世帯人数。5 は「5人以上」を表す。 */
export type HouseholdSize = 1 | 2 | 3 | 4 | 5;

/** 一般的な支出目安との参考比較の度合い（断定・評価ではなく参考表示）。 */
export type ComparisonLevel = 'near' | 'slightlyHigh' | 'high' | 'slightlyLow' | 'low';

/** 世帯人数別の一般的な支出目安との参考比較結果。 */
export interface HouseholdComparison {
  householdSize: HouseholdSize;
  /** 世帯人数別の一般的な支出目安（円/月）。 */
  referenceMonthly: number;
  /** 今回の生活費（内訳合計ベース・円/月）。 */
  actualMonthly: number;
  /** 差額（actual − reference）。 */
  diffMonthly: number;
  /** 差額比率（(actual − reference) / reference）。 */
  diffRatio: number;
  level: ComparisonLevel;
  /** やわらかいコメント文言（参考表示）。 */
  label: string;
}

/**
 * 見直しポイントの性格。削減ではなく確認の方向性を表す。
 *   check       … 内容を確認したい
 *   fixed-cost  … 一度確認すると効果が続く固定費
 *   careful     … 慎重に扱う（削減対象にしない）
 *   planning    … 生活設計に見込んでおく
 */
export type ReviewTone = 'check' | 'fixed-cost' | 'careful' | 'planning';

/** 結果画面に出す「生活費で確認したいポイント」1件分。 */
export interface ReviewPoint {
  id: string;
  title: string;
  /** 対象カテゴリ名または「固定費全体」「変動費全体」などの分類ラベル。 */
  targetLabel: string;
  categoryKey?: CategoryKey;
  tone: ReviewTone;
  message: string;
  note: string;
}

/**
 * 入力状態。毎月生活費の総額はカテゴリ内訳の合計から自動計算するため、
 * ユーザーが総額を直接入力することはない（家計簿化を避け、整合性管理をさせない方針）。
 * referenceMonthlyTotal は、総合版から渡された「現在の生活費（円/月）」の参考値（任意）。
 * householdSize は、一般的な支出目安と比較するための任意入力。
 */
export interface LivingCostInput {
  categories: CategoryAmounts;
  referenceMonthlyTotal?: number;
  householdSize?: HouseholdSize;
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
  /** 毎月生活費の総額。内訳合計と同値（自動計算）。 */
  monthlyTotal: number;
  annualTotal: number;
  breakdownTotal: number;
  fixedTotal: number;
  variableTotal: number;
  /** 内訳合計を分母にした固定費 / 変動費の割合（0〜1）。内訳が 0 なら 0。 */
  fixedRatio: number;
  variableRatio: number;
  shares: CategoryShare[];
  /** 金額の大きい上位カテゴリ（0 円は除外。最大件数は呼び出し側で指定）。 */
  topCategories: CategoryShare[];
  /** 総合版から渡された参考値（円/月）。無ければ undefined。 */
  referenceMonthlyTotal?: number;
  /** 参考値 − 内訳合計。参考値が無ければ undefined。 */
  referenceDiff?: number;
  /** 世帯人数別の参考比較。householdSize 未入力なら undefined。 */
  householdComparison?: HouseholdComparison;
}

/** 総合版へ反映する生活費がどの値かを示す。 */
export type SelectedMonthlySource = 'breakdownTotal' | 'adjustedMonthlyTotal';

/** localStorage に保存する生活費データ本体。 */
export interface StoredLivingCost {
  /** 内訳合計（＝毎月生活費の総額）。 */
  monthlyTotal: number;
  adjustedMonthlyTotal?: number;
  selectedMonthlyTotal: number;
  selectedMonthlySource: SelectedMonthlySource;
  annualTotal: number;
  breakdownTotal: number;
  fixedCostTotal: number;
  variableCostTotal: number;
  /** 世帯人数（任意入力時のみ）。5 は「5人以上」。 */
  householdSize?: HouseholdSize;
  /** 世帯人数別の一般的な支出目安（円/月）。 */
  householdReferenceMonthly?: number;
  /** 目安との差額（actual − reference）。 */
  householdReferenceDiffMonthly?: number;
  categories: CategoryAmounts;
}

/** localStorage に保存する最終形（キー: lifePlanLab:livingCost）。 */
export interface StoredLivingCostPayload {
  version: 1;
  source: 'living-cost-simulator';
  savedAt: string;
  livingCost: StoredLivingCost;
}
