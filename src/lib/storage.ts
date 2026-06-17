import type { LivingCostDraft, StoredLivingCostPayload } from '../types/livingCost';

// 総合版へ生活費条件を引き継ぐための localStorage 連携。
// 保存形式は src/types/livingCost.ts の StoredLivingCostPayload に揃える。
//
// キーは2つに分ける（混同しない）:
//   STORAGE_KEY       … 「生活設計に反映する」を押したときの確定データ（総合版反映用）
//   STORAGE_DRAFT_KEY … 入力画面の途中内容を自動保存する下書き（離脱しても復元できる）
export const STORAGE_KEY = 'lifePlanLab:livingCost';
export const STORAGE_DRAFT_KEY = 'lifePlanLab:livingCostDraft';

/** localStorage を安全に取得する（SSR/プライベートブラウズ等で無い場合は null）。 */
function getStore(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 生活費データ（確定）を localStorage へ保存する。保存できたら true。 */
export function saveLivingCost(payload: StoredLivingCostPayload): boolean {
  const store = getStore();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    // プライベートブラウズ等で書き込めない場合も UI は止めない。
    return false;
  }
}

/** 保存済みの生活費データ（確定）を読み出す（無ければ null）。 */
export function loadLivingCost(): StoredLivingCostPayload | null {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredLivingCostPayload) : null;
  } catch {
    return null;
  }
}

/** 入力途中の下書きを自動保存する。確定データ（STORAGE_KEY）には触れない。 */
export function saveDraft(draft: LivingCostDraft): boolean {
  const store = getStore();
  if (!store) return false;
  try {
    store.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/** 入力途中の下書きを読み出す（無ければ null）。 */
export function loadDraft(): LivingCostDraft | null {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as LivingCostDraft) : null;
  } catch {
    return null;
  }
}

/** 入力途中の下書きを削除する（「新しく入力する」を選んだとき等）。 */
export function clearDraft(): void {
  const store = getStore();
  if (!store) return;
  try {
    store.removeItem(STORAGE_DRAFT_KEY);
  } catch {
    // 失敗しても UI は止めない。
  }
}
