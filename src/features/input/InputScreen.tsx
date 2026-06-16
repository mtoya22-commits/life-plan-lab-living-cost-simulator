import type { CategoryAmounts, CategoryKey, LivingCostResult } from '../../types/livingCost';
import { CATEGORY_KEYS } from '../../lib/classification';
import { formatManYen, formatMonthlyYen } from '../../lib/format';
import { CATEGORY_HELP, CATEGORY_LABELS, INPUT } from '../../strings/ja';
import QuestionCard from './QuestionCard';
import NumberField from './NumberField';

interface Props {
  categories: CategoryAmounts;
  result: LivingCostResult;
  onChange: (categories: CategoryAmounts) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function InputScreen({ categories, result, onChange, onBack, onSubmit }: Props) {
  const setCategory = (key: CategoryKey, value: number) =>
    onChange({ ...categories, [key]: value });

  // 参考値との差が一定以上あればやさしい注意を出す（止めない）。1万円以上を目安に。
  const showReferenceDiff =
    result.referenceDiff != null && Math.abs(result.referenceDiff) >= 10000;

  return (
    <div className="step-layout">
      <div className="step-content">
        <section className="step-head">
          <h1 className="section-heading">{INPUT.heading}</h1>
          <p className="muted">{INPUT.lead}</p>
        </section>

        <p className="reassure">{INPUT.reassure}</p>

        <p className="muted note-block">{INPUT.totalDefinitionNote}</p>

        {result.referenceMonthlyTotal != null && (
          <div className="card reference">
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
                {INPUT.referenceDiffNotice}
              </p>
            )}
          </div>
        )}

        <details className="collapsible collapsible--muted">
          <summary>住宅ローン・教育費の扱い</summary>
          <div className="collapsible__body">
            <p className="muted">{INPUT.mortgageNote}</p>
            <p className="muted">{INPUT.educationNote}</p>
          </div>
        </details>

        <h2 className="section-heading">{INPUT.breakdownHeading}</h2>
        {CATEGORY_KEYS.map((key) => (
          <QuestionCard key={key} title={CATEGORY_LABELS[key]} help={CATEGORY_HELP[key]}>
            <NumberField
              value={categories[key]}
              onChange={(v) => setCategory(key, v)}
              unit={INPUT.unit}
              ariaLabel={CATEGORY_LABELS[key]}
            />
          </QuestionCard>
        ))}

        {/* 内訳合計から自動計算した毎月/年間の生活費 */}
        <div className="card live-total">
          <div className="live-total__row">
            <span className="muted">{INPUT.liveMonthly}</span>
            <strong className="live-total__value">{formatMonthlyYen(result.monthlyTotal)}</strong>
          </div>
          <div className="live-total__row">
            <span className="muted">{INPUT.liveAnnual}</span>
            <span>{formatManYen(result.annualTotal)}</span>
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-row">
          <button type="button" className="btn btn--skip" onClick={onBack}>
            {INPUT.back}
          </button>
          <button type="button" className="btn btn--primary nav-grow" onClick={onSubmit}>
            {INPUT.toResult}
          </button>
        </div>
      </div>
    </div>
  );
}
