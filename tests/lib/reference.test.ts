import { describe, it, expect } from 'vitest';
import {
  HOUSEHOLD_SIZE_REFERENCES,
  compareWithReference,
  getHouseholdReference,
} from '../../src/lib/reference';
import { COMPARISON } from '../../src/strings/ja';

describe('getHouseholdReference', () => {
  it('1人世帯の目安が 173000 円', () => {
    expect(getHouseholdReference(1)).toBe(173000);
  });
  it('2人世帯の目安が 281000 円', () => {
    expect(getHouseholdReference(2)).toBe(281000);
  });
  it('3人世帯の目安が 324000 円', () => {
    expect(getHouseholdReference(3)).toBe(324000);
  });
  it('4人世帯の目安が 363000 円', () => {
    expect(getHouseholdReference(4)).toBe(363000);
  });
  it('5人以上の目安が 364000 円', () => {
    expect(getHouseholdReference(5)).toBe(364000);
  });
  it('定数は 5 段階すべて持つ', () => {
    expect(Object.keys(HOUSEHOLD_SIZE_REFERENCES)).toEqual(['1', '2', '3', '4', '5']);
  });
});

describe('compareWithReference', () => {
  it('差額と差額比率が正しく計算される', () => {
    const c = compareWithReference(180000, 3); // 目安 324000
    expect(c.referenceMonthly).toBe(324000);
    expect(c.actualMonthly).toBe(180000);
    expect(c.diffMonthly).toBe(180000 - 324000);
    expect(c.diffRatio).toBeCloseTo((180000 - 324000) / 324000, 6);
  });

  it('±10%以内なら near（一般的な目安に近い水準です）', () => {
    const c = compareWithReference(324000, 3); // ちょうど目安
    expect(c.level).toBe('near');
    expect(c.label).toBe('一般的な目安に近い水準です');
    // +5% も near
    expect(compareWithReference(Math.round(324000 * 1.05), 3).level).toBe('near');
  });

  it('+10〜20% は slightlyHigh', () => {
    expect(compareWithReference(Math.round(324000 * 1.15), 3).level).toBe('slightlyHigh');
  });

  it('+20%以上は high（否定的・断定的表現を含まない）', () => {
    const c = compareWithReference(Math.round(324000 * 1.3), 3);
    expect(c.level).toBe('high');
    expect(c.label).not.toMatch(/無駄|削|高すぎ|必要|べき/);
  });

  it('−10〜20% は slightlyLow', () => {
    expect(compareWithReference(Math.round(324000 * 0.85), 3).level).toBe('slightlyLow');
  });

  it('−20%以上低い場合も断定的・否定的にならない', () => {
    const c = compareWithReference(Math.round(324000 * 0.5), 3);
    expect(c.level).toBe('low');
    expect(c.label).not.toMatch(/無駄|削|だめ|べき|低すぎ/);
  });

  it('householdSize をそのまま保持する（5=5人以上）', () => {
    expect(compareWithReference(300000, 5).householdSize).toBe(5);
  });
});

describe('COMPARISON.labels', () => {
  it('5段階すべてのラベルが否定・断定語を含まない', () => {
    const forbidden = /無駄|削るべき|高すぎ|低すぎ|見直しが必要|だめ/;
    for (const label of Object.values(COMPARISON.labels)) {
      expect(label).not.toMatch(forbidden);
    }
  });
});
