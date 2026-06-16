import type { HouseholdComparison as HouseholdComparisonData } from '../../types/livingCost';
import { formatManYen, formatMonthlyYen } from '../../lib/format';
import { COMPARISON } from '../../strings/ja';

// 世帯人数別の一般的な支出目安との「参考比較」。
// 主役ではなく控えめな参考情報として、既定で折りたたんで表示する。
// 評価・診断ではなく、煽らず・止めず・やわらかいコメントにとどめる。
export default function HouseholdComparison({ data }: { data: HouseholdComparisonData }) {
  const { householdSize, referenceMonthly, actualMonthly, diffMonthly, label } = data;
  const sign = diffMonthly > 0 ? '+' : diffMonthly < 0 ? '−' : '±';

  return (
    <details className="collapsible collapsible--muted">
      <summary>{COMPARISON.heading}</summary>
      <div className="collapsible__body">
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
        <p className="muted field-note">{COMPARISON.softNote}</p>

        <ul className="disclaimer-list muted">
          {COMPARISON.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          {householdSize === 5 && <li>{COMPARISON.fivePlusNote}</li>}
        </ul>
      </div>
    </details>
  );
}
