import { describe, it, expect } from 'vitest';
import { LIFE_PLAN_LAB_URL, buildComprehensiveUrl } from '../../src/lib/comprehensiveLink';

describe('LIFE_PLAN_LAB_URL', () => {
  it('本番デフォルトは fire-lifeplan-lab.com（env 未設定時）', () => {
    // テスト環境では VITE_LIFE_PLAN_LAB_URL を設定していないため、本番デフォルトが使われる。
    expect(LIFE_PLAN_LAB_URL).toBe('https://fire-lifeplan-lab.com/life-plan-simulator/');
  });

  it('プレースホルダ（example.com）は残っていない', () => {
    expect(LIFE_PLAN_LAB_URL).not.toContain('example.com');
  });
});

describe('buildComprehensiveUrl', () => {
  it('livingCostMonthly と livingCostSource を付与する', () => {
    const url = buildComprehensiveUrl('https://example.com/life-plan-lab/', 297000, 'categoryScenario');
    expect(url).toContain('livingCostMonthly=297000');
    expect(url).toContain('livingCostSource=categoryScenario');
  });

  it('source は breakdownTotal / quickAdjust / categoryScenario のいずれか', () => {
    for (const source of ['breakdownTotal', 'quickAdjust', 'categoryScenario'] as const) {
      const url = buildComprehensiveUrl('https://example.com/', 310000, source);
      expect(url).toContain(`livingCostSource=${source}`);
    }
  });

  it('base に ? が無ければ ? 、あれば & で連結する', () => {
    expect(buildComprehensiveUrl('https://example.com/', 100000, 'breakdownTotal')).toContain(
      '?livingCostMonthly=100000',
    );
    expect(buildComprehensiveUrl('https://example.com/?x=1', 100000, 'breakdownTotal')).toContain(
      '?x=1&livingCostMonthly=100000',
    );
  });

  it('金額は0円未満にならず整数で付与される', () => {
    const url = buildComprehensiveUrl('https://example.com/', -50, 'breakdownTotal');
    expect(url).toContain('livingCostMonthly=0');
  });

  it('汎用名 monthly 単体は使わない（衝突回避）', () => {
    const url = buildComprehensiveUrl('https://example.com/', 100000, 'breakdownTotal');
    expect(url).not.toMatch(/[?&]monthly=/);
  });
});
