import React, { useState } from "react";
import { ScenarioArt } from "./ScenarioArt.jsx";
import { interestDimensions, referenceImages } from "../shared/questions.js";

export function SwipeCard({
  question,
  lang,
  selected,
  busy,
  onAnswer,
  heading,
  t,
}) {
  const [value, setValue] = useState(
    selected ??
      (question.type === "ratings"
        ? Object.fromEntries(interestDimensions.map(({ id }) => [id, null]))
        : question.type === "multiple"
          ? []
          : question.type === "text"
            ? ""
            : null),
  );
  const content = question[lang];
  const toggle = (i) =>
    setValue((current) =>
      current.includes(i) ? current.filter((x) => x !== i) : [...current, i],
    );
  return (
    <div className="swipe-deck">
      <section className="question-card scenario-card" aria-busy={busy}>
        <span className="eyebrow">
          {t("A STORY IN FIVE CARDS", "UNE HISTOIRE EN CINQ CARTES")}
        </span>
        <ScenarioArt scene={question.id} />
        {content.context && (
          <p className="scenario-context">{content.context}</p>
        )}
        <h1 ref={heading} tabIndex={-1} className="scenario-prompt">
          {content.prompt}
        </h1>
        {content.hint && <p className="scenario-hint">{content.hint}</p>}
        {question.id === "references" ? (
          <div
            className="reference-grid"
            role="group"
            aria-label={content.prompt}
          >
            {content.options.map((label, i) =>
              referenceImages[i] ? (
                <button
                  key={label}
                  type="button"
                  className={`reference-card ${value.includes(i) ? "chosen" : ""}`}
                  aria-pressed={value.includes(i)}
                  disabled={busy}
                  onClick={() => toggle(i)}
                >
                  <img
                    src={referenceImages[i].src}
                    alt={referenceImages[i].alt[lang]}
                  />
                  <span>
                    <b>{label}</b>
                    <span aria-hidden="true">
                      {value.includes(i) ? "✓" : "+"}
                    </span>
                  </span>
                </button>
              ) : (
                <div className="reference-card unavailable" key={label}>
                  <div className="reference-empty" aria-hidden="true">
                    ✦
                  </div>
                  <span>
                    <b>{label}</b>
                    <small>{t("Coming soon", "À venir")}</small>
                  </span>
                </div>
              ),
            )}
          </div>
        ) : question.type === "ratings" ? (
          <div className="interest-ratings">
            <p className="ratings-ends">
              {t("1 · Not interested", "1 · Pas intéressé·e")}{" "}
              <span>{t("10 · Love it", "10 · J’adore")}</span>
            </p>
            {interestDimensions.map(({ id, en, fr }) => {
              const rating = value[id];
              return (
                <div
                  className={`rating-row ${rating === null ? "unanswered" : ""}`}
                  key={id}
                >
                  <div className="rating-header">
                    <label htmlFor={`interest-${id}`}>
                      {lang === "fr" ? fr : en}
                    </label>
                    <span className="rating-value">
                      {rating === null
                        ? t("Not answered", "Non renseigné")
                        : `${rating}/10`}
                    </span>
                  </div>
                  <input
                    id={`interest-${id}`}
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={rating ?? 5}
                    aria-valuetext={
                      rating === null
                        ? t("Not answered", "Non renseigné")
                        : `${rating} / 10`
                    }
                    disabled={busy}
                    onPointerDown={() => {
                      if (rating === null)
                        setValue((current) => ({ ...current, [id]: 5 }));
                    }}
                    onChange={(e) =>
                      setValue((current) => ({
                        ...current,
                        [id]: Number(e.target.value),
                      }))
                    }
                  />
                  <div className="rating-ticks" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  {rating !== null && (
                    <button
                      type="button"
                      className="rating-clear"
                      disabled={busy}
                      onClick={() =>
                        setValue((current) => ({ ...current, [id]: null }))
                      }
                      aria-label={t(`Clear ${en}`, `Effacer ${fr}`)}
                    >
                      {t("Clear", "Effacer")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : question.type === "text" ? (
          <label className="scenario-text">
            <span>{t("Your answer", "Ta réponse")}</span>
            <textarea
              maxLength={1000}
              rows={5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("Write a few words…", "Écris quelques mots…")}
            />
            <small>{value.length}/1000</small>
          </label>
        ) : (
          <div
            className="scenario-options"
            role="group"
            aria-label={content.prompt}
          >
            {content.options.map((label, i) => (
              <button
                type="button"
                key={i}
                className={`scenario-option ${(question.type === "multiple" ? value.includes(i) : value === i) ? "chosen" : ""}`}
                aria-pressed={
                  question.type === "multiple" ? value.includes(i) : value === i
                }
                disabled={busy}
                onClick={() =>
                  question.type === "multiple" ? toggle(i) : setValue(i)
                }
              >
                <span aria-hidden="true" className="scenario-indicator">
                  {(
                    question.type === "multiple"
                      ? value.includes(i)
                      : value === i
                  )
                    ? "✓"
                    : ""}
                </span>
                {label}
              </button>
            ))}
          </div>
        )}
        <button
          className="primary full scenario-next"
          disabled={busy || (question.type === "single" && value === null)}
          onClick={() => onAnswer(value)}
        >
          {busy ? t("Saving…", "Enregistrement…") : t("Continue", "Continuer")}
        </button>
        <button
          className="text-button skip"
          disabled={busy}
          onClick={() => onAnswer(null)}
        >
          {t("Skip this question", "Passer cette question")}
        </button>
      </section>
    </div>
  );
}
