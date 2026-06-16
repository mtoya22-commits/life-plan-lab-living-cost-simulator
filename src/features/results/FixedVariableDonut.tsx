import { formatPercent, formatYen } from '../../lib/format';
import { RESULT } from '../../strings/ja';

// 固定費 / 変動費の割合をドーナツで表示（自作 SVG・依存追加なし、赤不使用）。
// 金額と割合を凡例に併記する。カテゴリ別内訳は横棒グラフ（BreakdownBars）が担う。
interface Props {
  fixedTotal: number;
  variableTotal: number;
  fixedRatio: number;
  variableRatio: number;
}

const SIZE = 132;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export default function FixedVariableDonut({
  fixedTotal,
  variableTotal,
  fixedRatio,
  variableRatio,
}: Props) {
  const total = fixedTotal + variableTotal;
  const fixedLen = C * fixedRatio;
  const variableLen = C * variableRatio;

  return (
    <div className="donut">
      <svg
        className="donut__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label={`固定費 ${formatPercent(fixedRatio)}、変動費 ${formatPercent(variableRatio)}`}
      >
        {/* 起点を上（12時）にするため -90deg 回転 */}
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {total <= 0 ? (
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
          ) : (
            <>
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke="var(--band-realistic)"
                strokeWidth={STROKE}
                strokeDasharray={`${fixedLen} ${C - fixedLen}`}
                strokeDashoffset={0}
              />
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke="var(--band-stable)"
                strokeWidth={STROKE}
                strokeDasharray={`${variableLen} ${C - variableLen}`}
                strokeDashoffset={-fixedLen}
              />
            </>
          )}
        </g>
      </svg>

      <ul className="donut__legend">
        <li>
          <span className="donut__swatch donut__swatch--fixed" />
          <span className="donut__legend-label">{RESULT.fixedTotal}</span>
          <span className="donut__legend-value">
            {formatYen(fixedTotal)}
            <span className="muted">（{formatPercent(fixedRatio)}）</span>
          </span>
        </li>
        <li>
          <span className="donut__swatch donut__swatch--variable" />
          <span className="donut__legend-label">{RESULT.variableTotal}</span>
          <span className="donut__legend-value">
            {formatYen(variableTotal)}
            <span className="muted">（{formatPercent(variableRatio)}）</span>
          </span>
        </li>
      </ul>
    </div>
  );
}
