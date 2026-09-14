import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function SwipeCard({
  question,
  lang,
  selected,
  busy,
  onAnswer,
  heading,
  icon,
  t,
}) {
  const gesture = useRef(null);
  const locked = useRef(false);
  const [offset, setOffset] = useState(0);
  async function choose(value) {
    if (busy || locked.current) return;
    locked.current = true;
    setOffset(0);
    try {
      await onAnswer(value);
    } finally {
      locked.current = false;
    }
  }
  function release(event) {
    const start = gesture.current;
    gesture.current = null;
    setOffset(0);
    if (!start || event.type !== "pointerup") return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 75 && Math.abs(dx) > Math.abs(dy) * 1.3)
      choose(dx > 0 ? 1 : 0);
  }
  return (
    <div className="swipe-deck">
      <section
        className={`question-card swipe-card ${offset < -35 ? "lean-left" : offset > 35 ? "lean-right" : ""}`}
        style={{
          transform: `translateX(${offset * 0.45}px) rotate(${offset / 28}deg)`,
        }}
        tabIndex={0}
        aria-label={t(
          "Answer card. Use left or right arrow keys.",
          "Carte de réponse. Utilise les flèches gauche ou droite.",
        )}
        aria-describedby="swipe-help"
        aria-busy={busy}
        onKeyDown={(e) => {
          if (e.target.tagName === "BUTTON" || e.repeat) return;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            choose(e.key === "ArrowRight" ? 1 : 0);
          }
        }}
        onPointerDown={(e) => {
          if (
            busy ||
            e.target.closest("button") ||
            !e.isPrimary ||
            e.button !== 0
          )
            return;
          gesture.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (gesture.current)
            setOffset(
              Math.max(-180, Math.min(180, e.clientX - gesture.current.x)),
            );
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={() => {
          gesture.current = null;
          setOffset(0);
        }}
      >
        <span className="eyebrow">
          {t("WHICH FEELS MORE LIKE YOU?", "QU’EST-CE QUI TE RESSEMBLE ?")}
        </span>
        <span className="question-icon">{icon}</span>
        <h1 ref={heading} tabIndex={-1}>
          {question[lang][0]}
        </h1>
        <div className="choices">
          {question[lang].slice(1).map((label, i) => (
            <button
              key={i}
              className={`choice ${selected === i ? "chosen" : ""}`}
              aria-pressed={selected === i}
              disabled={busy}
              onClick={() => choose(i)}
            >
              {i ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
              <span>{label}</span>
              <small>
                {i
                  ? t("Slide right", "Glisse à droite")
                  : t("Slide left", "Glisse à gauche")}
              </small>
            </button>
          ))}
        </div>
        <p id="swipe-help" className="swipe-help">
          {busy
            ? t("Saving…", "Enregistrement…")
            : t(
                "Slide the card, use ← →, or tap a choice.",
                "Glisse la carte, utilise ← → ou touche un choix.",
              )}
        </p>
        <button
          className="text-button skip"
          disabled={busy}
          onClick={() => choose(null)}
        >
          {t("Skip this question", "Passer cette question")}
        </button>
      </section>
    </div>
  );
}
