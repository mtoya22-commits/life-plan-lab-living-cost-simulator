import { useState } from 'react';
import type {
  LivingCostInput,
  LivingCostResult,
  SelectedMonthlySource,
} from '../../types/livingCost';
import { adjustedMonthly, buildStoragePayload, improvementEffect } from '../../lib/calc';
import { saveLivingCost } from '../../lib/storage';
import { formatManYen, formatMonthlyYen, formatYen } from '../../lib/format';
import { CATEGORY_LABELS, COMPREHENSIVE_URL_PLACEHOLDER, INPUT, RESULT } from '../../strings/ja';
import DetailCard from './DetailCard';
import BreakdownBars from './BreakdownBars';
import FixedVariableDonut from './FixedVariableDonut';
import HouseholdComparison from './HouseholdComparison';
import QuickAdjust from './QuickAdjust';

interface Props {
  input: LivingCostInput;
  result: LivingCostResult;
  onRecalc: () => void;
}

const REDUCTION_STEPS = [10000, 30000, 50000];

export default function ResultScreen({ input, result, onRecalc }: Props) {
  // QuickAdjust の試算（試算用の一時変更。入力条件そのものは変えない）。
  const [reduction, setReduction] = useState(0);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const hasAdjusted = reduction > 0;
  const adjustedTotal = adjustedMonthly(result.monthlyTotal, reduction);
  const showReferenceDiff =
    result.referenceDiff != null && Math.abs(result.referenceDiff) >= 10000;

  const reflect = (source: SelectedMonthlySource) => {
    const payload = buildStoragePayload({
      result,
      categories: input.categories,
      selectedSource: source,
      adjustedMonthlyTotal: hasAdjusted ? adjustedTotal : undefined,
    });
    const ok = saveLivingCost(payload);
    if (!ok) {
      setSavedMessage(RESULT.reflectFailed);
      return;
    }
    setSavedMessage(
      source === 'adjustedMonthlyTotal' ? RESULT.reflectedAdjusted : RESULT.reflectedBreakdown,
    );
  };

  return (
    <div className="screen fade-rise">
      {/* Hero: 結論を隠さない（申し送り §4）。総額は万円を主表示、円を補足。 */}
      <header className="result-hero">
        <h1 className="section-heading">{RESULT.heading}</h1>
        <div className="result-hero__grid">
          <DetailCard
            label={RESULT.monthlyTotal}
            value={`${formatManYen(result.monthlyTotal)}/月`}
            caption={formatMonthlyYen(result.monthlyTotal)}
            emphasis
          />
          <DetailCard
            label={RESULT.annualTotal}
            value={formatManYen(result.annualTotal)}
            caption={formatYen(result.annualTotal)}
            emphasis
          />
        </div>
        <p className="muted field-note">{RESULT.monthlyNote}</p>
      </header>

      {result.referenceMonthlyTotal != null && (
        <section className="card reference">
          <div className="reference__row">
            <span className="muted">{INPUT.referenceLabel}</span>
            <span>{formatMonthlyYen(result.referenceMonthlyTotal)}</span>
          </div>
          <div className="reference__row">
            <span className="muted">{INPUT.breakdownLabel}</span>
            <span>{formatMonthlyYen(result.breakdownTotal)}</span>
          </div>
          {showReferenceDiff && (
            <p className="notice" role="status">
              {RESULT.referenceDiffNotice}
            </p>
          )}
        </section>
      )}

      {/* What-if を上に（申し送り §4） */}
      <QuickAdjust
        monthlyTotal={result.monthlyTotal}
        reduction={reduction}
        onReductionChange={setReduction}
      />

      {/* 固定費 / 変動費の割合（ドーナツ） */}
      <section className="card">
        <h2 className="section-heading">{RESULT.fixedVariableHeading}</h2>
        <FixedVariableDonut
          fixedTotal={result.fixedTotal}
          variableTotal={result.variableTotal}
          fixedRatio={result.fixedRatio}
          variableRatio={result.variableRatio}
        />
        <details className="collapsible collapsible--muted">
          <summary>固定費・変動費について</summary>
          <div className="collapsible__body">
            <p className="muted">{RESULT.fixedVariableNote}</p>
          </div>
        </details>
      </section>

      {/* 支出内訳グラフ（横棒） */}
      <section className="card">
        <h2 className="section-heading">{RESULT.breakdownHeading}</h2>
        <BreakdownBars shares={result.shares} />
      </section>

      {/* 世帯人数別の一般的な支出目安との参考比較（任意入力時のみ） */}
      {result.householdComparison && (
        <HouseholdComparison data={result.householdComparison} />
      )}

      {/* 金額が大きいカテゴリ（上位3件・中立表現） */}
      {result.topCategories.length > 0 && (
        <section className="card">
          <h2 className="section-heading">{RESULT.topHeading}</h2>
          <ol className="top-list">
            {result.topCategories.map((c) => (
              <li key={c.key} className="top-list__item">
                <span>{CATEGORY_LABELS[c.key]}</span>
                <span className="top-list__amount">{formatMonthlyYen(c.amount)}</span>
              </li>
            ))}
          </ol>
          <p className="muted field-note">{RESULT.topNote}</p>
        </section>
      )}

      {/* 改善効果テーブル（月1/3/5万円 → 年間効果） */}
      <section className="card">
        <h2 className="section-heading">{RESULT.effectHeading}</h2>
        <table className="effect-table">
          <thead>
            <tr>
              <th>{RESULT.effectMonthlyLabel}</th>
              <th>{RESULT.effectAnnualLabel}</th>
            </tr>
          </thead>
          <tbody>
            {REDUCTION_STEPS.map((step) => (
              <tr key={step}>
                <td>{formatManYen(step)}</td>
                <td>{formatManYen(improvementEffect(step).annual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 入力条件の確認 */}
      <details className="collapsible collapsible--muted">
        <summary>{RESULT.conditionHeading}</summary>
        <div className="collapsible__body">
          <ul className="condition-list">
            <li>
              <span>{RESULT.monthlyTotal}</span>
              <span>{formatMonthlyYen(result.monthlyTotal)}</span>
            </li>
            {result.shares
              .filter((s) => s.amount > 0)
              .map((s) => (
                <li key={s.key}>
                  <span>{CATEGORY_LABELS[s.key]}</span>
                  <span>{formatMonthlyYen(s.amount)}</span>
                </li>
              ))}
          </ul>
        </div>
      </details>

      {/* 反映ボタン（反映対象と金額を明示。フィードバック §4） */}
      <section className="card reflect">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => reflect('breakdownTotal')}
        >
          {RESULT.reflectBreakdownBtn(formatManYen(result.breakdownTotal))}
        </button>
        {hasAdjusted && (
          <button
            type="button"
            className="btn btn--recommended btn--block"
            onClick={() => reflect('adjustedMonthlyTotal')}
          >
            {RESULT.reflectAdjustedBtn(formatManYen(adjustedTotal))}
          </button>
        )}
        {savedMessage && (
          <p className="reflect__msg" role="status">
            {savedMessage}
          </p>
        )}
        <a className="btn btn--block reflect__link" href={COMPREHENSIVE_URL_PLACEHOLDER}>
          {RESULT.toComprehensive}
        </a>
      </section>

      <button type="button" className="btn btn--block" onClick={onRecalc}>
        {RESULT.recalc}
      </button>

      {/* 全体注記（スペック §12） */}
      <details className="collapsible collapsible--muted">
        <summary>{RESULT.disclaimerHeading}</summary>
        <div className="collapsible__body">
          <ul className="disclaimer-list muted">
            {RESULT.disclaimers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
