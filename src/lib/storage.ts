import type { StoredLivingCostPayload } from '../types/livingCost';

// 総合版へ生活費条件を引き継ぐための localStorage 連携。
// 保存形式は src/types/livingCost.ts の StoredLivingCostPayload に揃える。
export const STORAGE_KEY = 'lifePlanLab:livingCost';

/** 生活費データを localStorage へ保存する。保存できたら true。 */
export function saveLivingCost(payload: StoredLivingCostPayload): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    // プライベートブラウズ等で書き込めない場合も UI は止めない。
    return false;
  }
}

/** 保存済みの生活費データを読み出す（無ければ null）。 */
export function loadLivingCost(): StoredLivingCostPayload | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLivingCostPayload;
  } catch {
    return null;
  }
}
