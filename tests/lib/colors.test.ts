import { describe, it, expect } from 'vitest';
import { COST_TYPE_COLORS, getCostColor } from '../../src/lib/colors';

describe('cost-type colors', () => {
  it('固定費と変動費の色が分離されている（同一でない）', () => {
    expect(COST_TYPE_COLORS.fixed).not.toBe(COST_TYPE_COLORS.variable);
  });

  it('赤系の色を使っていない（簡易チェック: R が突出していない）', () => {
    for (const hex of Object.values(COST_TYPE_COLORS)) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      expect(r).toBeLessThanOrEqual(Math.max(g, b));
    }
  });

  it('getCostColor は単一ソースを返す（凡例とグラフで同じ色になる担保）', () => {
    expect(getCostColor('fixed')).toBe(COST_TYPE_COLORS.fixed);
    expect(getCostColor('variable')).toBe(COST_TYPE_COLORS.variable);
    // 何度呼んでも安定
    expect(getCostColor('fixed')).toBe(getCostColor('fixed'));
  });
});
