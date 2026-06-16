import { useMemo, useState } from 'react';
import type { CategoryAmounts, HouseholdSize, LivingCostInput } from './types/livingCost';
import { calcResult, sanitizeAmount } from './lib/calc';
import { CATEGORY_KEYS } from './lib/classification';
import IntroScreen from './features/intro/IntroScreen';
import InputScreen from './features/input/InputScreen';
import ResultScreen from './features/results/ResultScreen';

type Phase = 'intro' | 'input' | 'result';

function emptyCategories(): CategoryAmounts {
  return CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as CategoryAmounts);
}

// 総合版からのリンクで現在の生活費が渡される将来フック（円/月）。例: ?ref=250000
function readReferenceMonthly(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = new URLSearchParams(window.location.search).get('ref');
  if (!raw) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? sanitizeAmount(num) : undefined;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [referenceMonthlyTotal] = useState<number | undefined>(readReferenceMonthly);
  const [categories, setCategories] = useState<CategoryAmounts>(emptyCategories);
  const [householdSize, setHouseholdSize] = useState<HouseholdSize | undefined>(undefined);

  const input: LivingCostInput = useMemo(
    () => ({ categories, referenceMonthlyTotal, householdSize }),
    [categories, referenceMonthlyTotal, householdSize],
  );

  // 入力が変わるたびに結果を再計算（純粋関数）。
  const result = useMemo(() => calcResult(input), [input]);

  return (
    <div className="app">
      {phase === 'intro' && <IntroScreen onStart={() => setPhase('input')} />}

      {phase === 'input' && (
        <InputScreen
          categories={categories}
          householdSize={householdSize}
          result={result}
          onChange={setCategories}
          onHouseholdChange={setHouseholdSize}
          onBack={() => setPhase('intro')}
          onSubmit={() => setPhase('result')}
        />
      )}

      {phase === 'result' && (
        <ResultScreen input={input} result={result} onRecalc={() => setPhase('input')} />
      )}
    </div>
  );
}
