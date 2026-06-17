import type { CompositionComparisonItem, CompositionComparisonResult } from '../../types/livingCost';
import { formatPercent } from '../../lib/format';
import { COMPOSITION } from '../../strings/ja';

// 支出バランスの参考比較カード。生活費全体ではなく、比較対象カテゴリの中での構成比を見る。
// 良し悪し判定ではなく「どこを確認するとよいか」のきっかけ。赤・警告色は使わない。
function ItemRow({ item }: { item: CompositionComparisonItem }) {
  return (
    <li className="composition-item">
      <div className="composition-item__head">
        <span className="composition-item__label">{item.label}</span>
      </div>
      <p className="composition-item__shares">
        {COMPOSITION.yourShare}：{formatPercent(item.userShare)}
        <span className="muted"> / {COMPOSITION.referenceShare}：{formatPercent(item.referenceShare)}</span>
      </p>
      <p className="composition-item__message">{item.message}</p>
      {item.caveat && <p className="muted composition-item__caveat">{item.caveat}</p>}
    </li>
  );
}

export default function CompositionReference({ data }: { data: CompositionComparisonResult }) {
  const { items, highlightedItems, lowData } = data;
  const others = items.filter((i) => !highlightedItems.includes(i));

  return (
    <section className="card composition">
      <h2 className="section-heading">{COMPOSITION.heading}</h2>
      <p className="muted field-note" style={{ marginTop: 0 }}>
        {COMPOSITION.intro}
      </p>

      {items.length === 0 ? (
        <p className="muted">{COMPOSITION.noData}</p>
      ) : (
        <>
          {lowData ? (
            <p className="muted">{COMPOSITION.lowDataNote}</p>
          ) : highlightedItems.length > 0 ? (
            <ul className="composition-list">
              {highlightedItems.map((item) => (
                <ItemRow key={item.categoryKey} item={item} />
              ))}
            </ul>
          ) : (
            <p className="muted">{COMPOSITION.emptyNote}</p>
          )}

          {others.length > 0 && (
            <details className="collapsible collapsible--muted">
              <summary>{COMPOSITION.detailsSummary}</summary>
              <div className="collapsible__body">
                <ul className="composition-list">
                  {others.map((item) => (
                    <ItemRow key={item.categoryKey} item={item} />
                  ))}
                </ul>
              </div>
            </details>
          )}

          <p className="muted field-note composition__link">{COMPOSITION.scenarioLink}</p>
        </>
      )}

      <details className="collapsible collapsible--muted">
        <summary>{COMPOSITION.noteHeading}</summary>
        <div className="collapsible__body">
          <p className="muted">{COMPOSITION.denominatorNote}</p>
          <p className="muted">{COMPOSITION.amountNote}</p>
          <p className="muted">{COMPOSITION.note}</p>
        </div>
      </details>
    </section>
  );
}
