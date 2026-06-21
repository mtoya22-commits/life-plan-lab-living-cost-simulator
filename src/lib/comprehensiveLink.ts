import type { SelectedMonthlySource } from '../types/livingCost';

// 総合版（人生全体の資産推移）の本番 URL。
// 環境変数 VITE_LIFE_PLAN_LAB_URL で上書きでき、未設定時は本番デフォルトを使う。
// プレースホルダ（example.com）へのフォールバックは作らない。
export const LIFE_PLAN_LAB_URL =
  import.meta.env.VITE_LIFE_PLAN_LAB_URL ?? 'https://fire-lifeplan-lab.com/life-plan-simulator/';

// 総合版（人生全体の資産推移）へのリンクに、選んだ生活費を補助的に付与する。
// 主役はあくまで localStorage（lifePlanLab:livingCost）。URL は将来連携用の補助情報で、
// 総合版が未対応でも壊れない（読み飛ばされるだけ）。汎用名は避けて衝突を防ぐ。
export function buildComprehensiveUrl(
  base: string,
  monthly: number,
  source: SelectedMonthlySource,
): string {
  const sep = base.includes('?') ? '&' : '?';
  const yen = Math.max(0, Math.round(Number.isFinite(monthly) ? monthly : 0));
  const params = new URLSearchParams({
    livingCostMonthly: String(yen),
    livingCostSource: source,
  });
  return `${base}${sep}${params.toString()}`;
}

// 「人生全体の資産推移で見る」押下時の流れ: まず確定データを保存し、成功したときだけ遷移する。
// 失敗時は遷移せず onSaveFailed を呼ぶ（既存の RESULT.reflectFailed を表示）。DOM 非依存。
export function handoffToComprehensive(opts: {
  save: () => boolean;
  navigate: () => void;
  onSaveFailed: () => void;
}): boolean {
  if (!opts.save()) {
    opts.onSaveFailed();
    return false;
  }
  opts.navigate();
  return true;
}
