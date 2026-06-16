import { describe, it, expect } from 'vitest';
import { calcResult } from '../../src/lib/calc';
import { getReviewPoints } from '../../src/lib/reviewRules';
import { REVIEW } from '../../src/strings/ja';
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

function points(overrides: Partial<CategoryAmounts>) {
  const input: LivingCostInput = { categories: { ...emptyCategories, ...overrides } };
  return getReviewPoints(calcResult(input));
}

function ids(overrides: Partial<CategoryAmounts>) {
  return points(overrides).map((p) => p.id);
}

describe('getReviewPoints — 候補化の条件', () => {
  it('通信費が月10,000円以上で候補になる', () => {
    expect(ids({ communication: 10000, food: 5000 })).toContain('communication');
  });

  it('サブスク・会費が月5,000円以上で候補になる', () => {
    expect(ids({ subscription: 5000, food: 5000 })).toContain('subscription');
  });

  it('食費・外食費の割合が高い場合に候補になる', () => {
    // 食費 50,000 / 合計 60,000 = 83% （>=25%）
    expect(ids({ food: 50000, dailyGoods: 10000 })).toContain('food');
  });

  it('固定費割合が40%以上なら固定費全体の候補が出る', () => {
    // 固定: communication 60,000 / 合計 100,000 = 60%
    expect(ids({ communication: 60000, food: 40000 })).toContain('fixedOverall');
  });

  it('変動費割合が65%以上なら変動費全体の候補が出る', () => {
    // 変動: food 80,000 / 合計 100,000 = 80%
    expect(ids({ food: 80000, communication: 20000 })).toContain('variableOverall');
  });

  it('未入力（すべて0）なら何も返さない', () => {
    expect(points({})).toHaveLength(0);
  });
});

describe('getReviewPoints — 文言のトーン', () => {
  it('保険料は解約推奨ではなく内容確認の文言になる', () => {
    const p = points({ insurance: 30000 }).find((x) => x.id === 'insurance');
    expect(p).toBeDefined();
    expect(p!.message).toContain('内容');
    expect(p!.message).not.toMatch(/解約しましょう|解約してください/);
  });

  it('車関連費は年間コストで見る文言になる', () => {
    const p = points({ car: 50000 }).find((x) => x.id === 'car');
    expect(p).toBeDefined();
    expect(p!.message).toContain('年間');
  });

  it('子ども関連費が大きくても削減推奨の文言にならない', () => {
    const p = points({ children: 80000 }).find((x) => x.id === 'children');
    expect(p).toBeDefined();
    expect(p!.message).toMatch(/見込んで|反映/);
    expect(p!.message).not.toMatch(/削るべき|減らしましょう|無駄/);
  });

  it('医療費が大きくても削減推奨の文言にならない', () => {
    const p = points({ medical: 50000 }).find((x) => x.id === 'medical');
    expect(p).toBeDefined();
    expect(p!.message).toMatch(/見込んで/);
    expect(p!.message).not.toMatch(/削るべき|減らしましょう|無駄/);
  });
});

describe('getReviewPoints — 件数と優先度', () => {
  it('最大3件までに制限される', () => {
    const all = points({
      communication: 20000,
      subscription: 10000,
      insurance: 30000,
      car: 50000,
      food: 90000,
      leisure: 40000,
    });
    expect(all.length).toBeLessThanOrEqual(3);
  });

  it('医療費・子ども関連費は金額が大きくても見直しやすい固定費より下に並ぶ', () => {
    const order = points({ communication: 30000, medical: 90000, children: 90000 }).map((p) => p.id);
    const ci = order.indexOf('communication');
    expect(ci).toBeGreaterThan(-1);
    const mi = order.indexOf('medical');
    const chi = order.indexOf('children');
    // 通信費（見直しやすい固定費）は医療費・子ども関連費より前（未掲載は最下位扱い）。
    expect(ci).toBeLessThan(mi === -1 ? Infinity : mi);
    expect(ci).toBeLessThan(chi === -1 ? Infinity : chi);
  });
});

describe('REVIEW 文言 — 禁止表現を含まない', () => {
  const forbidden = /削るべき|無駄|高すぎ|節約しましょう|解約しましょう|手放|減らしましょう|平均より悪い/;

  it('全カテゴリの title / message / note に禁止表現が無い', () => {
    for (const text of Object.values(REVIEW.points)) {
      expect(text.title).not.toMatch(forbidden);
      expect(text.message).not.toMatch(forbidden);
      expect(text.note).not.toMatch(forbidden);
    }
  });
});
