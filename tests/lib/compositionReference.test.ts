import { describe, it, expect } from 'vitest';
import { calcResult } from '../../src/lib/calc';
import {
  REFERENCE_COMPOSITION_2025,
  buildCompositionComparison,
} from '../../src/lib/compositionReference';
import { COMPARISON, COMPOSITION } from '../../src/strings/ja';
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

function comp(overrides: Partial<CategoryAmounts>) {
  const input: LivingCostInput = { categories: { ...emptyCategories, ...overrides } };
  return buildCompositionComparison(calcResult(input));
}

const REF_TOTAL =
  REFERENCE_COMPOSITION_2025.food.monthlyAmount +
  REFERENCE_COMPOSITION_2025.utilities.monthlyAmount +
  REFERENCE_COMPOSITION_2025.dailyGoods.monthlyAmount +
  REFERENCE_COMPOSITION_2025.communication.monthlyAmount +
  REFERENCE_COMPOSITION_2025.car.monthlyAmount +
  REFERENCE_COMPOSITION_2025.medical.monthlyAmount +
  REFERENCE_COMPOSITION_2025.children.monthlyAmount +
  REFERENCE_COMPOSITION_2025.leisure.monthlyAmount;

describe('buildCompositionComparison — 比較対象', () => {
  it('insurance / subscription / other は比較対象から除外される', () => {
    const r = comp({ food: 100000, insurance: 50000, subscription: 30000, other: 40000 });
    const keys = r.items.map((i) => i.categoryKey);
    expect(keys).not.toContain('insurance');
    expect(keys).not.toContain('subscription');
    expect(keys).not.toContain('other');
    // comparableTotal は food のみ（保険等は除外）。
    expect(r.comparableTotal).toBe(100000);
  });

  it('referenceComparableTotal は対象8カテゴリの参考額合計', () => {
    const r = comp({ food: 100000 });
    expect(r.referenceComparableTotal).toBe(REF_TOTAL);
  });

  it('参考値の分母に住宅費・保険料・サブスク・その他を含めない', () => {
    const keys = Object.keys(REFERENCE_COMPOSITION_2025);
    for (const excluded of ['housing', 'rent', 'insurance', 'subscription', 'other']) {
      expect(keys).not.toContain(excluded);
    }
    // 8カテゴリのみで構成され、それらの合計と一致する。
    expect(keys).toHaveLength(8);
    expect(comp({ food: 100000 }).referenceComparableTotal).toBe(REF_TOTAL);
  });

  it('referenceShare は totalRatio ではなく referenceMonthly / referenceComparableTotal', () => {
    const food = comp({ food: 100000, communication: 100000 }).items.find((i) => i.categoryKey === 'food')!;
    expect(food.referenceShare).toBeCloseTo(REFERENCE_COMPOSITION_2025.food.monthlyAmount / REF_TOTAL, 6);
    // 消費支出全体に対する totalRatio（0.302）とは一致しない。
    expect(food.referenceShare).not.toBeCloseTo(REFERENCE_COMPOSITION_2025.food.totalRatio, 3);
  });

  it('比較できる入力が無ければ items / highlighted は空', () => {
    const r = comp({ insurance: 50000 });
    expect(r.items).toHaveLength(0);
    expect(r.highlightedItems).toHaveLength(0);
  });
});

describe('buildCompositionComparison — 構成比と balanceIndex', () => {
  it('userShare / referenceShare / balanceIndex が正しい', () => {
    const r = comp({ food: 100000, communication: 100000 });
    const food = r.items.find((i) => i.categoryKey === 'food')!;
    expect(r.comparableTotal).toBe(200000);
    expect(food.userShare).toBeCloseTo(0.5, 6);
    expect(food.referenceShare).toBeCloseTo(REFERENCE_COMPOSITION_2025.food.monthlyAmount / REF_TOTAL, 6);
    expect(food.balanceIndex).toBeCloseTo(0.5 / (REFERENCE_COMPOSITION_2025.food.monthlyAmount / REF_TOTAL), 6);
  });

  it('balanceIndex 1.5以上で muchHigher', () => {
    // communication: userShare 0.5 vs ref ~0.05 → index ~10
    const r = comp({ food: 100000, communication: 100000 });
    expect(r.items.find((i) => i.categoryKey === 'communication')!.level).toBe('muchHigher');
  });

  it('balanceIndex 1.2〜1.5で higher', () => {
    // food: userShare 0.5 vs ref ~0.408 → index ~1.22
    const r = comp({ food: 100000, communication: 100000 });
    expect(r.items.find((i) => i.categoryKey === 'food')!.level).toBe('higher');
  });

  it('参考と同じ構成比なら near（balanceIndex≈1）', () => {
    const r = comp({
      food: REFERENCE_COMPOSITION_2025.food.monthlyAmount,
      utilities: REFERENCE_COMPOSITION_2025.utilities.monthlyAmount,
      dailyGoods: REFERENCE_COMPOSITION_2025.dailyGoods.monthlyAmount,
      communication: REFERENCE_COMPOSITION_2025.communication.monthlyAmount,
      car: REFERENCE_COMPOSITION_2025.car.monthlyAmount,
      medical: REFERENCE_COMPOSITION_2025.medical.monthlyAmount,
      children: REFERENCE_COMPOSITION_2025.children.monthlyAmount,
      leisure: REFERENCE_COMPOSITION_2025.leisure.monthlyAmount,
    });
    expect(r.items.every((i) => i.level === 'near')).toBe(true);
    expect(r.highlightedItems).toHaveLength(0);
  });
});

describe('buildCompositionComparison — highlightedItems', () => {
  it('higher / muchHigher のみを最大3件返す', () => {
    const r = comp({
      food: 10000,
      communication: 50000,
      dailyGoods: 50000,
      medical: 50000,
      children: 50000,
    });
    expect(r.highlightedItems).toHaveLength(3);
    expect(r.highlightedItems.every((i) => i.level === 'higher' || i.level === 'muchHigher')).toBe(true);
  });
});

describe('buildCompositionComparison — 低データガード', () => {
  it('comparableTotal が 50,000円未満なら lowData かつ highlighted 空', () => {
    const r = comp({ food: 20000, communication: 10000 });
    expect(r.comparableTotal).toBeLessThan(50000);
    expect(r.lowData).toBe(true);
    expect(r.highlightedItems).toHaveLength(0);
  });

  it('比較対象の入力が1カテゴリだけなら lowData かつ highlighted 空', () => {
    const r = comp({ food: 200000 });
    expect(r.items).toHaveLength(1);
    expect(r.lowData).toBe(true);
    expect(r.highlightedItems).toHaveLength(0);
  });

  it('十分な入力があれば lowData は false', () => {
    const r = comp({ food: 100000, communication: 100000 });
    expect(r.lowData).toBe(false);
  });
});

describe('医療費・子ども関連費の highlighted 文言', () => {
  const careful = /減らす|削る|見直しが必要|高すぎ|負担が重い/;

  it('医療費が上位でも削減を促さない見込み文脈になる', () => {
    const r = comp({ food: 40000, medical: 80000, leisure: 40000 });
    const medical = r.highlightedItems.find((i) => i.categoryKey === 'medical');
    expect(medical).toBeDefined();
    expect(medical!.message).toMatch(/見込んで/);
    expect(medical!.message).not.toMatch(careful);
  });

  it('子ども関連費が上位でも削減を促さない見込み文脈になる', () => {
    const r = comp({ food: 40000, children: 80000, leisure: 40000 });
    const children = r.highlightedItems.find((i) => i.categoryKey === 'children');
    expect(children).toBeDefined();
    expect(children!.message).toMatch(/見込んで/);
    expect(children!.message).not.toMatch(careful);
  });
});

describe('ラベル・注記・役割分担', () => {
  it('比率ラベルは「比較対象カテゴリ内の比率」（「あなたの比率」ではない）', () => {
    expect(COMPOSITION.yourShare).toBe('比較対象カテゴリ内の比率');
    expect(COMPOSITION.yourShare).not.toBe('あなたの比率');
  });

  it('注記に比較対象カテゴリ内の構成比・分母除外の趣旨を含む', () => {
    expect(COMPOSITION.note).toContain('比較対象カテゴリ内の構成比');
    expect(COMPOSITION.note).toContain('分母に含めていません');
    expect(COMPOSITION.note).toMatch(/保険料・サブスク・その他/);
  });

  it('intro に除外カテゴリと比率の趣旨を含む', () => {
    expect(COMPOSITION.intro).toMatch(/保険料・サブスク・その他/);
    expect(COMPOSITION.intro).toContain('比率');
  });

  it('支出バランス比較（比率）と世帯人数別目安（金額感）の役割が文言上区別される', () => {
    expect(COMPOSITION.intro).toContain('比率');
    expect(COMPARISON.intro).toContain('金額感');
    expect(COMPOSITION.intro).not.toBe(COMPARISON.intro);
  });

  it('カテゴリ別シナリオへの接続文を持つ', () => {
    expect(COMPOSITION.scenarioLink).toContain('気になる項目を動かしてみる');
  });

  it('参考構成比ラベルは「比較対象カテゴリ内の参考構成比」', () => {
    expect(COMPOSITION.referenceShare).toBe('比較対象カテゴリ内の参考構成比');
  });

  it('注記に「住宅費は分母に含めていない」趣旨を含む', () => {
    expect(COMPOSITION.denominatorNote).toContain('住宅費');
    expect(COMPOSITION.denominatorNote).toContain('分母に含めていません');
    expect(COMPOSITION.note).toContain('住宅費');
  });

  it('注記に「比率だけでなく金額もあわせて参考にする」趣旨を含む', () => {
    expect(COMPOSITION.amountNote).toMatch(/比率だけでなく/);
    expect(COMPOSITION.amountNote).toMatch(/金額もあわせて/);
  });
});

describe('amountIndex / amountLevel と強調の抑制', () => {
  it('amountIndex が userMonthly / referenceMonthly で計算される', () => {
    const r = comp({ food: 100000, communication: 20000, leisure: 5000 });
    const comm = r.items.find((i) => i.categoryKey === 'communication')!;
    expect(comm.amountIndex).toBeCloseTo(20000 / REFERENCE_COMPOSITION_2025.communication.monthlyAmount, 6);
  });

  it('amountLevel が正しく分類される（above / near / below）', () => {
    const r = comp({ food: 100000, communication: 20000, leisure: 5000 });
    const comm = r.items.find((i) => i.categoryKey === 'communication')!; // 20000/11672≈1.71
    const food = r.items.find((i) => i.categoryKey === 'food')!; // 100000/94895≈1.05
    const leisure = r.items.find((i) => i.categoryKey === 'leisure')!; // 5000/32125≈0.16
    expect(comm.amountLevel).toBe('aboveReference');
    expect(food.amountLevel).toBe('nearReference');
    expect(leisure.amountLevel).toBe('belowReference');
  });

  it('balanceIndex が高くても amountIndex が低いカテゴリは highlighted に出ない（補足を付ける）', () => {
    // leisure: 比率は大きめ（balanceIndex>=1.2）だが金額は参考額以下（amountIndex<1）。
    const r = comp({ communication: 40000, leisure: 12000 });
    expect(r.lowData).toBe(false);
    const leisure = r.items.find((i) => i.categoryKey === 'leisure')!;
    expect(leisure.balanceIndex).toBeGreaterThanOrEqual(1.2);
    expect(leisure.amountIndex).toBeLessThan(1.0);
    expect(r.highlightedItems.map((i) => i.categoryKey)).not.toContain('leisure');
    expect(leisure.caveat).toBeTruthy();
  });

  it('balanceIndex と amountIndex が両方高いカテゴリは highlighted に出る', () => {
    const r = comp({ communication: 40000, leisure: 12000 });
    const comm = r.highlightedItems.find((i) => i.categoryKey === 'communication');
    expect(comm).toBeDefined();
    expect(comm!.balanceIndex).toBeGreaterThanOrEqual(1.2);
    expect(comm!.amountIndex).toBeGreaterThanOrEqual(1.0);
  });

  it('食費が低いケースでも、金額が参考額以下のカテゴリは過剰に強調しない', () => {
    const r = comp({ food: 10000, communication: 20000, leisure: 20000 });
    // leisure は構成比は大きいが金額は参考額(32125)以下 → highlighted から除外。
    expect(r.highlightedItems.map((i) => i.categoryKey)).not.toContain('leisure');
  });
});

describe('COMPOSITION 文言 — 禁止表現を含まない', () => {
  // 「良い悪いを示すものではありません」は許容表現。禁止は否定的な断定フレーズ。
  const forbidden = /高すぎ|悪いです|無駄|削るべき|節約しましょう|減らしましょう|見直しが必要|平均より悪い/;
  it('levels と主要文言に禁止表現が無い', () => {
    for (const v of Object.values(COMPOSITION.levels)) expect(v).not.toMatch(forbidden);
    for (const v of Object.values(COMPOSITION.carefulMessages)) expect(v).not.toMatch(forbidden);
    expect(COMPOSITION.intro).not.toMatch(forbidden);
    expect(COMPOSITION.note).not.toMatch(forbidden);
    expect(COMPOSITION.emptyNote).not.toMatch(forbidden);
    expect(COMPOSITION.amountCaveat).not.toMatch(forbidden);
    expect(COMPOSITION.denominatorNote).not.toMatch(forbidden);
    expect(COMPOSITION.amountNote).not.toMatch(forbidden);
    expect(COMPOSITION.lowDataNote).not.toMatch(forbidden);
    expect(COMPOSITION.scenarioLink).not.toMatch(forbidden);
  });
});
