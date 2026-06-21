// iframe 埋め込み時に、自分の実コンテンツ高さを親（WordPress）へ postMessage で送る。
// 親側は { type:'lifeplanlab:resize', source, height } を受け取り iframe を伸縮させる。
// クロスオリジンのため親からは高さを測れず、子が送る必要がある。
// 計測は React 実体（.app、無ければ #root）基準で行い、documentElement / body の高さは使わない
// （iframe 高さが body 高へ反映されて空白が自己増殖するのを防ぐ）。
// スタンドアロン（GitHub Pages 直接表示）では何もしない。

const RESIZE_TYPE = 'lifeplanlab:resize';
const SCROLLTOP_TYPE = 'lifeplanlab:scrollTop';
/** 親 iframe の data-lifeplanlab-source と一致させる識別子。 */
const EMBED_SOURCE = 'living-cost-simulator';
/** 親へ送る最低高さ（px）。 */
const MIN_HEIGHT = 320;
/** 下端切れ防止の安全余白（px）。 */
const SAFETY_MARGIN = 8;

export interface ResizeMessage {
  type: typeof RESIZE_TYPE;
  source: typeof EMBED_SOURCE;
  height: number;
}

export interface ScrollTopMessage {
  type: typeof SCROLLTOP_TYPE;
  source: typeof EMBED_SOURCE;
}

/** 実コンテンツ高さに安全余白を足し、最低高さでクランプする（整数）。純粋関数。 */
export function clampHeight(natural: number): number {
  const safe = Number.isFinite(natural) ? natural : 0;
  return Math.max(MIN_HEIGHT, Math.ceil(safe) + SAFETY_MARGIN);
}

/** 親へ送る resize メッセージを組み立てる。純粋関数。 */
export function buildResizeMessage(natural: number): ResizeMessage {
  return { type: RESIZE_TYPE, source: EMBED_SOURCE, height: clampHeight(natural) };
}

/** 画面遷移時に親へ送る scrollTop メッセージ。純粋関数。 */
export function buildScrollTopMessage(): ScrollTopMessage {
  return { type: SCROLLTOP_TYPE, source: EMBED_SOURCE };
}

/** iframe に埋め込まれているか（SSR / Node ガード込み）。 */
export function isEmbedded(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

/** 計測対象の要素（.app 優先・無ければ #root）。 */
function measureTarget(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.app') ?? document.getElementById('root');
}

/** 実コンテンツ高さ（px）。documentElement / body は使わない。 */
function measureContentHeight(): number {
  const el = measureTarget();
  if (!el) return 0;
  return Math.max(el.scrollHeight, el.getBoundingClientRect().height);
}

function postHeight(): void {
  window.parent.postMessage(buildResizeMessage(measureContentHeight()), '*');
}

function postScrollTop(): void {
  window.parent.postMessage(buildScrollTopMessage(), '*');
}

/** 画面遷移時に親へ通知（先頭スクロール＋高さ再送）。埋め込み時のみ動作。 */
export function notifyScreenChange(): void {
  if (!isEmbedded()) return;
  postScrollTop();
  requestAnimationFrame(postHeight);
}

/**
 * 埋め込み時のみ: html に is-embedded を付け、コンテンツ高さの変化を親へ送り続ける。
 * 入力変更・折りたたみ開閉・結果表示などのレイアウト変化、リサイズ、フォント読込後に再計測する。
 * 非埋め込み時は no-op。戻り値で監視を解除できる。
 */
export function initIframeResize(): () => void {
  if (!isEmbedded()) return () => {};

  document.documentElement.classList.add('is-embedded');

  let raf = 0;
  const send = () => {
    raf = 0;
    postHeight();
  };
  const schedule = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(send);
  };

  // #root は常に存在し、中の .app が伸縮すると一緒に変化する。
  const root = document.getElementById('root');
  const observer = new ResizeObserver(schedule);
  if (root) observer.observe(root);

  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  // フォント読込後の取りこぼしを拾う。
  if (document.fonts?.ready) document.fonts.ready.then(schedule).catch(() => {});
  // レイアウト確定後の保険。
  const timers = [0, 200, 600].map((ms) => window.setTimeout(schedule, ms));

  return () => {
    if (raf) cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('load', schedule);
    timers.forEach((t) => window.clearTimeout(t));
  };
}
