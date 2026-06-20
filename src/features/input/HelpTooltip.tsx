import { useEffect, useId, useRef, useState } from 'react';

// ？ヘルプ。タップ／キーボードで開き、外側タップ・フォーカス移動・Escape で閉じる（申し送り §3）。
// 用語解説ではなく「どこを見れば入力できるか」の案内に使う。補足テキストのみのため
// role="tooltip" のままとし、強制フォーカス移動はしない（読み上げ・キーボード操作を自然に）。
export default function HelpTooltip({ text, label }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // フォーカスがコンポーネント外へ移ったら閉じる。
    const onFocusIn = (e: FocusEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        // Escape で閉じたときはトリガーへフォーカスを戻す。
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="help" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        className="help__btn"
        aria-label={label ? `${label}の説明` : 'この項目の説明'}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        ？
      </button>
      {open && (
        <div className="help__pop" id={id} role="tooltip">
          {text}
        </div>
      )}
    </div>
  );
}
