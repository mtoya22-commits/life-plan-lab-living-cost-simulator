import { useEffect, useId, useRef, useState } from 'react';

// ？ヘルプ。タップで開き、外側タップ / Escape で閉じる（申し送り §3）。
// 用語解説ではなく「どこを見れば入力できるか」の案内に使う。
export default function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="help" ref={ref}>
      <button
        type="button"
        className="help__btn"
        aria-label="この項目の説明"
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
