import type {
  CategoryAmounts,
  CategoryShare,
  ImprovementEffect,
  LivingCostInput,
  LivingCostResult,
  SelectedMonthlySource,
  StoredLivingCostPayload,
} from '../types/livingCost';
import { CATEGORY_KEYS, COST_TYPE } from './classification';

const MONTHS_PER_YEAR = 12;
const MONTHS_PER_DECADE = 120;

/**
 * 入力値を安全な金額に正規化する。
 * 空欄・NaN・Infinity・負値はすべて 0 として扱い、クラッシュや負の支出を防ぐ。
 */
export function sanitizeAmount(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return value;
}

/** カテゴリ別金額をすべて正規化した新しいオブジェクトを返す。 */
export function sanitizeCategories(categories: CategoryAmounts): CategoryAmounts {
  const result = {} as CategoryAmounts;
  for (const key of CATEGORY_KEYS) {
    result[key] = sanitizeAmount(categories[key]);
  }
  return result;
}

/** 内訳カテゴリの合計（円 / 月）。 */
export function sumBreakdown(categories: CategoryAmounts): number {
  return CATEGORY_KEYS.reduce((sum, key) => sum + sanitizeAmount(categories[key]), 0);
}

/**
 * 月の改善額（または支出増）から年間・10 年効果を算出する。
 * reduction が負なら支出増シナリオとして符号付きで返す。
 */
export function improvementEffect(reductionPerMonth: number): ImprovementEffect {
  const monthly = Number.isFinite(reductionPerMonth) ? reductionPerMonth : 0;
  return {
    monthly,
    annual: monthly * MONTHS_PER_YEAR,
    tenYear: monthly * MONTHS_PER_DECADE,
  };
}

/**
 * 改善後の毎月生活費。0 円未満にはならない。
 * reduction が負（支出増）なら増額側に動く。
 */
export function adjustedMonthly(monthlyTotal: number, reduction: number): number {
  const base = sanitizeAmount(monthlyTotal);
  const r = Number.isFinite(reduction) ? reduction : 0;
  return Math.max(0, base - r);
}

/**
 * 計算結果一式を生成する純粋関数。
 * 毎月生活費の総額は内訳合計から自動計算する（monthlyTotal = breakdownTotal）。
 * 割合の分母も内訳合計に統一し、単位不整合や 100% 超を防ぐ。
 */
export function calcResult(
  input: LivingCostInput,
  topCount = 3,
): LivingCostResult {
  const categories = sanitizeCategories(input.categories);
  const breakdownTotal = sumBreakdown(categories);

  let fixedTotal = 0;
  let variableTotal = 0;
  const shares: CategoryShare[] = CATEGORY_KEYS.map((key) => {
    const amount = categories[key];
    const costType = COST_TYPE[key];
    if (costType === 'fixed') fixedTotal += amount;
    else variableTotal += amount;
    return {
      key,
      amount,
      ratio: breakdownTotal > 0 ? amount / breakdownTotal : 0,
      costType,
    };
  });

  const topCategories = [...shares]
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, topCount);

  const referenceMonthlyTotal =
    input.referenceMonthlyTotal != null
      ? sanitizeAmount(input.referenceMonthlyTotal)
      : undefined;

  return {
    monthlyTotal: breakdownTotal,
    annualTotal: breakdownTotal * MONTHS_PER_YEAR,
    breakdownTotal,
    fixedTotal,
    variableTotal,
    fixedRatio: breakdownTotal > 0 ? fixedTotal / breakdownTotal : 0,
    variableRatio: breakdownTotal > 0 ? variableTotal / breakdownTotal : 0,
    shares,
    topCategories,
    referenceMonthlyTotal,
    referenceDiff:
      referenceMonthlyTotal != null ? referenceMonthlyTotal - breakdownTotal : undefined,
  };
}

/** 総合版へ反映する生活費を、選択ソースに応じて解決する。 */
export function resolveSelectedMonthly(
  source: SelectedMonthlySource,
  values: {
    adjustedMonthlyTotal?: number;
    breakdownTotal: number;
  },
): number {
  switch (source) {
    case 'adjustedMonthlyTotal':
      // 改善値が無ければ内訳合計にフォールバック。
      return sanitizeAmount(values.adjustedMonthlyTotal ?? values.breakdownTotal);
    case 'breakdownTotal':
    default:
      return sanitizeAmount(values.breakdownTotal);
  }
}

/**
 * localStorage 保存用のペイロードを生成する純粋関数。
 * selectedSource に応じて selectedMonthlyTotal / selectedMonthlySource を確定させる。
 */
export function buildStoragePayload(params: {
  result: LivingCostResult;
  categories: CategoryAmounts;
  selectedSource: SelectedMonthlySource;
  adjustedMonthlyTotal?: number;
  savedAt?: string;
}): StoredLivingCostPayload {
  const { result, categories, selectedSource } = params;
  const adjustedMonthlyTotal =
    params.adjustedMonthlyTotal != null
      ? sanitizeAmount(params.adjustedMonthlyTotal)
      : undefined;

  const selectedMonthlyTotal = resolveSelectedMonthly(selectedSource, {
    adjustedMonthlyTotal,
    breakdownTotal: result.breakdownTotal,
  });

  return {
    version: 1,
    source: 'living-cost-simulator',
    savedAt: params.savedAt ?? new Date().toISOString(),
    livingCost: {
      // monthlyTotal は内訳合計（＝毎月生活費の総額）を保存する。
      monthlyTotal: result.breakdownTotal,
      ...(adjustedMonthlyTotal != null ? { adjustedMonthlyTotal } : {}),
      selectedMonthlyTotal,
      selectedMonthlySource: selectedSource,
      annualTotal: result.annualTotal,
      breakdownTotal: result.breakdownTotal,
      fixedCostTotal: result.fixedTotal,
      variableCostTotal: result.variableTotal,
      categories: sanitizeCategories(categories),
    },
  };
}
