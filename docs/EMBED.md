# WordPress 固定ページへの埋め込み手順（生活費見直しシミュレーター）

総合版（WordPress）の固定ページに、本シミュレーターを iframe で埋め込むための手順です。
固定高による二重スクロール・結果画面下部の見切れを避けるため、**iframe の高さを中身に合わせて
自動調整**します。

## 仕組み

- アプリ（子）は、埋め込み時のみ実コンテンツ高さを親へ `postMessage` で送ります。
  - 高さ通知: `{ type: 'lifeplanlab:resize', source: 'living-cost-simulator', height: <px> }`
  - 画面遷移通知: `{ type: 'lifeplanlab:scrollTop', source: 'living-cost-simulator' }`
- 高さは React 実体（`.app`、無ければ `#root`）を基準に計測し、`documentElement` / `body` の高さは
  使いません（iframe 高さが body 高へ反映されて空白が自己増殖するのを防ぐため）。下端切れ防止に
  +8px の安全余白、最低 320px を付けて送ります。
- 画面遷移・入力変更・折りたたみ開閉・リサイズ・フォント読込後に再計測します。
- 埋め込み時は入力画面も結果画面もアプリ内スクロールを使わず、**親 WordPress ページのスクロール1本**で
  読めるようになります。

> 重要: iframe には `class="lifeplanlab-frame"` と `data-lifeplanlab-source="living-cost-simulator"` を
> 必ず付けてください。アプリが送る `source` と一致しないと高さが反映されません。

## 固定ページに貼るコード（カスタム HTML ブロック）

```html
<!-- wp:html -->
<style>
  .lifeplan-embed-wrap { margin: 0; padding: 0; }
  .lifeplan-embed-frame {
    width: 100%;
    height: 720px;      /* 初期値。読み込み後にアプリからの高さで上書きされる */
    min-height: 320px;
    border: 0;
    display: block;
  }
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
  var MIN_HEIGHT = 320;
  var MAX_HEIGHT = 6000; // 結果画面は縦に長いため大きめに（小さいと下端が切れる）
  var RESIZE_TYPE = "lifeplanlab:resize";
  var SCROLL_TOP_TYPE = "lifeplanlab:scrollTop";

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
    if (!data || typeof data !== "object") return;

    if (data.type === RESIZE_TYPE) {
      var frame = findFrame(event, data);
      if (!frame) return;
      var h = parseInt(data.height, 10) || 0;
      var next = Math.min(Math.max(h, MIN_HEIGHT), MAX_HEIGHT);
      frame.style.height = next + "px";
      frame.style.minHeight = next + "px";
      return;
    }

    if (data.type === SCROLL_TOP_TYPE) {
      var target = findFrame(event, data);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();
</script>
<!-- /wp:html -->
```

## 補足

- `MAX_HEIGHT` は結果画面の高さに合わせて調整してください（スマホ幅では縦に長くなります）。
- 子が送る `height` には最低 320px ＋8px の余白がすでに含まれます。親側の `MIN_HEIGHT`（720 など）は
  読み込み直後の見た目用で、子の値とは独立にクランプされます。
- 複数のシミュレーターを同一ページに埋め込む場合は、`data-lifeplanlab-source` を各アプリの値に
  合わせてください（本アプリは `living-cost-simulator`、住宅ローン版は `mortgage-simulator`）。
  受信スクリプトは1つで全フレームを処理できます。
