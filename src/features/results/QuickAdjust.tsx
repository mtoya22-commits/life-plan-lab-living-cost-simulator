import { adjustedMonthly, improvementEffect } from '../../lib/calc';
import { formatMonthlyYen, formatYen } from '../../lib/format';
import { RESULT } from '../../strings/ja';

// 生活費を少し動かして見る（What-if）。試算用の一時変更で、入力条件は変えない。
// reduction が正＝改善、負＝支出増（補助シナリオ）。
interface Props {
  monthlyTotal: number;
  reduction: number;
  onReductionChange: (reduction: number) => void;
}

const STEPS = [
  { label: '−1万', delta: 10000 },
  { label: '−3万', delta: 30000 },
  { label: '−5万', delta: 50000 },
  { label: '＋1万', delta: -10000 },
];

export default function QuickAdjust({ monthlyTotal, reduction, onReductionChange }: Props) {
  const trial = adjustedMonthly(monthlyTotal, reduction);
  const effect = improvementEffect(reduction);
  const isIncrease = reduction < 0;
  // 表示は絶対値。改善か支出増かでラベルを切り替える。
  const abs = (n: number) => Math.abs(n);

  return (
    <div className="card adjust">
      <h2 className="section-heading">{RESULT.adjustHeading}</h2>
      <p className="muted">{RESULT.adjustLead}</p>

      <div className="adjust__totals">
        <div>
          <span className="muted">{RESULT.adjustCurrent}</span>
          <span className="adjust__current">{formatMonthlyYen(monthlyTotal)}</span>
        </div>
        <div>
          <span className="muted">{RESULT.adjustTrial}</span>
          <span className="adjust__trial">{formatMonthlyYen(trial)}</span>
        </div>
      </div>

      <div className="choice-group adjust__steps">
        {STEPS.map((step) => (
          <button
            key={step.label}
            type="button"
            className={`choice${reduction === step.delta ? ' choice--selected' : ''}`}
            onClick={() => onReductionChange(reduction === step.delta ? 0 : step.delta)}
          >
            {step.label}
          </button>
        ))}
        {reduction !== 0 && (
          <button type="button" className="btn btn--skip" onClick={() => onReductionChange(0)}>
            {RESULT.adjustReset}
          </button>
        )}
      </div>

      {isIncrease && <p className="muted field-note">{RESULT.adjustIncreaseNote}</p>}

      {reduction !== 0 && (
        <dl className="adjust__effects">
          <div>
            <dt>{isIncrease ? RESULT.adjustIncreaseMonthly : RESULT.adjustMonthly}</dt>
            <dd>{formatYen(abs(effect.monthly))}</dd>
          </div>
          <div>
            <dt>{isIncrease ? RESULT.adjustIncreaseAnnual : RESULT.adjustAnnual}</dt>
            <dd>{formatYen(abs(effect.annual))}</dd>
          </div>
          <div>
            <dt>{isIncrease ? RESULT.adjustIncreaseTenYear : RESULT.adjustTenYear}</dt>
            <dd>{formatYen(abs(effect.tenYear))}</dd>
          </div>
          <div>
            <dt>{RESULT.adjustSelected}</dt>
            <dd>{formatMonthlyYen(trial)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
