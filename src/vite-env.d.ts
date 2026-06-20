/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 総合版（人生全体の資産推移）の遷移先 URL。未設定時は本番デフォルトを使う。 */
  readonly VITE_LIFE_PLAN_LAB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
