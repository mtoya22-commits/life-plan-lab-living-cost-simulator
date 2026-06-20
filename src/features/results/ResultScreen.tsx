import { useState } from 'react';
import type {
  CategoryKey,
  LivingCostInput,
  LivingCostResult,
  SelectedMonthlySource,
} from '../../types/livingCost';
import { adjustedMonthly, buildStoragePayload, resolveSelectedMonthly } from '../../lib/calc';
import { getReviewPoints } from '../../lib/reviewRules';
import { buildCategoryScenario, hasCategoryScenario } from '../../lib/categoryScenario';
import { buildCompositionComparison } from '../../lib/compositionReference';
import { LIFE_PLAN_LAB_URL, buildComprehensiveUrl } from '../../lib/comprehensiveLink';
import { saveLivingCost } from '../../lib/storage';
import { formatManYen, formatMonthlyYen, formatYen } from '../../lib/format';
import { CATEGORY_LABELS, INPUT, RESULT } from '../../strings/ja';
import DetailCard from './DetailCard';
import BreakdownBars from './BreakdownBars';
import ReviewPoints from './ReviewPoints';
import CompositionReference from './CompositionReference';
import CategoryScenario from './CategoryScenario';
import FixedVariableDonut from './FixedVariableDonut';
import HouseholdComparison from './HouseholdComparison';
import QuickAdjust from './QuickAdjust';

interface Props {
  input: LivingCostInput;
  result: LivingCostResult;
  onRecalc: () => void;
}

export default function ResultScreen({ input, result, onRecalc }: Props) {
  // QuickAdjust（ざっくり）とカテゴリ別シナリオは独立した一時試算。入力条件は変えない。
  const [reduction, setReduction] = useState(0);
  const [scenarioOverrides, setScenarioOverrides] = useState<Partial<Record<CategoryKey, number>>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  // 最後に反映した（または既定の）対象。総合版リンクへ付与する値の決定に使う。
  const [reflectedSource, setReflectedSource] = useState<SelectedMonthlySource>('breakdownTotal');

  const hasQuickAdjust = reduction > 0;
  const quickAdjustedTotal = adjustedMonthly(result.monthlyTotal, reduction);
  const showReferenceDiff =
    result.referenceDiff != null && Math.abs(result.referenceDiff) >= 10000;
  const reviewPoints = getReviewPoints(result);
  const reviewKeys = reviewPoints
    .map((p) => p.categoryKey)
    .filter((k): k is CategoryKey => k != null);

  const composition = buildCompositionComparison(result);
  const compositionHighKeys = composition.highlightedItems.map((i) => i.categoryKey);
  const topKeys = result.topCategories.map((c) => c.key);
  // チップ並びの優先度: 見直しポイント → 構成比が大きめ → 金額が大きい → その他。
  const priorityKeys = [...new Set<CategoryKey>([...reviewKeys, ...compositionHighKeys, ...topKeys])];

  const scenario = buildCategoryScenario(result, scenarioOverrides);
  const hasScenario = hasCategoryScenario(scenario);

  const reflect = (source: SelectedMonthlySource) => {
    const payload = buildStoragePayload({
      result,
      categories: input.categories,
      selectedSource: source,
      quickAdjustedMonthlyTotal: hasQuickAdjust ? quickAdjustedTotal : undefined,
      categoryScenario: hasScenario ? scenario : undefined,
    });
    const ok = saveLivingCost(payload);
    if (!ok) {
      setSavedMessage(RESULT.reflectFailed);
      return;
    }
    setReflectedSource(source);
    setSavedMessage(
      source === 'quickAdjust'
        ? RESULT.reflectedQuick
        : source === 'categoryScenario'
          ? RESULT.reflectedScenario
          : RESULT.reflectedBreakdown,
    );
  };

  // 総合版リンクへ付与する補助パラメータ（主役は localStorage）。
  const linkMonthly = resolveSelectedMonthly(reflectedSource, {
    breakdownTotal: result.breakdownTotal,
    quickAdjustedMonthlyTotal: hasQuickAdjust ? quickAdjustedTotal : undefined,
    categoryScenarioMonthlyTotal: hasScenario ? scenario.scenarioMonthlyTotal : undefined,
  });
  const comprehensiveUrl = buildComprehensiveUrl(LIFE_PLAN_LAB_URL, linkMonthly, reflectedSource);

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

      {/* What-if を上に（申し送り §4）。改善シナリオを主役にする。 */}
      <QuickAdjust
        monthlyTotal={result.monthlyTotal}
        reduction={reduction}
        onReductionChange={setReduction}
      />

      {/* 生活費で確認したいポイント（QuickAdjust の直後・改善検討の主役） */}
      <ReviewPoints points={reviewPoints} />

      {/* 支出バランスの参考比較（構成比ベース） */}
      <CompositionReference data={composition} />

      {/* 気になる項目を動かしてみる（カテゴリ別見直しシナリオ） */}
      <CategoryScenario
        result={result}
        overrides={scenarioOverrides}
        priorityKeys={priorityKeys}
        onChange={setScenarioOverrides}
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
          <summary>{RESULT.fixedVariableNoteHeading}</summary>
          <div className="collapsible__body">
            <p className="muted">{RESULT.fixedVariableNote}</p>
          </div>
        </details>
      </section>

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

      {/* 支出内訳グラフ（横棒） */}
      <section className="card">
        <h2 className="section-heading">{RESULT.breakdownHeading}</h2>
        <BreakdownBars shares={result.shares} />
      </section>

      {/* 参考：世帯人数別の一般的な支出目安（任意入力時のみ・折りたたみ・控えめ） */}
      {result.householdComparison && (
        <HouseholdComparison data={result.householdComparison} />
      )}

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

      {/* 反映ボタン（現在 / ざっくり調整後 / カテゴリ別見直し後を明示） */}
      <section className="card reflect">
        <div className="reflect__item">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => reflect('breakdownTotal')}
          >
            {RESULT.reflectBreakdownBtn(formatManYen(result.breakdownTotal))}
          </button>
          <p className="muted reflect__note">{RESULT.reflectBreakdownNote}</p>
        </div>
        {hasQuickAdjust && (
          <div className="reflect__item">
            <button
              type="button"
              className="btn btn--recommended btn--block"
              onClick={() => reflect('quickAdjust')}
            >
              {RESULT.reflectQuickBtn(formatManYen(quickAdjustedTotal))}
            </button>
            <p className="muted reflect__note">{RESULT.reflectQuickNote}</p>
          </div>
        )}
        {hasScenario && (
          <div className="reflect__item">
            <button
              type="button"
              className="btn btn--recommended btn--block"
              onClick={() => reflect('categoryScenario')}
            >
              {RESULT.reflectScenarioBtn(formatManYen(scenario.scenarioMonthlyTotal))}
            </button>
            <p className="muted reflect__note">{RESULT.reflectScenarioNote}</p>
          </div>
        )}
        {savedMessage && (
          <p className="reflect__msg" role="status">
            {savedMessage}
          </p>
        )}
        <a className="btn btn--block reflect__link" href={comprehensiveUrl}>
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
