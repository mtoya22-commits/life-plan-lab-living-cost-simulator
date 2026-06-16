import { useEffect, useState } from 'react';

// 数値入力。表示は文字列で保持し、フォーカス外や変更確定時に親へ数値で反映する。
// 空欄は 0 として扱い、負値は受け付けない（calc 側でも 0 にクランプ）。
interface Props {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  ariaLabel?: string;
}

export default function NumberField({ value, onChange, unit = '円', ariaLabel }: Props) {
  const [text, setText] = useState(value > 0 ? String(value) : '');

  // 親側でリセットされた場合などに表示を同期する。
  useEffect(() => {
    setText(value > 0 ? String(value) : '');
  }, [value]);

  const commit = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    const num = cleaned === '' ? 0 : Number(cleaned);
    onChange(Number.isFinite(num) && num >= 0 ? num : 0);
  };

  return (
    <div className="numfield">
      <input
        className="numfield__input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0"
        aria-label={ariaLabel}
        value={text}
        onChange={(e) => {
          const next = e.target.value.replace(/[^0-9]/g, '');
          setText(next);
          commit(next);
        }}
        onBlur={(e) => commit(e.target.value)}
      />
      <span className="numfield__unit">{unit}</span>
    </div>
  );
}
