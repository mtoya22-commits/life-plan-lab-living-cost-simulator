import type {
  CategoryKey,
  LivingCostResult,
  ReviewPoint,
  ReviewTone,
} from '../types/livingCost';
import { CATEGORY_LABELS, REVIEW } from '../strings/ja';

// 「生活費で確認したいポイント」を組み立てる純粋関数群。
// 目的は削減の推奨ではなく、「どこを確認すると生活設計への影響が見えやすいか」を示すこと。
// 金額の大きさ・固定費か・慎重に扱うべきか、を踏まえて最大3件を選ぶ。

type RuleId = keyof typeof REVIEW.points;

interface ReviewRule {
  id: RuleId;
  categoryKey?: CategoryKey;
  tone: ReviewTone;
  /** 基礎優先度（分類偏り > 見直しやすい固定費 > 確認系 > 慎重系）。 */
  basePriority: number;
  /** 対象カテゴリ名 / 分類ラベル。 */
  targetLabel: string;
  /** この候補を出すかどうか。 */
  condition: (result: LivingCostResult) => boolean;
}

/** カテゴリの金額・割合を取り出す（未入力は 0）。 */
function share(result: LivingCostResult, key: CategoryKey): { amount: number; ratio: number } {
  const s = result.shares.find((x) => x.key === key);
  return s ? { amount: s.amount, ratio: s.ratio } : { amount: 0, ratio: 0 };
}

const RULES: ReviewRule[] = [
  // 分類の偏り（最優先グループ）
  {
    id: 'fixedOverall',
    tone: 'fixed-cost',
    basePriority: 1000,
    targetLabel: '固定費全体',
    condition: (r) => r.fixedRatio >= 0.4,
  },
  {
    id: 'variableOverall',
    tone: 'fixed-cost',
    basePriority: 1000,
    targetLabel: '変動費全体',
    condition: (r) => r.variableRatio >= 0.65,
  },
  // 見直しやすい固定費
  {
    id: 'communication',
    categoryKey: 'communication',
    tone: 'fixed-cost',
    basePriority: 700,
    targetLabel: CATEGORY_LABELS.communication,
    condition: (r) => {
      const { amount, ratio } = share(r, 'communication');
      return amount >= 10000 || ratio >= 0.05;
    },
  },
  {
    id: 'subscription',
    categoryKey: 'subscription',
    tone: 'fixed-cost',
    basePriority: 700,
    targetLabel: CATEGORY_LABELS.subscription,
    condition: (r) => {
      const { amount, ratio } = share(r, 'subscription');
      return amount >= 5000 || ratio >= 0.03;
    },
  },
  // 内容確認・年間コストで見たい固定費
  {
    id: 'insurance',
    categoryKey: 'insurance',
    tone: 'careful',
    basePriority: 600,
    targetLabel: CATEGORY_LABELS.insurance,
    condition: (r) => {
      const { amount, ratio } = share(r, 'insurance');
      return amount >= 10000 || ratio >= 0.05;
    },
  },
  {
    id: 'car',
    categoryKey: 'car',
    tone: 'check',
    basePriority: 600,
    targetLabel: CATEGORY_LABELS.car,
    condition: (r) => {
      const { amount, ratio } = share(r, 'car');
      return amount >= 30000 || ratio >= 0.1;
    },
  },
  // 変動費寄りの確認系
  {
    id: 'food',
    categoryKey: 'food',
    tone: 'check',
    basePriority: 500,
    targetLabel: CATEGORY_LABELS.food,
    condition: (r) => {
      const { amount, ratio } = share(r, 'food');
      return amount >= 80000 || ratio >= 0.25;
    },
  },
  {
    id: 'leisure',
    categoryKey: 'leisure',
    tone: 'check',
    basePriority: 500,
    targetLabel: CATEGORY_LABELS.leisure,
    condition: (r) => {
      const { amount, ratio } = share(r, 'leisure');
      return amount >= 30000 || ratio >= 0.1;
    },
  },
  {
    id: 'utilities',
    categoryKey: 'utilities',
    tone: 'check',
    basePriority: 500,
    targetLabel: CATEGORY_LABELS.utilities,
    condition: (r) => {
      const { amount, ratio } = share(r, 'utilities');
      return amount >= 30000 || ratio >= 0.1;
    },
  },
  // 慎重に扱う（削減候補として強く出さない）
  {
    id: 'children',
    categoryKey: 'children',
    tone: 'planning',
    basePriority: 200,
    targetLabel: CATEGORY_LABELS.children,
    condition: (r) => {
      const { amount, ratio } = share(r, 'children');
      return amount >= 30000 || ratio >= 0.1;
    },
  },
  {
    id: 'medical',
    categoryKey: 'medical',
    tone: 'careful',
    basePriority: 200,
    targetLabel: CATEGORY_LABELS.medical,
    condition: (r) => {
      const { amount, ratio } = share(r, 'medical');
      return amount >= 10000 || ratio >= 0.05;
    },
  },
];

/** ルールのスコア。金額が大きいほど上げるが、慎重系は金額の影響を抑える。 */
function scoreOf(rule: ReviewRule, result: LivingCostResult): number {
  if (!rule.categoryKey) return rule.basePriority; // 分類偏りは基礎優先度のみ
  const { amount } = share(result, rule.categoryKey);
  const careful = rule.tone === 'careful' || rule.tone === 'planning';
  const amountWeight = amount / (careful ? 5000 : 1000);
  return rule.basePriority + amountWeight;
}

/** 条件を満たす見直しポイントを、優先度の高い順に最大 max 件返す。 */
export function getReviewPoints(result: LivingCostResult, max = 3): ReviewPoint[] {
  return RULES.filter((rule) => rule.condition(result))
    .sort((a, b) => scoreOf(b, result) - scoreOf(a, result))
    .slice(0, max)
    .map((rule) => {
      const text = REVIEW.points[rule.id];
      return {
        id: rule.id,
        title: text.title,
        targetLabel: rule.targetLabel,
        categoryKey: rule.categoryKey,
        tone: rule.tone,
        message: text.message,
        note: text.note,
      };
    });
}
