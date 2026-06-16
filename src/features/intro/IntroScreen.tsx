import { INTRO } from '../../strings/ja';

export default function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen fade-rise">
      <header className="intro-hero">
        <p className="intro-hero__eyebrow">LIFE PLAN LAB</p>
        <h1 className="intro-hero__title">{INTRO.heading}</h1>
        <p className="muted">{INTRO.lead}</p>
      </header>

      <p className="reassure">{INTRO.reassure}</p>

      <section className="card">
        <h2 className="section-heading">{INTRO.canDoHeading}</h2>
        <ul className="intro-list">
          {INTRO.canDo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="muted note-block">{INTRO.notBudgetApp}</p>

      <button type="button" className="btn btn--primary btn--block" onClick={onStart}>
        {INTRO.start}
      </button>
    </div>
  );
}
