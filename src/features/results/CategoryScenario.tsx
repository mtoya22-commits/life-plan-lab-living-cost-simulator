import { useState } from 'react';
import type { CategoryKey, LivingCostResult } from '../../types/livingCost';
import { CATEGORY_KEYS } from '../../lib/classification';
import {
  CAREFUL_CATEGORIES,
  SCENARIO_STEPS,
  buildCategoryScenario,
} from '../../lib/categoryScenario';
import { formatManYen, formatMonthlyYen, formatYen } from '../../lib/format';
import { CATEGORY_LABELS, SCENARIO } from '../../strings/ja';
import NumberField from '../input/NumberField';

type Overrides = Partial<Record<CategoryKey, number>>;

interface Props {
  result: LivingCostResult;
  overrides: Overrides;
  /** 見直しポイントに出たカテゴリ（チップを先頭に並べる）。 */
  reviewKeys: CategoryKey[];
  onChange: (overrides: Overrides) => void;
}

export default function CategoryScenario({ result, overrides, reviewKeys, onChange }: Props) {
  const currentOf = (key: CategoryKey) => result.shares.find((s) => s.key === key)?.amount ?? 0;

  // 入力済み（>0）のカテゴリのみ対象。見直しポイントのカテゴリを先頭に並べる（案B）。
  const available = CATEGORY_KEYS.filter((k) => currentOf(k) > 0);
  const ordered = [
    ...reviewKeys.filter((k) => available.includes(k)),
    ...available.filter((k) => !reviewKeys.includes(k)),
  ];

  const [picked, setPicked] = useState<CategoryKey | null>(null);
  const selected = picked && ordered.includes(picked) ? picked : ordered[0] ?? null;

  if (!selected) return null;

  const scenarioValueOf = (key: CategoryKey) => overrides[key] ?? currentOf(key);
  const setOverride = (key: CategoryKey, value: number) =>
    onChange({ ...overrides, [key]: Math.max(0, Math.round(value)) });
  const clearOverride = (key: CategoryKey) => {
    const next = { ...overrides };
    delete next[key];
    onChange(next);
  };
  const isAdjusted = (key: CategoryKey) =>
    overrides[key] != null && overrides[key] !== currentOf(key);

  const current = currentOf(selected);
  const scenarioValue = scenarioValueOf(selected);
  const diff = scenarioValue - current;
  const careful = CAREFUL_CATEGORIES.includes(selected);
  const steps = SCENARIO_STEPS[selected];

  const scenario = buildCategoryScenario(result, overrides);
  const hasAdjustments = scenario.adjustments.some((a) => a.diffMonthly !== 0);

  const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${formatYen(Math.abs(n))}`;

  return (
    <section className="card scenario">
      <h2 className="section-heading">{SCENARIO.heading}</h2>
      <p className="muted field-note" style={{ marginTop: 0 }}>
        {SCENARIO.lead}
      </p>

      {/* カテゴリ選択チップ（現在額つき） */}
      <div className="choice-group scenario__chips">
        {ordered.map((key) => (
          <button
            key={key}
            type="button"
            className={`choice scenario__chip${selected === key ? ' choice--selected' : ''}`}
            aria-pressed={selected === key}
            onClick={() => setPicked(key)}
          >
            <span className="scenario__chip-label">{CATEGORY_LABELS[key]}</span>
            <span className="scenario__chip-amount">{formatYen(currentOf(key))}</span>
            {isAdjusted(key) && <span className="scenario__badge">{SCENARIO.trialBadge}</span>}
          </button>
        ))}
      </div>

      {/* 選択カテゴリの編集 */}
      <div className="scenario__editor">
        <div className="scenario__editor-head">
          <span className="scenario__editor-title">{CATEGORY_LABELS[selected]}</span>
          {isAdjusted(selected) && (
            <button type="button" className="btn btn--skip scenario__reset-cat" onClick={() => clearOverride(selected)}>
              {SCENARIO.resetCategory}
            </button>
          )}
        </div>

        <dl className="scenario__rows">
          <div>
            <dt>{SCENARIO.current}</dt>
            <dd>{formatMonthlyYen(current)}</dd>
          </div>
          <div>
            <dt>{SCENARIO.scenario}</dt>
            <dd>{formatMonthlyYen(scenarioValue)}</dd>
          </div>
          <div>
            <dt>{SCENARIO.diffMonthly}</dt>
            <dd>{signed(diff)}/月</dd>
          </div>
          <div>
            <dt>{SCENARIO.diffAnnual}</dt>
            <dd>{signed(diff * 12)}</dd>
          </div>
          <div>
            <dt>{SCENARIO.diffTenYears}</dt>
            <dd>{signed(diff * 120)}</dd>
          </div>
        </dl>

        {steps.length > 0 && (
          <div className="choice-group scenario__steps">
            {steps.map((step) => (
              <button
                key={step}
                type="button"
                className="choice"
                onClick={() => setOverride(selected, scenarioValue - step)}
              >
                −{step.toLocaleString('ja-JP')}円
              </button>
            ))}
          </div>
        )}

        <label className="scenario__manual">
          <span className="muted">{careful ? SCENARIO.carefulManualLabel : SCENARIO.manualLabel}</span>
          <NumberField
            value={scenarioValue}
            onChange={(v) => setOverride(selected, v)}
            unit={SCENARIO.unit}
            ariaLabel={`${CATEGORY_LABELS[selected]}の見直し後の金額`}
          />
        </label>

        {careful && <p className="muted field-note">{SCENARIO.carefulNote}</p>}
      </div>

      {/* 見直し後の生活費サマリー */}
      <div className="scenario__summary">
        <h3 className="scenario__summary-title">{SCENARIO.summaryHeading}</h3>
        <div className="scenario__summary-rows">
          <div>
            <span className="muted">{SCENARIO.current}</span>
            <span>{formatMonthlyYen(scenario.baseMonthlyTotal)}</span>
          </div>
          <div>
            <span className="muted">{SCENARIO.scenario}</span>
            <strong>{formatMonthlyYen(scenario.scenarioMonthlyTotal)}</strong>
          </div>
          <div>
            <span className="muted">{SCENARIO.diffMonthly}</span>
            <span>{signed(scenario.diffMonthly)}/月</span>
          </div>
          <div>
            <span className="muted">{SCENARIO.diffAnnual}</span>
            <span>{signed(scenario.diffAnnual)}</span>
          </div>
          <div>
            <span className="muted">{SCENARIO.diffTenYears}</span>
            <span>{signed(scenario.diffTenYears)}（{formatManYen(Math.abs(scenario.diffTenYears))}）</span>
          </div>
        </div>
        {hasAdjustments && (
          <button type="button" className="btn btn--skip scenario__reset-all" onClick={() => onChange({})}>
            {SCENARIO.resetAll}
          </button>
        )}
      </div>
    </section>
  );
}
