import { INTRO } from '../../strings/ja';

interface Props {
  /** 入力途中の下書きがあるか。 */
  hasDraft: boolean;
  onStart: () => void;
  onResume: () => void;
  onStartNew: () => void;
}

export default function IntroScreen({ hasDraft, onStart, onResume, onStartNew }: Props) {
  return (
    <div className="screen fade-rise">
      <header className="intro-hero">
        <p className="intro-hero__eyebrow">LIFE PLAN LAB</p>
        <h1 className="intro-hero__title">{INTRO.heading}</h1>
        <p className="muted">{INTRO.lead}</p>
      </header>

      <p className="reassure">{INTRO.reassure}</p>

      {hasDraft && (
        <section className="card resume">
          <h2 className="section-heading">{INTRO.resumeHeading}</h2>
          <p className="muted">{INTRO.resumeLead}</p>
          <button type="button" className="btn btn--primary btn--block" onClick={onResume}>
            {INTRO.resume}
          </button>
          <button type="button" className="btn btn--block" onClick={onStartNew}>
            {INTRO.startNew}
          </button>
        </section>
      )}

      <section className="card">
        <h2 className="section-heading">{INTRO.canDoHeading}</h2>
        <ul className="intro-list">
          {INTRO.canDo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="muted note-block">{INTRO.notBudgetApp}</p>

      {!hasDraft && (
        <button type="button" className="btn btn--primary btn--block" onClick={onStart}>
          {INTRO.start}
        </button>
      )}
    </div>
  );
}
