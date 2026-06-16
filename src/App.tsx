import { useMemo, useState } from 'react';
import type { CategoryAmounts, LivingCostInput } from './types/livingCost';
import { calcResult } from './lib/calc';
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

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [input, setInput] = useState<LivingCostInput>({
    monthlyTotal: 0,
    categories: emptyCategories(),
  });

  // 入力が変わるたびに結果を再計算（純粋関数）。
  const result = useMemo(() => calcResult(input), [input]);

  return (
    <div className="app">
      {phase === 'intro' && <IntroScreen onStart={() => setPhase('input')} />}

      {phase === 'input' && (
        <InputScreen
          input={input}
          result={result}
          onChange={setInput}
          onBack={() => setPhase('intro')}
          onSubmit={() => setPhase('result')}
        />
      )}

      {phase === 'result' && (
        <ResultScreen
          input={input}
          result={result}
          onRecalc={() => setPhase('input')}
        />
      )}
    </div>
  );
}
