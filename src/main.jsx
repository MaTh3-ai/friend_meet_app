import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCheck,
  Sparkles,
  Users,
  ShieldCheck,
  SlidersHorizontal,
  X,
  EyeOff,
  Trash2,
  Download,
  LogOut,
  Coffee,
  Moon,
  Sun,
  Compass,
  BookOpen,
  MessageCircle,
  Leaf,
  Heart,
  LockKeyhole,
  RotateCcw,
  ChevronRight,
  Settings,
  Info,
} from "lucide-react";
import { api } from "./api.js";
import {
  questions,
  avatars,
  currentAnswers,
  QUESTIONNAIRE_VERSION,
} from "../shared/questions.js";
import "./styles.css";
import { Avatar } from "./Avatar.jsx";
import { SwipeCard } from "./SwipeCard.jsx";

const emptyProfile = {
  name: "",
  avatar: 0,
  course: "",
  bio: "",
  age: null,
  gender: "unspecified",
  preference: "anyone",
};
const icons = {
  moon: Moon,
  sun: Sun,
  compass: Compass,
  users: Users,
  coffee: Coffee,
  sparkles: Sparkles,
  book: BookOpen,
  message: MessageCircle,
  leaf: Leaf,
  heart: Heart,
};
function App() {
  const [lang, setLang] = useState(() =>
    localStorage.getItem("cg-language") === "fr" ? "fr" : "en",
  );
  const t = (en, fr) => (lang === "fr" ? fr : en);
  const [config, setConfig] = useState(null),
    [me, setMe] = useState(null),
    [screen, setScreen] = useState("loading");
  const [profile, setProfile] = useState(emptyProfile),
    [answers, setAnswers] = useState({}),
    [texts, setTexts] = useState({ likes: "", dislikes: "" });
  const [qIndex, setQIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [code, setCode] = useState(""),
    [matches, setMatches] = useState([]),
    [example, setExample] = useState(false),
    [threshold, setThreshold] = useState(30);
  const [matchLoading, setMatchLoading] = useState(false),
    [contacts, setContacts] = useState({ instagram: "", discord: "" }),
    [blocks, setBlocks] = useState([]);
  const [modal, setModal] = useState(null),
    [activePerson, setActivePerson] = useState(null),
    [deleteText, setDeleteText] = useState("");
  const heading = useRef(null),
    dialog = useRef(null);
  const matchRequest = useRef(0);
  const errors = {
    code: t(
      "That access code doesn’t look right.",
      "Ce code d’accès ne semble pas correct.",
    ),
    session: t(
      "Your session ended. Please join again.",
      "Ta session a expiré. Reconnecte-toi.",
    ),
    validation: t(
      "Please check the fields and try again.",
      "Vérifie les champs puis réessaie.",
    ),
    origin: t(
      "Open the app using its configured address.",
      "Ouvre l’application depuis son adresse configurée.",
    ),
    rate: t(
      "A few too many requests. Try again in a minute.",
      "Un peu trop de demandes. Réessaie dans une minute.",
    ),
    unavailable: t(
      "This profile is no longer available.",
      "Ce profil n’est plus disponible.",
    ),
  };
  const showError = (e) =>
    setError(
      errors[e.message] ||
        t(
          "We couldn’t save that. Check your connection and try again.",
          "Enregistrement impossible. Vérifie ta connexion et réessaie.",
        ),
    );
  async function run(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }
  function hydrate(person) {
    setMe(person);
    setProfile({ ...emptyProfile, ...person.profile });
    setAnswers(currentAnswers(person.answers));
    setTexts({ likes: "", dislikes: "", ...person.texts });
    setContacts({ instagram: "", discord: "", ...person.contacts });
  }
  async function boot() {
    setError("");
    try {
      setConfig(await api("/config"));
      try {
        const person = await api("/me");
        hydrate(person);
        setScreen(person.completed ? "results" : "profile");
      } catch (e) {
        if (e.status !== 401) throw e;
        setScreen("profile");
      }
      if (new URLSearchParams(location.search).has("auth")) {
        setError(
          t(
            "UPPA sign-in could not be completed. Please try again or contact the project team.",
            "La connexion UPPA n’a pas abouti. Réessaie ou contacte l’équipe du projet.",
          ),
        );
        history.replaceState(null, "", "/");
      }
    } catch (e) {
      showError(e);
      setScreen("offline");
    }
  }
  useEffect(() => {
    boot();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("cg-language", lang);
  }, [lang]);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [screen, qIndex]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  async function refreshMatches(silent = false) {
    const requestId = ++matchRequest.current;
    if (!silent) setMatchLoading(true);
    try {
      const data = await api(`/matches?example=${example ? 1 : 0}`);
      if (requestId === matchRequest.current) {
        setMatches(data.matches);
        setActivePerson((person) =>
          person ? data.matches.find((p) => p.id === person.id) || null : null,
        );
      }
    } catch (e) {
      if (requestId === matchRequest.current) showError(e);
    } finally {
      if (requestId === matchRequest.current) setMatchLoading(false);
    }
  }
  useEffect(() => {
    if (screen !== "results") return;
    setMatches([]);
    refreshMatches();
    const timer = setInterval(() => {
      if (!document.hidden) refreshMatches(true);
    }, 12000);
    return () => {
      clearInterval(timer);
      matchRequest.current++;
    };
  }, [screen, example, me?.visible]);
  useEffect(() => {
    if (screen === "settings") api("/blocks").then(setBlocks).catch(showError);
  }, [screen]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "set_match_threshold",
            description:
              "Change the minimum displayed demo score on the results screen.",
            inputSchema: {
              type: "object",
              properties: {
                minimum: { type: "integer", minimum: 30, maximum: 100 },
              },
              required: ["minimum"],
              additionalProperties: false,
            },
            execute: async (input) => {
              if (
                screen !== "results" ||
                !Number.isInteger(input.minimum) ||
                input.minimum < 30 ||
                input.minimum > 100
              )
                throw new Error(
                  "Open results and supply a minimum from 30 to 100.",
                );
              setThreshold(input.minimum);
              await new Promise((resolve) => requestAnimationFrame(resolve));
              return { minimum: input.minimum };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [screen]);
  const courseLabel = (value) =>
    ({
      bachelor: t("Bachelor’s", "Licence"),
      master: "Master",
      doctorate: t("PhD", "Doctorat"),
    })[value] ||
    value ||
    "UPPA";
  const setField = (key, value) => setProfile((p) => ({ ...p, [key]: value }));
  const step = screen === "quiz" ? 2 : screen === "texts" ? 3 : 1;
  const onStart = (event) => {
    event.preventDefault();
    run(async () => {
      if (!me) await api("/auth/demo", "POST", { code });
      await api("/me/profile", "PUT", profile);
      const person = await api("/me");
      hydrate(person);
      if (me?.completed) {
        setScreen("results");
        setNotice(t("Profile updated.", "Profil mis à jour."));
      } else if (screen === "profile") {
        setScreen("details");
      } else {
        const next = questions.findIndex(
          (q) => !(q.id in currentAnswers(person.answers)),
        );
        setQIndex(next === -1 ? 0 : next);
        setScreen(next === -1 ? "texts" : "quiz");
      }
    });
  };
  function answer(value) {
    return run(async () => {
      const updated = { ...answers, [questions[qIndex].id]: value };
      await api("/me/draft", "PUT", { answers: updated, texts });
      setAnswers(updated);
      if (qIndex === questions.length - 1) setScreen("texts");
      else setQIndex(qIndex + 1);
    });
  }
  const finish = (event) => {
    event.preventDefault();
    run(async () => {
      await api("/me/contacts", "PUT", contacts);
      await api("/me/complete", "POST", {
        version: QUESTIONNAIRE_VERSION,
        answers,
        texts,
        consent: true,
      });
      const person = await api("/me");
      hydrate(person);
      setScreen("results");
    });
  };
  function openPerson(person) {
    setActivePerson(person);
    setModal("person");
  }
  async function connect(person) {
    await api(`/connections/${person.id}`, "POST");
    setModal(null);
    await refreshMatches();
    setNotice(t("Connection updated.", "Demande mise à jour."));
  }
  const progress = (
    <div className="stepper" aria-label={t("Your progress", "Ta progression")}>
      {[
        t("Profile", "Profil"),
        t("Questions", "Questions"),
        t("Finish", "Pour finir"),
      ].map((label, i) => (
        <div
          key={i}
          className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""}
        >
          <span>{step > i + 1 ? <Check size={14} /> : `0${i + 1}`}</span>
          <b>{label}</b>
        </div>
      ))}
    </div>
  );
  const profileFields = (
    <>
      {screen !== "details" && (
        <>
          <label>
            {t("What should we call you?", "Comment t’appelles-tu ?")}
            <input
              name="name"
              required
              autoComplete="nickname"
              maxLength={30}
              value={profile.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder={t(
                "Your first name or nickname",
                "Ton prénom ou pseudo",
              )}
            />
          </label>
          <fieldset className="avatar-field">
            <legend>{t("Choose your avatar", "Choisis ton avatar")}</legend>
            <div className="avatar-options">
              {avatars.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  className={`avatar a${i} ${profile.avatar === i ? "selected" : ""}`}
                  aria-label={`${t("Avatar", "Avatar")} ${i + 1}: ${a}`}
                  aria-pressed={profile.avatar === i}
                  onClick={() => setField("avatar", i)}
                >
                  <Avatar index={i} />
                  {profile.avatar === i && (
                    <span className="avatar-check">
                      <Check size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}
      {(screen === "details" || me?.completed) && (
        <>
          <details className="optional">
            <summary>
              {t("A little more about you", "Un peu plus sur toi")}{" "}
              <span>{t("optional", "facultatif")}</span>
            </summary>
            <div className="detail-content">
              <label>
                {t("Study level", "Niveau d’études")}
                <select
                  value={profile.course}
                  onChange={(e) => setField("course", e.target.value)}
                >
                  <option value="">{t("Not specified", "Non précisé")}</option>
                  <option value="bachelor">{t("Bachelor’s", "Licence")}</option>
                  <option value="master">Master</option>
                  <option value="doctorate">{t("PhD", "Doctorat")}</option>
                </select>
              </label>
              <label>
                {t(
                  "Bio · optional and public",
                  "Bio · facultative et publique",
                )}
                <textarea
                  rows={2}
                  value={profile.bio}
                  maxLength={140}
                  onChange={(e) => setField("bio", e.target.value)}
                  placeholder={t(
                    "Always up for a coffee after class.",
                    "Toujours partant·e pour un café après les cours.",
                  )}
                />
              </label>
              <div className="two-fields">
                <label>
                  {t("Age · public", "Âge · public")}
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={profile.age ?? ""}
                    onChange={(e) =>
                      setField(
                        "age",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </label>
              </div>
            </div>
          </details>
          <details className="optional">
            <summary>
              {t("Who you’d like to meet", "Qui tu aimerais rencontrer")}{" "}
              <span>
                {t("everyone, by default", "tout le monde, par défaut")}
              </span>
            </summary>
            <div className="detail-content">
              <p className="muted">
                {t(
                  "Here for friendship, or open to something more? These optional preferences are private. They filter profiles in both directions.",
                  "Pour une amitié, ou ouvert·e à autre chose ? Ces préférences facultatives sont privées. Le filtrage fonctionne dans les deux sens.",
                )}
              </p>
              <label>
                {t("I identify as", "Je me définis comme")}
                <select
                  value={profile.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                >
                  <option value="unspecified">
                    {t("Prefer not to say", "Je préfère ne pas préciser")}
                  </option>
                  <option value="woman">{t("A woman", "Une femme")}</option>
                  <option value="man">{t("A man", "Un homme")}</option>
                  <option value="nonbinary">
                    {t("Non-binary", "Non binaire")}
                  </option>
                </select>
              </label>
              <label>
                {t("Show me", "Me proposer")}
                <select
                  value={profile.preference}
                  onChange={(e) => setField("preference", e.target.value)}
                >
                  <option value="anyone">{t("Anyone", "Tout le monde")}</option>
                  <option value="woman">{t("Women", "Des femmes")}</option>
                  <option value="man">{t("Men", "Des hommes")}</option>
                  <option value="nonbinary">
                    {t("Non-binary people", "Des personnes non binaires")}
                  </option>
                </select>
              </label>
              <small>
                {t(
                  "Leaving your identity unspecified keeps you in open discovery, but excludes you from gender-specific searches.",
                  "Sans identité précisée, tu apparais dans les recherches ouvertes, mais pas dans celles ciblant un genre.",
                )}
              </small>
            </div>
          </details>
        </>
      )}
    </>
  );
  return (
    <>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            if (me?.completed) setScreen("results");
          }}
          aria-label="Common Ground"
        >
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <span>
            common
            <br />
            ground<span className="brand-period">.</span>
          </span>
        </button>
        <div className="top-actions">
          <span className="campus-pill">
            UPPA <span> / </span>{" "}
            {t("student connections", "rencontres étudiantes")}
          </span>
          <button
            className="language"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            aria-label={
              lang === "en" ? "Passer en français" : "Switch to English"
            }
          >
            <b>{lang.toUpperCase()}</b>
            <span> / {lang === "en" ? "FR" : "EN"}</span>
          </button>
          {me?.completed && (
            <button
              className={`icon-button ${screen === "settings" ? "active" : ""}`}
              aria-label={t(
                "My profile and privacy",
                "Mon profil et confidentialité",
              )}
              onClick={() =>
                setScreen(screen === "settings" ? "results" : "settings")
              }
            >
              <Settings size={21} />
            </button>
          )}
        </div>
      </header>
      <main>
        {error && (
          <div className="alert error" role="alert">
            {error}
            <button
              aria-label={t("Dismiss", "Fermer")}
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div className="toast" role="status">
            <Check size={18} />
            {notice}
          </div>
        )}
        {(screen === "loading" || screen === "offline") && (
          <div className="loading-page">
            <span className="brand-mark">
              <i />
              <i />
            </span>
            <h1>{t("A little common ground.", "Un peu de terrain commun.")}</h1>
            {screen === "offline" ? (
              <button className="primary" onClick={boot}>
                {t("Try again", "Réessayer")}
              </button>
            ) : (
              <p role="status">
                {t("Opening your space…", "Ouverture de ton espace…")}
              </p>
            )}
          </div>
        )}
        {(screen === "profile" || screen === "details") && (
          <div
            className={`onboarding-grid ${screen === "details" ? "details-step" : ""}`}
          >
            <aside className="intro-panel">
              <span className="eyebrow">
                {t(
                  "NEW PEOPLE. SAME CAMPUS.",
                  "DE NOUVELLES TÊTES. TON CAMPUS.",
                )}
              </span>
              <h1>
                {t("Your people.", "Tes gens.")}
                <br />
                <em>
                  {t(
                    "Closer than you think.",
                    "Plus proches que tu ne le crois.",
                  )}
                </em>
              </h1>
              <p>
                {t(
                  "Meet new people at UPPA. Start with a name and an avatar.",
                  "Rencontre de nouvelles personnes à l’UPPA. Un prénom et un avatar pour commencer.",
                )}
              </p>
              <div className="avatar-cluster" aria-hidden="true">
                <span className="avatar a5">
                  <Avatar index={5} />
                </span>
                <span className="avatar a3">
                  <Avatar index={3} />
                </span>
                <span className="avatar a6">
                  <Avatar index={6} />
                </span>
                <span className="cluster-plus">{t("+ you", "+ toi")}</span>
              </div>
              <div className="intro-bottom">
                <span>
                  <Trash2 size={19} />
                  {t(
                    "Delete your public profile anytime",
                    "Supprime ton profil public quand tu veux",
                  )}
                </span>
                <span>
                  <LockKeyhole size={18} />
                  {t(
                    "Your answers stay private",
                    "Tes réponses restent privées",
                  )}
                </span>
              </div>
            </aside>
            <section className="flow-card">
              {progress}
              {screen === "details" && (
                <button
                  className="text-button"
                  type="button"
                  disabled={busy}
                  onClick={() => setScreen("profile")}
                >
                  <ArrowLeft size={16} />
                  {t("Back", "Retour")}
                </button>
              )}
              <div className="card-heading">
                <span className="eyebrow">
                  {t("LET’S BREAK THE ICE", "ON BRISE LA GLACE ?")}
                </span>
                <h2 ref={heading} tabIndex={-1}>
                  {me?.completed
                    ? t("Make it yours.", "À ton image.")
                    : screen === "details"
                      ? t("A little more?", "Un peu plus sur toi ?")
                      : t("First, a little you.", "D’abord, toi.")}
                </h2>
                <p>
                  {t(
                    screen === "details"
                      ? "Everything here is optional. You can continue now."
                      : "A name. An avatar. You’re ready.",
                    screen === "details"
                      ? "Tout est facultatif ici. Tu peux continuer directement."
                      : "Un prénom. Un avatar. C’est parti.",
                  )}
                </p>
              </div>
              {!me && config?.authMode === "cas" ? (
                <>
                  <div className="auth-note">
                    <ShieldCheck />
                    <p>
                      {t(
                        "Sign in securely on the official UPPA website. We never see your university password.",
                        "Connecte-toi sur le site officiel de l’UPPA. Nous ne voyons jamais ton mot de passe universitaire.",
                      )}
                    </p>
                  </div>
                  <a className="primary" href="/auth/cas">
                    {t("Continue with UPPA", "Continuer avec l’UPPA")}
                    <ArrowRight size={19} />
                  </a>
                </>
              ) : (
                <form onSubmit={onStart}>
                  {profileFields}
                  {!me && config?.accessCodeRequired && (
                    <label>
                      {t("Session access code", "Code d’accès à la session")}
                      <input
                        type="password"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                  )}
                  <button
                    className="primary full"
                    disabled={busy || !profile.name.trim()}
                  >
                    {busy
                      ? t("Saving…", "Enregistrement…")
                      : me?.completed
                        ? t("Save my profile", "Enregistrer mon profil")
                        : t("Continue", "Continuer")}
                    <ArrowRight size={19} />
                  </button>
                  {!me && (
                    <p className="fine-print">
                      {config?.authMode === "demo"
                        ? t(
                            "Demo · account linked to this browser for 7 days.",
                            "Démo · compte lié à ce navigateur pendant 7 jours.",
                          )
                        : null}
                    </p>
                  )}
                </form>
              )}
              <button
                className="privacy-link"
                onClick={() => setModal("privacy")}
              >
                <ShieldCheck size={16} />
                {t(
                  "Private answers. Public profile can be deleted.",
                  "Réponses privées. Profil public supprimable.",
                )}
              </button>
            </section>
          </div>
        )}
        {screen === "quiz" && (
          <div className="quiz-layout">
            {progress}
            <div className="quiz-top">
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  qIndex ? setQIndex(qIndex - 1) : setScreen("details")
                }
              >
                <ArrowLeft size={17} />
                {t("Back", "Retour")}
              </button>
              <span>
                {qIndex + 1} / {questions.length}
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={t("Questions answered", "Questions répondues")}
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={qIndex}
            >
              <div style={{ width: `${(qIndex / questions.length) * 100}%` }} />
            </div>
            <SwipeCard
              key={qIndex}
              question={questions[qIndex]}
              lang={lang}
              selected={answers[questions[qIndex].id]}
              busy={busy}
              onAnswer={answer}
              heading={heading}
              t={t}
            />
            <p className="quiet-note">
              <LockKeyhole size={14} />
              {t(
                "Only your overall demo score is shared. Never your answers.",
                "Seul ton score global de démo est partagé. Jamais tes réponses.",
              )}
            </p>
          </div>
        )}
        {screen === "texts" && (
          <div className="quiz-layout">
            {progress}
            <button
              className="text-button back-space"
              onClick={() => {
                setQIndex(questions.length - 1);
                setScreen("quiz");
              }}
            >
              <ArrowLeft size={17} />
              {t("Back", "Retour")}
            </button>
            <section className="flow-card text-card">
              <span className="question-icon">
                <MessageCircle size={28} />
              </span>
              <span className="eyebrow">
                {t("ONE LAST STEP", "DERNIÈRE ÉTAPE")}
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {t("Ready to meet?", "Prêt·e à découvrir les profils ?")}
              </h1>
              <p>
                {t(
                  "Your answers are saved and stay private.",
                  "Tes réponses sont enregistrées et restent privées.",
                )}
              </p>
              <form onSubmit={finish}>
                <details className="optional contact-onboarding">
                  <summary>
                    {t("Instagram & Discord", "Instagram et Discord")}{" "}
                    <span>{t("optional", "facultatif")}</span>
                  </summary>
                  <div className="detail-content">
                    <p className="muted">
                      {t(
                        "Add a username now or later. It stays private until you both agree to share.",
                        "Ajoute un identifiant maintenant ou plus tard. Il reste privé jusqu’à votre accord mutuel.",
                      )}
                    </p>
                    {["instagram", "discord"].map((key) => (
                      <label key={key}>
                        {key === "instagram" ? "Instagram" : "Discord"}
                        <input
                          value={contacts[key]}
                          maxLength={32}
                          pattern="[a-zA-Z0-9_.]{2,32}"
                          placeholder={t(
                            "Username, without @",
                            "Identifiant, sans @",
                          )}
                          onChange={(e) =>
                            setContacts({ ...contacts, [key]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </details>
                <p className="publish-note">
                  <ShieldCheck size={18} />
                  <span>
                    {t(
                      "To see others, your profile will be visible too. Your answers stay private. You can hide or delete your profile in settings.",
                      "Pour voir les autres, ton profil sera visible aussi. Tes réponses restent privées. Tu peux masquer ou supprimer ton profil dans les réglages.",
                    )}
                  </span>
                </p>
                <button className="primary full" disabled={busy}>
                  {busy
                    ? t("Finding your people…", "Recherche en cours…")
                    : t("Publish & meet people", "Publier et découvrir")}
                  <Sparkles size={18} />
                </button>
                <p className="fine-print">
                  {t(
                    "Prototype: scores are simulated, not scientific predictions.",
                    "Prototype : les scores sont simulés, sans prédiction scientifique.",
                  )}
                </p>
              </form>
            </section>
          </div>
        )}
        {screen === "results" && (
          <section className="results-page">
            <div className="results-heading">
              <div>
                <span className="eyebrow">
                  {t("A LITTLE COMMON GROUND", "UN PEU DE TERRAIN COMMUN")}
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  {t("Meet your kind of people.", "Rencontre tes gens.")}
                </h1>
                <p>
                  {t(
                    "A starting point for a hello. The rest is up to you.",
                    "Un point de départ pour un bonjour. La suite vous appartient.",
                  )}
                </p>
              </div>
              <span className={`avatar welcome-avatar a${profile.avatar}`}>
                <Avatar index={profile.avatar} />
              </span>
            </div>
            <div className="simulation-note">
              <Sparkles size={19} />
              <p>
                <b>{t("Demo scores", "Scores de démo")}</b> —{" "}
                {t(
                  "simulated for this prototype, not a prediction of friendship or attraction.",
                  "simulés pour ce prototype, sans prédiction d’amitié ou d’attirance.",
                )}
              </p>
              <button
                className="text-button"
                onClick={() => setModal("scoring")}
                aria-label={t("About scores", "À propos des scores")}
              >
                <Info size={18} />
              </button>
            </div>
            {!me.visible && (
              <div className="alert">
                <EyeOff size={20} />
                {t(
                  "Your profile is hidden. Make it visible in your settings to meet participants.",
                  "Ton profil est masqué. Rends-le visible dans tes réglages pour rencontrer les participants.",
                )}
                <button
                  className="text-button"
                  onClick={() => setScreen("settings")}
                >
                  {t("Settings", "Réglages")}
                </button>
              </div>
            )}
            <div className="results-toolbar">
              <div
                className="tabs"
                role="group"
                aria-label={t("Profile source", "Source des profils")}
              >
                <button
                  aria-pressed={!example}
                  className={!example ? "selected" : ""}
                  onClick={() => setExample(false)}
                >
                  <Users size={17} />
                  {t("Participants", "Participants")}
                </button>
                <button
                  aria-pressed={example}
                  className={example ? "selected" : ""}
                  onClick={() => setExample(true)}
                >
                  {t("Example profiles", "Profils fictifs")}
                </button>
              </div>
              <label className="score-filter">
                <SlidersHorizontal size={17} />
                <span>{t("Minimum score", "Score minimum")}</span>
                <input
                  aria-label={t("Minimum demo score", "Score de démo minimum")}
                  type="range"
                  min={30}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <output>{threshold}%</output>
              </label>
            </div>
            <div className="result-count">
              <span>
                {matches.filter((m) => m.score >= threshold).length}{" "}
                {t("people to discover", "profils à découvrir")}
                {example
                  ? ` · ${t("fictional profiles", "profils fictifs")}`
                  : ""}
              </span>
              <button
                className="text-button"
                disabled={matchLoading}
                onClick={() => refreshMatches()}
              >
                <RotateCcw size={14} />
                {t("Refresh", "Actualiser")}
              </button>
            </div>
            {matchLoading ? (
              <div className="empty-state" role="status">
                {t("Looking around campus…", "Un petit tour du campus…")}
              </div>
            ) : matches.filter((m) => m.score >= threshold).length ? (
              <div className="people-grid">
                {matches
                  .filter((m) => m.score >= threshold)
                  .map((p, i) => (
                    <button
                      className="person-card"
                      key={p.id}
                      onClick={() => openPerson(p)}
                    >
                      <div className={`person-art a${p.avatar}`}>
                        <span className="person-emoji">
                          <Avatar index={p.avatar} />
                        </span>
                        <span className="score-badge">
                          {p.score}
                          <small>%</small>
                          <span>{t("demo score", "score démo")}</span>
                        </span>
                        {p.fictitious && (
                          <span className="fiction-label">
                            {t("FICTIONAL", "FICTIF")}
                          </span>
                        )}
                      </div>
                      <div className="person-body">
                        <div className="person-name">
                          <h2>
                            {p.name}
                            {p.age ? `, ${p.age}` : ""}
                          </h2>
                          <span className="circle-arrow">
                            <ArrowRight size={19} />
                          </span>
                        </div>
                        <p className="course">{courseLabel(p.course)}</p>
                        <p className="bio">
                          {p.bio ||
                            t(
                              "Here for a new hello.",
                              "Ici pour faire connaissance.",
                            )}
                        </p>
                        <div className="person-footer">
                          {p.status === "connected" ? (
                            <>
                              <CheckCheck size={16} />
                              {t("Connected", "En contact")}
                            </>
                          ) : p.status === "incoming" ? (
                            <>
                              <MessageCircle size={16} />
                              {t(
                                "Wants to say hello",
                                "Souhaite faire connaissance",
                              )}
                            </>
                          ) : p.status === "pending" ? (
                            t(
                              "Waiting for their reply",
                              "En attente de sa réponse",
                            )
                          ) : (
                            t("Say hello?", "On fait connaissance ?")
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="empty-state">
                <Users size={36} />
                <h2>
                  {matches.length
                    ? t(
                        "A little room for surprise?",
                        "Une petite place à la surprise ?",
                      )
                    : example
                      ? t(
                          "No examples for these preferences.",
                          "Aucun exemple pour ces préférences.",
                        )
                      : t(
                          "Your people are on their way.",
                          "Tes gens arrivent.",
                        )}
                </h2>
                <p>
                  {matches.length
                    ? t(
                        "Lower the minimum score to discover more people.",
                        "Baisse le score minimum pour découvrir plus de profils.",
                      )
                    : t(
                        "Profiles appear as participants finish. Results refresh automatically.",
                        "Les profils apparaissent quand les participants terminent. Les résultats s’actualisent automatiquement.",
                      )}
                </p>
                {matches.length ? (
                  <button
                    className="secondary"
                    onClick={() => setThreshold(30)}
                  >
                    {t("Show all scores", "Afficher tous les scores")}
                  </button>
                ) : !example ? (
                  <button
                    className="secondary"
                    onClick={() => setExample(true)}
                  >
                    {t(
                      "Explore fictional profiles meanwhile",
                      "Explorer des profils fictifs en attendant",
                    )}
                  </button>
                ) : (
                  <button
                    className="secondary"
                    onClick={() => setScreen("profile")}
                  >
                    {t("Edit my preferences", "Modifier mes préférences")}
                  </button>
                )}
              </div>
            )}
            <p className="quiet-note">
              <ShieldCheck size={15} />
              {t(
                "Questionnaire answers and private texts are never shown to other people.",
                "Les réponses et les textes privés ne sont jamais affichés aux autres.",
              )}
            </p>
          </section>
        )}
        {screen === "settings" && (
          <section className="settings-page">
            <button
              className="text-button"
              onClick={() => setScreen("results")}
            >
              <ArrowLeft size={17} />
              {t("Back to people", "Retour aux profils")}
            </button>
            <h1 ref={heading} tabIndex={-1}>
              {t("Your space. Your rules.", "Ton espace. Tes choix.")}
            </h1>
            <div className="settings-grid">
              <div>
                <section className="settings-card">
                  <div className="profile-summary">
                    <span className={`avatar a${profile.avatar}`}>
                      <Avatar index={profile.avatar} />
                    </span>
                    <div>
                      <h2>{profile.name}</h2>
                      <p>{courseLabel(profile.course)}</p>
                    </div>
                  </div>
                  <button
                    className="setting-row"
                    onClick={() => setScreen("profile")}
                  >
                    {t(
                      "Edit profile & preferences",
                      "Modifier mon profil et mes préférences",
                    )}
                    <ChevronRight size={19} />
                  </button>
                  <button
                    className="setting-row"
                    onClick={() => {
                      setQIndex(0);
                      setScreen("quiz");
                    }}
                  >
                    {t("Revisit my answers", "Revoir mes réponses")}
                    <ChevronRight size={19} />
                  </button>
                </section>
                <section className="settings-card">
                  <h2>{t("My social accounts", "Mes réseaux sociaux")}</h2>
                  <p className="muted">
                    {t(
                      "Optional. Only shared after you both agree to connect. Removing a handle stops future sharing; it cannot erase a copy already saved by someone.",
                      "Facultatif. Partagé seulement après accord mutuel. Retirer un identifiant arrête le partage, mais ne supprime pas les copies déjà conservées.",
                    )}
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(async () => {
                        await api("/me/contacts", "PUT", contacts);
                        setNotice(
                          t(
                            "Contact details saved.",
                            "Coordonnées enregistrées.",
                          ),
                        );
                      });
                    }}
                  >
                    {["instagram", "discord"].map((key) => (
                      <label key={key}>
                        {key === "instagram" ? "Instagram" : "Discord"}
                        <input
                          value={contacts[key]}
                          maxLength={32}
                          pattern="[a-zA-Z0-9_.]{2,32}"
                          placeholder={t(
                            "Username, without @",
                            "Identifiant, sans @",
                          )}
                          onChange={(e) =>
                            setContacts({ ...contacts, [key]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                    <button className="secondary full" disabled={busy}>
                      {t("Save contact details", "Enregistrer les coordonnées")}
                    </button>
                  </form>
                </section>
              </div>
              <div>
                <section className="settings-card">
                  <h2>
                    {t("Visibility & privacy", "Visibilité et confidentialité")}
                  </h2>
                  <div className="visibility-row">
                    <div>
                      <b>
                        {t(
                          "Appear in results",
                          "Apparaître dans les résultats",
                        )}
                      </b>
                      <p>
                        {me.visible
                          ? t(
                              "Your public profile is visible.",
                              "Ton profil public est visible.",
                            )
                          : t(
                              "Your profile and contacts are hidden.",
                              "Ton profil et tes contacts sont masqués.",
                            )}
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={me.visible}
                      aria-label={t(
                        "Appear in results",
                        "Apparaître dans les résultats",
                      )}
                      className={`switch ${me.visible ? "on" : ""}`}
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await api("/me/visibility", "PUT", {
                            visible: !me.visible,
                          });
                          setMe({ ...me, visible: !me.visible });
                        })
                      }
                    >
                      <span />
                    </button>
                  </div>
                  <p className="muted">
                    {t(
                      "While hidden, you cannot see other participants. Make your profile visible to return.",
                      "Quand ton profil est masqué, tu ne peux pas voir les autres participants. Rends-le visible pour revenir.",
                    )}
                  </p>
                  <p className="small-note">
                    {t(
                      `Accounts are deleted after ${config.retentionDays} days without updating a profile, answer or setting. Demo access on this browser lasts 7 days.`,
                      `Les comptes sont supprimés après ${config.retentionDays} jours sans modification du profil, des réponses ou des réglages. L’accès démo dans ce navigateur dure 7 jours.`,
                    )}
                  </p>
                  <a className="setting-row" href="/api/me/export" download>
                    <span>
                      <Download size={17} />
                      {t("Download my data", "Télécharger mes données")}
                    </span>
                    <ChevronRight size={18} />
                  </a>
                  <button
                    className="setting-row"
                    onClick={() => setModal("privacy")}
                  >
                    <span>
                      <ShieldCheck size={17} />
                      {t("How privacy works", "Comprendre la confidentialité")}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="setting-row danger"
                    onClick={() => {
                      setDeleteText("");
                      setModal("delete");
                    }}
                  >
                    <span>
                      <Trash2 size={17} />
                      {t(
                        "Delete my account & data",
                        "Supprimer mon compte et mes données",
                      )}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </section>
                {blocks.length > 0 && (
                  <section className="settings-card">
                    <h2>{t("Blocked profiles", "Profils bloqués")}</h2>
                    {blocks.map((b) => (
                      <div className="setting-row" key={b.id}>
                        <span>{b.name}</span>
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await api(`/blocks/${b.id}`, "DELETE");
                              setBlocks(blocks.filter((x) => x.id !== b.id));
                            })
                          }
                        >
                          {t("Unblock", "Débloquer")}
                        </button>
                      </div>
                    ))}
                  </section>
                )}
                <button
                  className="text-button logout"
                  onClick={() => setModal("logout")}
                >
                  <LogOut size={17} />
                  {t("Sign out", "Se déconnecter")}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer>
        <span>
          common ground. <span className="footer-divider">/</span>{" "}
          {t("A student project at UPPA", "Un projet étudiant à l’UPPA")}
        </span>
        <button onClick={() => setModal("privacy")}>
          {t("Privacy", "Confidentialité")}
        </button>
      </footer>
      <dialog
        ref={dialog}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-inner">
          <button
            className="close-modal icon-button"
            onClick={() => setModal(null)}
            aria-label={t("Close", "Fermer")}
          >
            <X size={22} />
          </button>
          {modal === "privacy" && (
            <>
              <span className="question-icon">
                <ShieldCheck />
              </span>
              <h2 id="dialog-title">
                {t("Your data, your choice.", "Tes données, tes choix.")}
              </h2>
              <p>
                {t(
                  "Public: your chosen name, avatar and any optional age, study level or bio you add. Only signed-in participants can explore profiles.",
                  "Public : ton nom choisi, ton avatar, et les éventuels âge, niveau d’études et bio. Seuls les participants connectés peuvent explorer les profils.",
                )}
              </p>
              <p>
                {t(
                  "Private: your answers, two short texts, identity and meeting preferences. They stay on the server and are not sent in other people’s results. Scores and filtering may still reveal limited indirect information.",
                  "Privé : tes réponses, tes deux textes, ton identité et tes préférences de rencontre. Ils restent sur le serveur et ne sont pas envoyés dans les résultats des autres. Le score et le filtrage peuvent toutefois révéler des informations indirectes limitées.",
                )}
              </p>
              <p>
                {t(
                  "Contacts are shared only after a mutual hello. No advertising, analytics or external AI service. Hiding your profile also hides your contacts inside the app.",
                  "Les contacts sont partagés après accord mutuel. Aucune publicité, mesure d’audience ou IA externe. Masquer ton profil masque aussi tes contacts dans l’application.",
                )}
              </p>
              <p>
                {t(
                  `Delete your account anytime in settings. Inactive records are automatically deleted after ${config?.retentionDays || 30} days without an update. Existing copies or server backups may persist under the host’s backup policy.`,
                  `Supprime ton compte à tout moment dans les réglages. Les données sont supprimées automatiquement après ${config?.retentionDays || 30} jours sans modification. Des copies ou sauvegardes peuvent subsister selon la politique de l’hébergeur.`,
                )}
              </p>
              <p>
                {config?.privacyContact
                  ? `${t("Project contact", "Contact du projet")} : ${config.privacyContact}`
                  : t(
                      "For questions, contact the student team who invited you.",
                      "Pour toute question, contacte l’équipe étudiante qui t’a invité·e.",
                    )}
              </p>
              <p className="small-note">
                {t(
                  "Demo access is not proof of UPPA enrolment. Clearing cookies or signing out ends access to a demo account; delete it first if you no longer need it.",
                  "L’accès démo ne prouve pas l’inscription à l’UPPA. Effacer les cookies ou se déconnecter met fin à l’accès au compte démo ; supprime-le avant si tu n’en as plus besoin.",
                )}
              </p>
            </>
          )}
          {modal === "scoring" && (
            <>
              <span className="question-icon">
                <Sparkles />
              </span>
              <h2 id="dialog-title">
                {t(
                  "A demo, not a prediction.",
                  "Une démo, pas une prédiction.",
                )}
              </h2>
              <p>
                {t(
                  "These stable example scores are generated for pairs of profiles. They do not measure compatibility and are not calculated from your answers or texts.",
                  "Ces scores d’exemple stables sont générés pour des paires de profils. Ils ne mesurent pas la compatibilité et ne sont pas calculés à partir de tes réponses ou textes.",
                )}
              </p>
              <p>
                {t(
                  "The questionnaire, text comparison and final scoring will be researched and validated in a later phase. For now, use this as a way to start a conversation.",
                  "Le questionnaire, la comparaison des textes et le calcul final seront étudiés et validés dans une prochaine phase. Pour le moment, c’est une façon d’engager la conversation.",
                )}
              </p>
            </>
          )}
          {modal === "person" && !activePerson && (
            <>
              <h2 id="dialog-title">
                {t("Profile unavailable", "Profil indisponible")}
              </h2>
              <p>
                {t(
                  "This profile is no longer available. Close this window to continue.",
                  "Ce profil n’est plus disponible. Ferme cette fenêtre pour continuer.",
                )}
              </p>
            </>
          )}
          {modal === "person" && activePerson && (
            <>
              <div className={`profile-modal-art a${activePerson.avatar}`}>
                <span>
                  <Avatar index={activePerson.avatar} />
                </span>
              </div>
              <h2 id="dialog-title">
                {activePerson.name}
                {activePerson.age ? `, ${activePerson.age}` : ""}
              </h2>
              <p className="muted">{courseLabel(activePerson.course)}</p>
              <p>
                {activePerson.bio ||
                  t(
                    "Here to meet someone new.",
                    "Ici pour faire connaissance.",
                  )}
              </p>
              <span className="inline-score">
                {activePerson.score}% · {t("simulated score", "score simulé")}
              </span>
              {activePerson.fictitious ? (
                <p className="auth-note">
                  {t(
                    "This is a fictional example. No message or contact request can be sent.",
                    "Ceci est un exemple fictif. Aucun message ou demande de contact ne peut être envoyé.",
                  )}
                </p>
              ) : (
                <div className="person-actions">
                  {activePerson.status === "connected" ? (
                    <>
                      <h3>
                        {t(
                          "You both said hello!",
                          "Vous avez tous les deux dit bonjour !",
                        )}
                      </h3>
                      {activePerson.contacts?.instagram && (
                        <a
                          className="contact-link"
                          href={`https://www.instagram.com/${activePerson.contacts.instagram}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Instagram · @{activePerson.contacts.instagram}
                          <ArrowRight size={17} />
                        </a>
                      )}
                      {activePerson.contacts?.discord && (
                        <p className="contact-link">
                          Discord · {activePerson.contacts.discord}
                        </p>
                      )}
                      {!activePerson.contacts?.instagram &&
                        !activePerson.contacts?.discord && (
                          <p>
                            {t(
                              "No contact details added. A hello in person works too.",
                              "Aucune coordonnée ajoutée. Un bonjour en personne, ça marche aussi.",
                            )}
                          </p>
                        )}
                      <button
                        className="secondary full"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await api(
                              `/connections/${activePerson.id}`,
                              "DELETE",
                            );
                            setModal(null);
                            await refreshMatches();
                          })
                        }
                      >
                        {t("End connection", "Retirer la connexion")}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="small-note">
                        {t(
                          "Your contact details are shared only if you both agree. Add or remove yours in settings.",
                          "Vos coordonnées sont partagées seulement après accord mutuel. Ajoute ou retire les tiennes dans les réglages.",
                        )}
                      </p>
                      {!contacts.instagram && !contacts.discord && (
                        <button
                          className="secondary full"
                          onClick={() => {
                            setModal(null);
                            setScreen("settings");
                          }}
                        >
                          {t(
                            "Add my social accounts",
                            "Ajouter mes réseaux sociaux",
                          )}
                        </button>
                      )}
                      <button
                        className="primary full"
                        disabled={busy || activePerson.status === "pending"}
                        onClick={() => run(() => connect(activePerson))}
                      >
                        {activePerson.status === "pending"
                          ? t(
                              "Waiting for their reply",
                              "En attente de sa réponse",
                            )
                          : activePerson.status === "incoming"
                            ? t(
                                "Accept & share contacts",
                                "Accepter et partager mes réseaux",
                              )
                            : t(
                                "Ask to share contacts",
                                "Proposer un échange de réseaux",
                              )}
                        <MessageCircle size={18} />
                      </button>
                      {["pending", "incoming"].includes(
                        activePerson.status,
                      ) && (
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await api(
                                `/connections/${activePerson.id}`,
                                "DELETE",
                              );
                              setModal(null);
                              await refreshMatches();
                            })
                          }
                        >
                          {activePerson.status === "incoming"
                            ? t("Decline request", "Refuser la demande")
                            : t("Cancel request", "Annuler la demande")}
                        </button>
                      )}
                    </>
                  )}
                  <button
                    className="text-button danger"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await api(`/blocks/${activePerson.id}`, "POST");
                        setModal(null);
                        await refreshMatches();
                      })
                    }
                  >
                    {t("Block this profile", "Bloquer ce profil")}
                  </button>
                </div>
              )}
            </>
          )}
          {modal === "delete" && (
            <>
              <h2 id="dialog-title">
                {t(
                  "Leave no profile behind.",
                  "Ne laisse aucun profil derrière toi.",
                )}
              </h2>
              <p>
                {t(
                  "This permanently removes your profile, answers, texts, contacts and connections from the active database. You cannot undo it.",
                  "Ton profil, tes réponses, tes textes, tes contacts et tes connexions seront supprimés de la base active. Cette action est irréversible.",
                )}
              </p>
              <label>
                {t("Type DELETE to confirm", "Écris DELETE pour confirmer")}
                <input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <button
                className="primary destructive full"
                disabled={busy || deleteText !== "DELETE"}
                onClick={() =>
                  run(async () => {
                    await api("/me", "DELETE", { confirm: "DELETE" });
                    setModal(null);
                    setMe(null);
                    setProfile(emptyProfile);
                    setAnswers({});
                    setTexts({ likes: "", dislikes: "" });
                    setContacts({ instagram: "", discord: "" });
                    setMatches([]);
                    setScreen("profile");
                    setNotice(
                      t(
                        "Your account and data have been deleted.",
                        "Ton compte et tes données ont été supprimés.",
                      ),
                    );
                  })
                }
              >
                {t("Delete my account", "Supprimer mon compte")}
              </button>
            </>
          )}
          {modal === "logout" && (
            <>
              <h2 id="dialog-title">
                {t("Ready to leave?", "Tu nous quittes ?")}
              </h2>
              <p>
                {config?.authMode === "demo"
                  ? t(
                      "This demo account has no recovery login. Signing out removes your access, but keeps the profile until automatic deletion. Delete your account instead if you want to remove your data now.",
                      "Ce compte démo n’a pas de connexion de récupération. Tu perdras ton accès, mais le profil restera jusqu’à sa suppression automatique. Supprime plutôt ton compte pour retirer tes données maintenant.",
                    )
                  : t(
                      "This signs you out of Common Ground. Your UPPA browser session may still be active.",
                      "Cela te déconnecte de Common Ground. Ta session UPPA dans le navigateur peut rester active.",
                    )}
              </p>
              <button
                className="secondary full"
                onClick={() => {
                  setDeleteText("");
                  setModal("delete");
                }}
              >
                {t("Delete account instead", "Supprimer mon compte")}
              </button>
              <button
                className="primary full"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api("/logout", "POST");
                    setModal(null);
                    setMe(null);
                    setProfile(emptyProfile);
                    setAnswers({});
                    setTexts({ likes: "", dislikes: "" });
                    setMatches([]);
                    setScreen("profile");
                  })
                }
              >
                {t("Sign out", "Se déconnecter")}
              </button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
