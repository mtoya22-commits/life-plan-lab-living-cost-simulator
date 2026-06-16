import type { HouseholdComparison as HouseholdComparisonData } from '../../types/livingCost';
import { formatManYen, formatMonthlyYen } from '../../lib/format';
import { COMPARISON } from '../../strings/ja';

// 世帯人数別の一般的な支出目安との「参考比較」カード。
// 評価・診断ではなく参考表示。煽らず・止めず・やわらかいコメントにとどめる。
export default function HouseholdComparison({ data }: { data: HouseholdComparisonData }) {
  const { householdSize, referenceMonthly, actualMonthly, diffMonthly, label } = data;
  const sign = diffMonthly > 0 ? '+' : diffMonthly < 0 ? '−' : '±';

  return (
    <section className="card">
      <h2 className="section-heading">{COMPARISON.heading}</h2>
      <ul className="compare-list">
        <li className="compare-list__row">
          <span className="muted">{COMPARISON.actualLabel}</span>
          <span>{formatMonthlyYen(actualMonthly)}</span>
        </li>
        <li className="compare-list__row">
          <span className="muted">{COMPARISON.referenceLabel(householdSize)}</span>
          <span>{formatMonthlyYen(referenceMonthly)}</span>
        </li>
        <li className="compare-list__row">
          <span className="muted">{COMPARISON.diffLabel}</span>
          <span>
            {sign}
            {formatManYen(Math.abs(diffMonthly))}/月
          </span>
        </li>
      </ul>

      <p className="compare-comment">{label}</p>

      <details className="collapsible collapsible--muted">
        <summary>{COMPARISON.notesHeading}</summary>
        <div className="collapsible__body">
          <ul className="disclaimer-list muted">
            {COMPARISON.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
