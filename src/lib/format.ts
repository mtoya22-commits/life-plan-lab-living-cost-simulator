// 金額の整形ユーティリティ。表示は「目安」なので円単位の素直な整形にとどめる。

/** 1,234,567 円 のようにカンマ区切りの円表記にする。 */
export function formatYen(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  return `${rounded.toLocaleString('ja-JP')}円`;
}

/** 「月◯円」表記。 */
export function formatMonthlyYen(value: number): string {
  return `${formatYen(value)}/月`;
}

/** 万円単位（小数1桁まで、端数が無ければ整数）。例: 350000 → 「35万円」。 */
export function formatManYen(value: number): string {
  const man = (Number.isFinite(value) ? value : 0) / 10000;
  const text = Number.isInteger(man) ? String(man) : man.toFixed(1);
  return `${text}万円`;
}

/** 割合（0〜1）をパーセント表記にする。例: 0.257 → 「26%」。 */
export function formatPercent(ratio: number): string {
  const pct = Math.round((Number.isFinite(ratio) ? ratio : 0) * 100);
  return `${pct}%`;
}
