import type { CostType } from '../types/livingCost';

// 固定費 / 変動費を一目で見分けるための色定義（単一ソース）。
// ドーナツの弧・凡例スウォッチ・横棒グラフの塗り・固定/変動チップが
// すべてここを参照することで、凡例とグラフの色が必ず一致する。
//
// 方針: 赤系は使わない。LIFE PLAN LAB の落ち着いたトーンを保ちつつ、
// 色相（寒色のティール ↔ 暖色寄りのオリーブ）と明度の差をしっかりつけて、
// 色覚多様性にも配慮する。色だけに頼らず、テキストでも固定/変動を併記する。
export const COST_TYPE_COLORS: Record<CostType, string> = {
  fixed: '#4f6f78', // グレイッシュなスレートティール（寒色寄り）
  variable: '#7e8a44', // 落ち着いたオリーブグリーン（暖色寄り）
};

/** 固定費 / 変動費の表示色を返す。 */
export function getCostColor(costType: CostType): string {
  return COST_TYPE_COLORS[costType];
}
