import type { CategoryKey } from '../types/livingCost';

// UI 文言の一元集約（申し送り §2）。煽らない・止めない・整理する。
// 断定や個別助言（「削るべき」「解約しましょう」等）は使わない。

export const APP = {
  title: '生活費見直しシミュレーター',
  subtitle: 'LIFE PLAN LAB',
};

/** カテゴリ表示名とヘルプ（「どこを見れば入力できるか」の案内）。 */
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  food: '食費・外食費',
  dailyGoods: '日用品・雑費',
  utilities: '水道光熱費',
  communication: '通信費',
  insurance: '保険料',
  car: '車関連費',
  medical: '医療費',
  children: '子ども関連費',
  leisure: 'レジャー・交際費',
  subscription: 'サブスク・会費',
  other: 'その他支出',
};

export const CATEGORY_HELP: Record<CategoryKey, string> = {
  food: 'スーパーでの食料品、外食、テイクアウトなどの合計の目安です。',
  dailyGoods: '洗剤・ティッシュ・消耗品など、日々の細かな買い物の目安です。',
  utilities: '電気・ガス・水道の月額の目安です。季節で変わる場合はならした金額で構いません。',
  communication: 'スマホ・自宅のネット回線などの月額です。',
  insurance: '生命保険・医療保険・自動車保険などの保険料です。月払い換算で構いません。',
  car: 'ガソリン・駐車場・自動車保険を除く維持費・車検積立などの目安です。',
  medical: '通院・薬代など、毎月発生する医療費の目安です。',
  children: '保育料・習い事・学用品・子どもの日用品など、毎月の子ども関連費です。大学費用などの大きな教育費は含めません。',
  leisure: '趣味・旅行積立・交際費・娯楽などの目安です。',
  subscription: '動画配信・音楽・アプリ・会費など、継続的に支払っているものです。',
  other: '上のどれにも当てはまらない、毎月の支出の目安です。',
};

export const INTRO = {
  heading: '生活費見直しシミュレーター',
  lead: '毎月の生活費を分解して、どこに見直し余地がありそうかを、生活設計の目線で確認できます。',
  reassure: '分かる範囲で大丈夫です。未入力でも概算でき、あとから変えて再計算できます。',
  canDoHeading: 'このシミュレーターでできること',
  canDo: [
    '毎月の生活費を、食費や通信費などの内訳に分解して確認できます。',
    '固定費・変動費のどちらが重いかをざっくり把握できます。',
    '月1万円・3万円・5万円下げた場合の年間効果を確認できます。',
    '見直した生活費を、総合版の生活設計へ戻すことができます。',
  ],
  notBudgetApp:
    'これは家計簿アプリではありません。1円単位の管理ではなく、月額の目安で見直しポイントを探るためのツールです。',
  start: 'はじめる',
};

export const INPUT = {
  heading: '毎月の生活費を入力',
  lead: '分かる範囲で入力してください。未入力の項目は空欄か 0 のままで構いません。',
  reassure: '入力金額は月額の目安で構いません。あとから変更して再計算できます。',
  totalLabel: '現在の毎月生活費の合計',
  totalHelp:
    '住宅ローン返済額や大学費用などの大きな教育費を除いた、毎月の日常生活費のおおよその合計です。分からなければ、内訳を入力すると目安になります。',
  // 生活費合計の定義（フィードバック §1）
  totalDefinitionNote:
    'ここで入力する生活費は、住宅ローン返済額や大学費用などの大きな教育費を除いた、日常生活費の目安です。通信費・保険料・車関連費・日常的な子ども関連費は含めてかまいません。',
  breakdownHeading: '内訳（分かる範囲で）',
  // 二重計上の注記（スペック §5）
  mortgageNote:
    '住宅ローン返済額は、住宅ローンシミュレーターや総合版で別に扱う想定です。ここでは、日常生活費の見直しを中心に確認します。',
  educationNote:
    '大学費用などの大きな教育費は、将来的に教育費ピークシミュレーターで確認する想定です。ここでは、毎月発生する子ども関連費を中心に扱います。',
  unit: '円',
  toResult: '結果を見る',
  back: '戻る',
  // 内訳合計が生活費合計を上回ったときのソフトな注意（フィードバック §2）
  overBudgetNotice:
    '入力された内訳合計が、毎月生活費の合計を上回っています。どちらかの金額に入力漏れや重複がないか確認してください。',
};

export const RESULT = {
  heading: '結果',
  monthlyTotal: '毎月の生活費',
  annualTotal: '年間の生活費',
  breakdownTotal: '内訳入力済み',
  uncategorized: '未分類支出',
  uncategorizedNote:
    '内訳の合計と毎月生活費の差額です。まだ入力していない支出が含まれている可能性があります。',
  fixedTotal: '固定費',
  variableTotal: '変動費',
  fixedVariableNote:
    '固定費・変動費の分類は、生活設計上の目安です。実際には家庭ごとに異なる場合があります。',
  breakdownHeading: '支出の内訳',
  overBudgetNotice:
    '入力された内訳合計が、毎月生活費の合計を上回っています。どちらかの金額に入力漏れや重複がないか確認してください。',
  topHeading: '見直し余地がありそうなカテゴリ',
  topNote:
    'これは支出額の大きさに基づく参考表示です。特定の支出削減や保険解約などを推奨するものではありません。',
  // QuickAdjust（生活費を少し動かして見る）
  adjustHeading: '生活費を少し動かして見る',
  adjustLead: '毎月の生活費を少し下げると、年間ではどのくらい変わるかを確認できます。',
  adjustCurrent: '現在の生活費',
  adjustTrial: '試算する生活費',
  adjustIncreaseNote: '支出が増えた場合の影響も、参考として確認できます。',
  adjustMonthly: '毎月の改善額',
  adjustAnnual: '年間の改善額',
  adjustTenYear: '10年間の単純改善額',
  adjustIncreaseMonthly: '毎月の影響額',
  adjustIncreaseAnnual: '年間の影響額',
  adjustIncreaseTenYear: '10年間の単純影響額',
  adjustSelected: '総合版へ反映する生活費',
  adjustReset: '元に戻す',
  // 改善効果テーブル
  effectHeading: '月1万円・3万円・5万円下げた場合の効果',
  effectMonthlyLabel: '毎月',
  effectAnnualLabel: '年間',
  // 反映ボタン（フィードバック §4：現在と改善後を混同しない）
  reflectCurrentBtn: 'この生活費を生活設計に反映する',
  reflectAdjustedBtn: '改善後の生活費を生活設計に反映する',
  reflectBreakdownBtn: '内訳合計を生活費として反映する',
  reflectedCurrent: '現在の生活費を生活設計に反映しました。',
  reflectedAdjusted: '改善後の生活費を生活設計に反映しました。',
  reflectedBreakdown: '内訳合計を生活費として反映しました。',
  reflectFailed: 'この端末では保存できませんでした。設定をご確認のうえ、もう一度お試しください。',
  toComprehensive: '人生全体の資産推移で見る',
  recalc: '条件を変えて再計算',
  conditionHeading: '入力条件の確認',
  // 全体注記（スペック §12）
  disclaimers: [
    'このシミュレーションは、生活設計のための簡易試算です。',
    '家計簿のように1円単位で管理するものではありません。',
    '入力金額は月額の目安で構いません。',
    '住宅ローンや大きな教育費は、別シミュレーターや総合版で扱う想定です。',
    '表示される見直しポイントは、支出額の大きさに基づく参考表示です。',
    '特定の支出削減や保険解約などを推奨するものではありません。',
  ],
  disclaimerHeading: 'このシミュレーションについて',
};

/** 「人生全体の資産推移で見る」の仮の遷移先（総合版の実 URL は今回変更しない）。 */
export const COMPREHENSIVE_URL_PLACEHOLDER = 'https://example.com/life-plan-lab/';
