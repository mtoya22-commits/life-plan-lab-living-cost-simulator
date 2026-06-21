import { useEffect, useMemo, useRef, useState } from 'react';
import type { CategoryAmounts, HouseholdSize, LivingCostInput } from './types/livingCost';
import { calcResult, sanitizeAmount, sumBreakdown } from './lib/calc';
import { CATEGORY_KEYS } from './lib/classification';
import { clearDraft, loadDraft, saveDraft } from './lib/storage';
import { notifyScreenChange } from './lib/iframeResize';
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

  // 起動時に下書きを1回だけ読み、意味のある内容（内訳>0 か世帯人数あり）なら再開を促す。
  const initialDraft = useRef(loadDraft()).current;
  const [hasDraft, setHasDraft] = useState(
    () => initialDraft != null && (sumBreakdown(initialDraft.categories) > 0 || initialDraft.householdSize != null),
  );

  const input: LivingCostInput = useMemo(
    () => ({ categories, referenceMonthlyTotal, householdSize }),
    [categories, referenceMonthlyTotal, householdSize],
  );

  // 入力が変わるたびに結果を再計算（純粋関数）。
  const result = useMemo(() => calcResult(input), [input]);

  // 入力途中の自動保存（下書き）。intro では保存しない（再開選択前に空で上書きしないため）。
  // 確定データ（lifePlanLab:livingCost）はここでは触れない。
  useEffect(() => {
    if (phase === 'intro') return;
    const timer = setTimeout(() => {
      saveDraft({ version: 1, savedAt: new Date().toISOString(), categories, householdSize });
    }, 400);
    return () => clearTimeout(timer);
  }, [phase, categories, householdSize]);

  // 画面遷移ごとに親（埋め込み時のみ）へ先頭スクロール＋高さ再送を通知。初回マウントはスキップ。
  const firstPhase = useRef(true);
  useEffect(() => {
    if (firstPhase.current) {
      firstPhase.current = false;
      return;
    }
    notifyScreenChange();
  }, [phase]);

  const resumeFromDraft = () => {
    if (initialDraft) {
      setCategories({ ...emptyCategories(), ...initialDraft.categories });
      setHouseholdSize(initialDraft.householdSize);
    }
    setHasDraft(false);
    setPhase('input');
  };

  const startNew = () => {
    clearDraft();
    setCategories(emptyCategories());
    setHouseholdSize(undefined);
    setHasDraft(false);
    setPhase('input');
  };

  return (
    <div className="app">
      {phase === 'intro' && (
        <IntroScreen
          hasDraft={hasDraft}
          onStart={() => setPhase('input')}
          onResume={resumeFromDraft}
          onStartNew={startNew}
        />
      )}

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
