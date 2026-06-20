// iframe 埋め込み時に、自分の高さを親（WordPress）へ postMessage で送る。
// 親側は { type:'lifeplanlab:resize', source, height } を受け取り iframe を伸縮させる
// 受信スクリプトを実装済み。クロスオリジンのため親からは高さを測れず、子が送る必要がある。
// スタンドアロン（GitHub Pages 直接表示）では何もしない。

const RESIZE_TYPE = 'lifeplanlab:resize';
/** 親 iframe の data-lifeplanlab-source と一致させる識別子。 */
const EMBED_SOURCE = 'living-cost-simulator';

export interface ResizeMessage {
  type: typeof RESIZE_TYPE;
  source: typeof EMBED_SOURCE;
  height: number;
}

/** 親へ送る resize メッセージを組み立てる（高さは 0 未満にせず整数へ切り上げ）。純粋関数。 */
export function buildResizeMessage(height: number): ResizeMessage {
  const safe = Number.isFinite(height) ? height : 0;
  return { type: RESIZE_TYPE, source: EMBED_SOURCE, height: Math.max(0, Math.ceil(safe)) };
}

/** iframe に埋め込まれているか（SSR / Node ガード込み）。 */
export function isEmbedded(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

/** 現在のコンテンツ高さ（px）。 */
function measureHeight(): number {
  const doc = document.documentElement;
  const body = document.body;
  return Math.max(doc?.scrollHeight ?? 0, body?.scrollHeight ?? 0);
}

/**
 * 埋め込み時のみ: html に is-embedded を付け、コンテンツ高さの変化を親へ送り続ける。
 * 非埋め込み時は no-op。戻り値で監視を解除できる。
 */
export function initIframeResize(): () => void {
  if (!isEmbedded()) return () => {};

  document.documentElement.classList.add('is-embedded');

  let raf = 0;
  const send = () => {
    raf = 0;
    window.parent.postMessage(buildResizeMessage(measureHeight()), '*');
  };
  const schedule = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(send);
  };

  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  // フォント・レイアウト確定後の取りこぼしを拾う保険。
  const timers = [0, 200, 600].map((ms) => window.setTimeout(schedule, ms));

  return () => {
    if (raf) cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('load', schedule);
    timers.forEach((t) => window.clearTimeout(t));
  };
}
