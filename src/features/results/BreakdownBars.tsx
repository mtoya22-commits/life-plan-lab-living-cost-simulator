import type { CategoryShare } from '../../types/livingCost';
import { formatPercent, formatYen } from '../../lib/format';
import { CATEGORY_LABELS } from '../../strings/ja';

// スマホで見やすい横棒グラフ（自作・依存なし。申し送り §10「円より横棒」）。
// バー幅は最大カテゴリを基準に正規化し、相対的な大きさを直感的に示す。
export default function BreakdownBars({ shares }: { shares: CategoryShare[] }) {
  const visible = shares.filter((s) => s.amount > 0).sort((a, b) => b.amount - a.amount);
  if (visible.length === 0) {
    return <p className="muted">内訳が未入力です。入力すると、ここに支出の割合が表示されます。</p>;
  }
  const max = visible[0].amount;

  return (
    <ul className="bars">
      {visible.map((s) => (
        <li key={s.key} className="bars__row">
          <div className="bars__head">
            <span className="bars__label">
              {CATEGORY_LABELS[s.key]}
              <span className={`bars__tag bars__tag--${s.costType}`}>
                {s.costType === 'fixed' ? '固定費' : '変動費'}
              </span>
            </span>
            <span className="bars__amount">
              {formatYen(s.amount)}
              <span className="muted bars__pct">（{formatPercent(s.ratio)}）</span>
            </span>
          </div>
          <div className="bars__track">
            <div
              className={`bars__fill bars__fill--${s.costType}`}
              style={{ width: `${max > 0 ? (s.amount / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
