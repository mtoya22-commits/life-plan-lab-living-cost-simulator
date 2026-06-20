# 生活費見直しシミュレーター（LIFE PLAN LAB）

毎月の生活費をカテゴリ内訳に分解し、固定費/変動費・見直しポイント・支出バランスを
確認して、見直し後の生活費を総合版 LIFE PLAN LAB の生活設計へ戻すための小型シミュレーターです。

家計簿アプリではありません。1円単位の管理ではなく、月額の目安で「どこを確認すると
生活設計に効きやすいか」を整理するためのツールです。煽らない・決めつけない・止めない・
いつでも再計算できる体験を大切にしています。

> 総合版（life-plan-lab 本体）リポジトリは、この MVP では変更しません。

## 技術構成

- React + Vite + TypeScript
- 状態は React `useState`（依存を増やさない方針）
- 計算ロジックは `src/lib` に純粋関数として分離、UI 文言は `src/strings/ja.ts` に集約
- グラフは依存追加なしの自作（CSS 横棒 / 自作 SVG ドーナツ）

## 開発・ビルド

```bash
npm install      # 依存をインストール
npm run dev      # ローカル開発サーバ（http://localhost:5173）
npm test         # vitest（計算ロジック等のテスト）
npm run build    # 本番ビルド（dist/、base: './' の相対パス出力）
```

## 環境変数

| 変数 | 用途 |
|---|---|
| `VITE_LIFE_PLAN_LAB_URL` | 「人生全体の資産推移で見る」リンクの遷移先。未設定時は本番デフォルト `https://fire-lifeplan-lab.com/life-plan-simulator/` を使います。 |

ビルド時に値を埋め込みたい場合は `.env` などで設定します（例: `VITE_LIFE_PLAN_LAB_URL=https://…`）。
未設定でも本番 URL に遷移し、プレースホルダ URL へは遷移しません。

## GitHub Pages 公開

- `.github/workflows/deploy-pages.yml` により、`main` への push または手動実行
  （workflow_dispatch）で GitHub Pages へデプロイします。
- フィーチャーブランチの push ではデプロイしません（事故防止）。
- リポジトリの Settings → Pages のソースを「GitHub Actions」に設定してください。

## 主な機能

- 生活費の内訳入力（11カテゴリ。毎月の生活費の合計は内訳から自動計算）
- 固定費 / 変動費の割合（ドーナツ）
- 生活費を少し動かして見る（QuickAdjust：全体をざっくり試算）
- 生活費で確認したいポイント（どのカテゴリを確認するとよいかの参考）
- 支出バランスの参考比較（比較対象カテゴリ内の構成比）
- 気になる項目を動かしてみる（カテゴリ別見直しシナリオ：項目別に試算）
- 世帯人数別の一般的な支出目安との参考比較
- 総合版への反映（localStorage）

## localStorage キー

| キー | 用途 |
|---|---|
| `lifePlanLab:livingCost` | **総合版反映用の確定データ**。結果画面の「生活設計に反映する」を押したときのみ更新する。 |
| `lifePlanLab:livingCostDraft` | **入力途中の自動保存（下書き）**。途中離脱しても再訪問時に「前回の内容から再開」できる。確定データとは別物で、混同しない。 |

- 入力中の自動保存は下書きキーのみを更新し、確定データには触れません。
- 「新しく入力する」を選ぶと下書きを削除します。

## URL パラメータ

総合版へのリンク（「人生全体の資産推移で見る」）には、選択中の生活費を**補助的に**付与します。
主な連携は localStorage で、URL パラメータは将来の総合版連携に備えた補助情報です
（総合版が未対応でも壊れません）。

| パラメータ | 内容 |
|---|---|
| `livingCostMonthly` | 反映対象の毎月生活費（円） |
| `livingCostSource` | `breakdownTotal` / `quickAdjust` / `categoryScenario` のいずれか |

また、総合版から現在の生活費を渡す将来フックとして `?ref=<円>` を読み取り、
入力／結果画面で参考値との差をやさしく表示します。

## WordPress への埋め込み（iframe オートリサイズ）

総合版（WordPress）に iframe で埋め込むと、結果画面は縦に長いため固定高では下端が見切れます。
本アプリは埋め込み時のみ、自分のコンテンツ高さを親へ `postMessage` で送り、親が iframe を
中身に合わせて伸縮できるようにしています（`src/lib/iframeResize.ts`）。

- 送るメッセージ: `{ type: 'lifeplanlab:resize', source: 'living-cost-simulator', height: <px> }`
- 埋め込み時は `<html>` に `is-embedded` が付き、入力画面も自然フロー（親スクロール）になります。
  スタンドアロン表示（GitHub Pages 直接）では従来どおりで、挙動は変わりません。

WordPress 側のコピペ用 Custom HTML（受信スクリプト込み）:

```html
<!-- wp:html -->
<style>
  .lifeplan-embed-wrap { margin: 0; padding: 0; }
  .lifeplan-embed-frame { width: 100%; height: 720px; min-height: 720px; border: 0; display: block; }
</style>
<div class="lifeplan-embed-wrap">
  <iframe
    id="lifeplan-livingcost-frame"
    class="lifeplan-embed-frame lifeplanlab-frame"
    data-lifeplanlab-source="living-cost-simulator"
    src="https://mtoya22-commits.github.io/life-plan-lab-living-cost-simulator/"
    title="生活費見直しシミュレーター"
    scrolling="no"
    loading="lazy">
  </iframe>
</div>
<script>
(function () {
  var MIN_HEIGHT = 720;
  var MAX_HEIGHT = 6000; // 結果画面が長いため大きめに（ローン版の 3000 では足りない場合あり）
  var RESIZE_TYPE = "lifeplanlab:resize";
  function findFrame(event, data) {
    var frames = document.querySelectorAll("iframe.lifeplanlab-frame");
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      if (event.source !== frame.contentWindow) continue;
      if (data.source && frame.getAttribute("data-lifeplanlab-source") !== data.source) continue;
      return frame;
    }
    return null;
  }
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || typeof data !== "object" || data.type !== RESIZE_TYPE) return;
    var frame = findFrame(event, data);
    if (!frame) return;
    var h = parseInt(data.height, 10) || 0;
    var next = Math.min(Math.max(h, MIN_HEIGHT), MAX_HEIGHT);
    frame.style.height = next + "px";
    frame.style.minHeight = next + "px";
  });
})();
</script>
<!-- /wp:html -->
```

> 重要: `class="lifeplanlab-frame"` と `data-lifeplanlab-source="living-cost-simulator"` を必ず付けてください
> （アプリが送る `source` と一致しないと高さが反映されません）。`MAX_HEIGHT` は結果画面の高さに合わせて
> 大きめにします（スマホ幅では縦に長くなるため）。

## 試算と入力条件の扱い

- QuickAdjust とカテゴリ別シナリオは結果画面上の**一時試算**です。入力条件そのものは変えません。
- 「条件を変えて再計算」で入力画面に戻ると、**入力内容（カテゴリ金額・世帯人数）は残り、
  一時試算（QuickAdjust・カテゴリ別シナリオ）は初期化**されます。

## 比較機能の注意

- **支出バランスの参考比較**は、生活費全体ではなく「比較対象カテゴリ内の構成比」です。
  住宅費・保険料・サブスク・その他は分母に含めていません。
- **世帯人数別の一般的な支出目安**は、総務省「家計調査」をもとにした参考情報です。
- いずれも**良い悪いを判定するものではなく**、支出バランスや見直しのきっかけを得るための参考表示です。
