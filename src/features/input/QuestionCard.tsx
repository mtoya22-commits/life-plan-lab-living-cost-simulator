import type { ReactNode } from 'react';
import HelpTooltip from './HelpTooltip';

// 質問カード（題目 + ？help + 子要素）。申し送りの QuestionCard を踏襲。
interface Props {
  title: string;
  help?: string;
  children: ReactNode;
}

export default function QuestionCard({ title, help, children }: Props) {
  return (
    <div className="qcard">
      <div className="qcard__head">
        <span className="qcard__title">{title}</span>
        {help && <HelpTooltip text={help} label={title} />}
      </div>
      <div className="qcard__body">{children}</div>
    </div>
  );
}
