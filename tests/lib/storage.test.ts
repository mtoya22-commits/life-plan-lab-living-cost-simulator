import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  STORAGE_KEY,
  STORAGE_DRAFT_KEY,
  clearDraft,
  loadDraft,
  loadLivingCost,
  saveDraft,
  saveLivingCost,
} from '../../src/lib/storage';
import type { CategoryAmounts, LivingCostDraft, StoredLivingCostPayload } from '../../src/types/livingCost';

// node 環境用の最小 localStorage モック（storage.ts は window.localStorage を参照する）。
function installMockStorage() {
  const store = new Map<string, string>();
  (globalThis as unknown as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    },
  };
  return store;
}

const emptyCategories: CategoryAmounts = {
  food: 0,
  dailyGoods: 0,
  utilities: 0,
  communication: 0,
  insurance: 0,
  car: 0,
  medical: 0,
  children: 0,
  leisure: 0,
  subscription: 0,
  other: 0,
};

const sampleDraft: LivingCostDraft = {
  version: 1,
  savedAt: '2026-06-16T00:00:00.000Z',
  categories: { ...emptyCategories, food: 90000, communication: 12000 },
  householdSize: 3,
};

const samplePayload: StoredLivingCostPayload = {
  version: 1,
  source: 'living-cost-simulator',
  savedAt: '2026-06-16T00:00:00.000Z',
  livingCost: {
    monthlyTotal: 102000,
    selectedMonthlyTotal: 102000,
    selectedMonthlySource: 'breakdownTotal',
    annualTotal: 1224000,
    breakdownTotal: 102000,
    fixedCostTotal: 12000,
    variableCostTotal: 90000,
    categories: { ...emptyCategories, food: 90000, communication: 12000 },
  },
};

let store: Map<string, string>;
beforeEach(() => {
  store = installMockStorage();
});
afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('下書き（draft）の保存・読込・削除', () => {
  it('saveDraft → loadDraft で往復できる', () => {
    expect(saveDraft(sampleDraft)).toBe(true);
    expect(loadDraft()).toEqual(sampleDraft);
  });

  it('clearDraft で下書きが削除される', () => {
    saveDraft(sampleDraft);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('下書きは下書きキーにのみ書き込む', () => {
    saveDraft(sampleDraft);
    expect(store.has(STORAGE_DRAFT_KEY)).toBe(true);
    expect(store.has(STORAGE_KEY)).toBe(false);
  });
});

describe('確定データと下書きの分離（混同しない）', () => {
  it('saveDraft は確定データ（lifePlanLab:livingCost）を更新しない', () => {
    saveDraft(sampleDraft);
    expect(loadLivingCost()).toBeNull();
  });

  it('saveLivingCost は下書きに影響しない', () => {
    saveDraft(sampleDraft);
    saveLivingCost(samplePayload);
    // 確定データが書かれても、下書きはそのまま残る。
    expect(loadLivingCost()).toEqual(samplePayload);
    expect(loadDraft()).toEqual(sampleDraft);
    expect(store.has(STORAGE_KEY)).toBe(true);
    expect(store.has(STORAGE_DRAFT_KEY)).toBe(true);
  });

  it('clearDraft は確定データを消さない', () => {
    saveLivingCost(samplePayload);
    saveDraft(sampleDraft);
    clearDraft();
    expect(loadDraft()).toBeNull();
    expect(loadLivingCost()).toEqual(samplePayload);
  });
});
