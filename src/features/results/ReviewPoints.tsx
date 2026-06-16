import type { ReviewPoint } from '../../types/livingCost';
import { REVIEW } from '../../strings/ja';

// 「生活費で確認したいポイント」カード。削減推奨ではなく確認の方向性を示す。
// 赤・警告色は使わず、優先度が高くても危険表示にしない。
export default function ReviewPoints({ points }: { points: ReviewPoint[] }) {
  if (points.length === 0) return null;

  return (
    <section className="card">
      <h2 className="section-heading">{REVIEW.heading}</h2>
      <p className="muted field-note" style={{ marginTop: 0 }}>
        {REVIEW.lead}
      </p>
      <ul className="review-list">
        {points.map((p) => (
          <li key={p.id} className="review-item">
            <div className="review-item__head">
              <span className="review-item__title">{p.title}</span>
              <span className="review-item__chip">{p.targetLabel}</span>
            </div>
            <p className="review-item__message">{p.message}</p>
            <p className="muted review-item__note">{p.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
