import { describe, it, expect } from 'vitest';
import {
  buildResizeMessage,
  buildScrollTopMessage,
  clampHeight,
  isEmbedded,
} from '../../src/lib/iframeResize';

describe('clampHeight', () => {
  it('実コンテンツ高さに 8px の安全余白を足す', () => {
    expect(clampHeight(800)).toBe(808);
    expect(clampHeight(400)).toBe(408);
  });

  it('小数は切り上げてから余白を足す', () => {
    expect(clampHeight(1234.2)).toBe(1243); // ceil(1234.2)=1235 +8
  });

  it('最低高さ 320px を下回らない（小さい値・負値・NaN・Infinity）', () => {
    expect(clampHeight(100)).toBe(320);
    expect(clampHeight(0)).toBe(320);
    expect(clampHeight(-50)).toBe(320);
    expect(clampHeight(Number.NaN)).toBe(320);
    expect(clampHeight(Number.POSITIVE_INFINITY)).toBe(320);
  });
});

describe('buildResizeMessage', () => {
  it('type と source を固定値で返し、height は clampHeight 済み', () => {
    const msg = buildResizeMessage(800);
    expect(msg.type).toBe('lifeplanlab:resize');
    expect(msg.source).toBe('living-cost-simulator');
    expect(msg.height).toBe(808);
  });
});

describe('buildScrollTopMessage', () => {
  it('画面遷移用の scrollTop メッセージを返す', () => {
    expect(buildScrollTopMessage()).toEqual({
      type: 'lifeplanlab:scrollTop',
      source: 'living-cost-simulator',
    });
  });
});

describe('isEmbedded', () => {
  it('Node 環境（window 未定義）では false', () => {
    expect(isEmbedded()).toBe(false);
  });
});
