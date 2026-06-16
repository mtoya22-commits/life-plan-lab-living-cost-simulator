import type { CategoryKey, LivingCostInput, LivingCostResult } from '../../types/livingCost';
import { CATEGORY_KEYS } from '../../lib/classification';
import { formatYen } from '../../lib/format';
import { CATEGORY_HELP, CATEGORY_LABELS, INPUT } from '../../strings/ja';
import QuestionCard from './QuestionCard';
import NumberField from './NumberField';

interface Props {
  input: LivingCostInput;
  result: LivingCostResult;
  onChange: (input: LivingCostInput) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function InputScreen({ input, result, onChange, onBack, onSubmit }: Props) {
  const setMonthlyTotal = (value: number) => onChange({ ...input, monthlyTotal: value });
  const setCategory = (key: CategoryKey, value: number) =>
    onChange({ ...input, categories: { ...input.categories, [key]: value } });

  return (
    <div className="step-layout">
      <div className="step-content">
        <section className="step-head">
          <h1 className="section-heading">{INPUT.heading}</h1>
          <p className="muted">{INPUT.lead}</p>
        </section>

        <p className="reassure">{INPUT.reassure}</p>

        <QuestionCard title={INPUT.totalLabel} help={INPUT.totalHelp}>
          <NumberField
            value={input.monthlyTotal}
            onChange={setMonthlyTotal}
            unit={INPUT.unit}
            ariaLabel={INPUT.totalLabel}
          />
          <p className="muted field-note">{INPUT.totalDefinitionNote}</p>
        </QuestionCard>

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
              value={input.categories[key]}
              onChange={(v) => setCategory(key, v)}
              unit={INPUT.unit}
              ariaLabel={CATEGORY_LABELS[key]}
            />
          </QuestionCard>
        ))}

        {result.isOverBudget && (
          <p className="notice" role="status">
            {INPUT.overBudgetNotice}
          </p>
        )}

        <p className="muted field-note">
          内訳の合計：{formatYen(result.breakdownTotal)}
        </p>
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
