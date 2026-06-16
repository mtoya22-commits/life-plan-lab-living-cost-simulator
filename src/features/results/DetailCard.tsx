import type { ReactNode } from 'react';

// 値 + caption の小カード（申し送りの DetailCard を簡略化）。
interface Props {
  label: string;
  value: string;
  caption?: ReactNode;
  emphasis?: boolean;
}

export default function DetailCard({ label, value, caption, emphasis }: Props) {
  return (
    <div className={`detail-card${emphasis ? ' detail-card--emphasis' : ''}`}>
      <span className="detail-card__label">{label}</span>
      <span className="detail-card__value">{value}</span>
      {caption && <span className="detail-card__caption">{caption}</span>}
    </div>
  );
}
