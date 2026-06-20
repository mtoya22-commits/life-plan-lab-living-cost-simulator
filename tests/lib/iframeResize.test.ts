import { describe, it, expect } from 'vitest';
import { buildResizeMessage, isEmbedded } from '../../src/lib/iframeResize';

describe('buildResizeMessage', () => {
  it('type と source を固定値で返す', () => {
    const msg = buildResizeMessage(800);
    expect(msg.type).toBe('lifeplanlab:resize');
    expect(msg.source).toBe('living-cost-simulator');
    expect(msg.height).toBe(800);
  });

  it('小数は切り上げる', () => {
    expect(buildResizeMessage(1234.2).height).toBe(1235);
  });

  it('負値・NaN・Infinity は 0 にする', () => {
    expect(buildResizeMessage(-50).height).toBe(0);
    expect(buildResizeMessage(Number.NaN).height).toBe(0);
    expect(buildResizeMessage(Number.POSITIVE_INFINITY).height).toBe(0);
  });
});

describe('isEmbedded', () => {
  it('Node 環境（window 未定義）では false', () => {
    expect(isEmbedded()).toBe(false);
  });
});
