import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

/* ──────────────────────────────────────────────────────────────
   Onboarding — a calm, luxury-spa questionnaire.
   Seven screens, one question at a time, soft fade between screens.
   Matches the sage-green palette and Cormorant / DM Sans typography
   used elsewhere in the app. No emojis anywhere.
   ────────────────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
.ob-wrap{
  min-height:100vh;
  background:
    radial-gradient(ellipse at 22% 10%, rgba(175,200,158,.55) 0%, transparent 48%),
    radial-gradient(ellipse at 80% 90%, rgba(55,85,70,.5) 0%, transparent 50%),
    linear-gradient(162deg,#A6BA96 0%,#84A076 22%,#6C9272 50%,#577A68 78%,#47665A 100%);
  background-attachment:fixed;
  display:flex; align-items:center; justify-content:center;
  padding:32px 22px calc(32px + env(safe-area-inset-bottom));
  font-family:'DM Sans',sans-serif;
  color:#fff;
}
.ob-card{
  width:100%; max-width:460px;
  background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.22);
  backdrop-filter:blur(28px) saturate(1.35);
  -webkit-backdrop-filter:blur(28px) saturate(1.35);
  border-radius:28px;
  padding:44px 30px 36px;
  box-shadow:0 24px 64px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.22);
  position:relative;
}
.ob-step{
  animation:obFade .55s ease both;
}
@keyframes obFade{
  from{ opacity:0; transform:translateY(8px); }
  to  { opacity:1; transform:translateY(0); }
}
.ob-eyebrow{
  font-size:.66rem; letter-spacing:.28em; text-transform:uppercase;
  color:rgba(255,255,255,.55); text-align:center; margin-bottom:18px;
}
.ob-heading{
  font-family:'Cormorant Garamond',serif;
  font-weight:300; font-size:2.05rem; line-height:1.15;
  letter-spacing:-.005em; text-align:center;
  color:#fff;
  margin-bottom:14px;
}
.ob-heading em{ font-style:italic; color:rgba(255,255,255,.82); }
.ob-sub{
  text-align:center;
  font-size:.92rem; line-height:1.55;
  color:rgba(255,255,255,.70);
  margin-bottom:32px;
  font-weight:300;
}
.ob-input{
  width:100%;
  background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.22);
  border-radius:14px;
  padding:14px 16px;
  font-family:'DM Sans',sans-serif;
  font-size:.95rem;
  color:#fff;
  outline:none;
  transition:border .22s, background .22s, opacity .35s;
  box-sizing:border-box;
}
.ob-input::placeholder{ color:rgba(255,255,255,.40); }
.ob-input:focus{
  border-color:rgba(255,255,255,.55);
  background:rgba(255,255,255,.16);
}
.ob-input.fading{ opacity:0; }
.ob-textarea{
  width:100%; min-height:82px; resize:vertical;
  background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.22);
  border-radius:14px;
  padding:12px 14px;
  font-family:'DM Sans',sans-serif;
  font-size:.92rem;
  color:#fff; outline:none;
  transition:border .22s, background .22s;
}
.ob-textarea:focus{
  border-color:rgba(255,255,255,.55);
  background:rgba(255,255,255,.16);
}
.ob-tags{
  display:flex; flex-wrap:wrap; gap:8px;
  margin-bottom:18px; min-height:6px;
}
.ob-tag{
  display:inline-flex; align-items:center; gap:8px;
  background:rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.28);
  color:#fff;
  padding:8px 14px;
  border-radius:999px;
  font-size:.86rem; letter-spacing:.01em;
  animation:obPop .28s ease both;
}
.ob-tag .x{
  background:none; border:none; color:rgba(255,255,255,.6);
  font-size:1rem; cursor:pointer; line-height:1; padding:0;
}
.ob-tag .x:hover{ color:#fff; }
@keyframes obPop{
  from{ opacity:0; transform:scale(.92); }
  to  { opacity:1; transform:scale(1); }
}
.ob-pill-grid{
  display:flex; flex-direction:column; gap:10px; margin-bottom:18px;
}
.ob-pill{
  width:100%; text-align:left;
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.22);
  color:#fff;
  padding:14px 18px;
  border-radius:14px;
  font-family:'DM Sans',sans-serif;
  font-size:.95rem;
  cursor:pointer;
  transition:all .22s ease;
}
.ob-pill:hover{
  background:rgba(255,255,255,.14);
  border-color:rgba(255,255,255,.35);
}
.ob-pill.on{
  background:#1E3428;
  border-color:#1E3428;
  color:#fff;
  box-shadow:0 6px 20px rgba(0,0,0,.22);
}
.ob-pill.suggest{
  background:rgba(255,255,255,.05);
  border-style:dashed;
  color:rgba(255,255,255,.82);
  font-style:italic;
}
.ob-pill.suggest.on{
  background:#3D6B52;
  border-color:#3D6B52;
  color:#fff;
  font-style:normal;
}
.ob-cards{
  display:flex; flex-direction:column; gap:12px; margin-bottom:18px;
}
.ob-choice{
  text-align:left;
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.22);
  color:#fff;
  padding:18px 20px;
  border-radius:16px;
  font-family:'DM Sans',sans-serif;
  font-size:.95rem; line-height:1.4;
  cursor:pointer;
  transition:all .22s ease;
}
.ob-choice strong{
  font-family:'Cormorant Garamond',serif;
  font-weight:400; font-style:italic;
  font-size:1.15rem; color:#fff;
  display:block; margin-bottom:2px;
}
.ob-choice .descr{
  font-size:.85rem; color:rgba(255,255,255,.65); font-weight:300;
}
.ob-choice:hover{
  background:rgba(255,255,255,.14);
  border-color:rgba(255,255,255,.35);
}
.ob-choice.on{
  background:rgba(30,52,40,.85);
  border-color:rgba(255,255,255,.5);
  box-shadow:0 8px 24px rgba(0,0,0,.22);
}
.ob-soft-row{
  display:flex; flex-wrap:wrap; gap:8px;
  margin-bottom:14px;
}
.ob-soft{
  background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.22);
  color:#fff;
  padding:9px 16px;
  border-radius:999px;
  font-family:'DM Sans',sans-serif;
  font-size:.86rem;
  cursor:pointer;
  transition:all .22s ease;
}
.ob-soft:hover{
  background:rgba(255,255,255,.18);
  border-color:rgba(255,255,255,.4);
}
.ob-soft.on{
  background:#1E3428;
  border-color:#1E3428;
  color:#fff;
}
.ob-field-label{
  font-size:.70rem; letter-spacing:.22em;
  text-transform:uppercase; color:rgba(255,255,255,.55);
  margin-bottom:10px; margin-top:18px;
  font-weight:500;
}
.ob-field-label:first-child{ margin-top:0; }
.ob-actions{
  display:flex; justify-content:space-between; align-items:center;
  gap:12px; margin-top:28px;
}
.ob-primary{
  flex:1;
  background:#1E3428; color:#fff;
  border:none; border-radius:14px;
  padding:15px 20px;
  font-family:'DM Sans',sans-serif;
  font-size:.80rem; letter-spacing:.16em; text-transform:uppercase;
  cursor:pointer;
  transition:background .22s, transform .22s, opacity .35s;
  box-shadow:0 8px 24px rgba(0,0,0,.22);
  animation:obFade .45s ease both;
}
.ob-primary:hover{ background:#243D30; }
.ob-primary:disabled{ opacity:.4; cursor:not-allowed; }
.ob-ghost{
  background:none; border:none;
  color:rgba(255,255,255,.55);
  font-family:'DM Sans',sans-serif;
  font-size:.72rem; letter-spacing:.18em; text-transform:uppercase;
  cursor:pointer;
  padding:10px 14px;
  transition:color .22s;
}
.ob-ghost:hover{ color:rgba(255,255,255,.9); }
.ob-progress{
  position:absolute; top:18px; left:0; right:0;
  display:flex; justify-content:center; gap:6px;
  pointer-events:none;
}
.ob-progress span{
  width:18px; height:2px; border-radius:1px;
  background:rgba(255,255,255,.22);
  transition:background .35s;
}
.ob-progress span.on{ background:rgba(255,255,255,.75); }
.ob-center-btn-row{ display:flex; justify-content:center; margin-top:28px; }
.ob-enter-btn{
  background:#1E3428; color:#fff;
  border:none; border-radius:999px;
  padding:16px 48px;
  font-family:'DM Sans',sans-serif;
  font-size:.82rem; letter-spacing:.22em; text-transform:uppercase;
  cursor:pointer;
  transition:background .22s, transform .22s;
  box-shadow:0 10px 28px rgba(0,0,0,.25);
}
.ob-enter-btn:hover{ background:#243D30; transform:translateY(-1px); }
.ob-enter-btn:disabled{ opacity:.4; cursor:not-allowed; }
.ob-err{
  background:rgba(180,60,40,.22);
  border:1px solid rgba(255,120,100,.3);
  color:rgba(255,200,190,.95);
  border-radius:12px;
  padding:10px 14px;
  font-size:.82rem;
  margin-top:14px;
}
`;

/* ── Goal options used on SCREEN 3 ─────────────────────────── */
const GOALS = [
  { id: "glow",        label: "Glow & radiance" },
  { id: "calm",        label: "Calm & balance" },
  { id: "clarity",     label: "Clarity & renewal" },
  { id: "strength",    label: "Strength & repair" },
  { id: "maintain",    label: "Just maintaining" },
];

const AGE_RANGES = ["Early 20s", "Mid 20s–30s", "30s–40s", "40s+"];
const SEXES = ["Female", "Male", "Prefer not to say"];

const GUIDANCE = [
  { id: "gently",  title: "Gently",  descr: "I know what I’m doing, just remind me" },
  { id: "actively",title: "Actively",descr: "I’d love thoughtful suggestions along the way" },
  { id: "fully",   title: "Fully",   descr: "Surprise me, I trust the process" },
  { id: "custom",  title: "Something else…", descr: "Tell us in your own words" },
];

const CHECK_INS = [
  { id: "daily",       label: "Every day" },
  { id: "few_times",   label: "A few times a week" },
  { id: "when_i_feel", label: "When it feels right" },
];

const TOTAL_STEPS = 7;

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(1);

  // Screen 2 — categories
  const [categories, setCategories] = useState([]); // array of strings (lowercased)
  const [catDraft, setCatDraft]     = useState("");
  const [catFading, setCatFading]   = useState(false);
  const catInputRef = useRef(null);

  // Screen 3 — goals per category (map: catName -> Set of goal ids, including "suggest")
  const [goalsByCat, setGoalsByCat] = useState({});
  const [catIndex, setCatIndex]     = useState(0); // which category we're asking about

  // Screen 4 — guidance style
  const [guidance, setGuidance]     = useState(null); // "gently" | "actively" | "fully" | "custom"
  const [guidanceCustom, setGuidanceCustom] = useState("");

  // Screen 5 — check-in rhythm
  const [checkIn, setCheckIn]       = useState(null);

  // Screen 6 — about you
  const [ageRange, setAgeRange]     = useState("");
  const [sex, setSex]               = useState("");
  const [sensitivities, setSensitivities] = useState("");

  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  useEffect(() => {
    // Auto-focus the category input when we land on screen 2
    if (step === 2 && catInputRef.current) {
      setTimeout(() => catInputRef.current?.focus(), 400);
    }
  }, [step]);

  /* ── Screen 2 helpers ─────────────────────────────────────── */
  const addCategory = () => {
    const raw = catDraft.trim();
    if (!raw) return;
    const normalized = raw.toLowerCase();
    if (categories.includes(normalized)) {
      setCatDraft("");
      return;
    }
    setCatFading(true);
    setTimeout(() => {
      setCategories(prev => [...prev, normalized]);
      setCatDraft("");
      setCatFading(false);
      catInputRef.current?.focus();
    }, 180);
  };
  const removeCategory = (name) => {
    setCategories(prev => prev.filter(c => c !== name));
    setGoalsByCat(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  /* ── Screen 3 helpers ─────────────────────────────────────── */
  const toggleGoal = (cat, goalId) => {
    setGoalsByCat(prev => {
      const current = new Set(prev[cat] || []);
      if (current.has(goalId)) current.delete(goalId);
      else current.add(goalId);
      return { ...prev, [cat]: current };
    });
  };
  const currentCategoryForGoals = categories[catIndex] || "";
  const currentGoalSet = goalsByCat[currentCategoryForGoals] || new Set();
  const canAdvanceFromGoals = currentGoalSet.size > 0;

  const advanceGoals = () => {
    if (catIndex < categories.length - 1) {
      setCatIndex(catIndex + 1);
    } else {
      setStep(4);
    }
  };
  const backGoals = () => {
    if (catIndex > 0) setCatIndex(catIndex - 1);
    else setStep(2);
  };

  /* ── Final save ───────────────────────────────────────────── */
  const finish = async () => {
    if (!user) return;
    setSaving(true);
    setErr("");
    try {
      // Build goals JSON structure for storage — we embed in suggestion_custom
      // only if guidance === 'custom'. Goals themselves currently live only in
      // memory (no dedicated column requested) — we persist them as a JSON
      // blob on user_profile via `sensitivities` would be wrong; instead, we
      // store goals inline with each category row by namespacing them into the
      // name? No — the migration spec only gives `name` and `order_index`.
      //
      // Per spec: user_categories stores name + order_index only.
      // Goals per category are kept client-side for now; future migration can
      // add a `goals text[]` column without changing this call site.

      // 1. Insert categories (lowercased, in order the user added them)
      if (categories.length > 0) {
        const rows = categories.map((name, i) => ({
          user_id: user.id,
          name,
          order_index: i,
        }));
        const { error: catErr } = await supabase
          .from("user_categories")
          .upsert(rows, { onConflict: "user_id,name" });
        if (catErr) throw catErr;
      }

      // 2. Upsert user_profile with onboarding_complete=true
      const profileRow = {
        user_id: user.id,
        age_range: ageRange || null,
        biological_sex: sex || null,
        sensitivities: sensitivities || null,
        check_in_frequency: checkIn || null,
        suggestion_level: guidance || null,
        suggestion_custom: guidance === "custom" ? (guidanceCustom || null) : null,
        onboarding_complete: true,
      };
      const { error: profErr } = await supabase
        .from("user_profile")
        .upsert(profileRow, { onConflict: "user_id" });
      if (profErr) throw profErr;

      onComplete?.({ categories, profile: profileRow, goalsByCat });
    } catch (e) {
      console.error("Onboarding save error", e);
      setErr(e.message || "We couldn’t save your answers. Please try again.");
      setSaving(false);
    }
  };

  /* ── Rendering ────────────────────────────────────────────── */
  const renderProgress = () => (
    <div className="ob-progress" aria-hidden="true">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span key={i} className={i < step ? "on" : ""} />
      ))}
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="ob-wrap">
        <div className="ob-card">
          {renderProgress()}

          {step === 1 && (
            <div className="ob-step" key="s1">
              <div className="ob-eyebrow">A Quiet Beginning</div>
              <h1 className="ob-heading">Your ritual <em>starts here.</em></h1>
              <p className="ob-sub">Let’s take a moment to make this yours.</p>
              <div className="ob-center-btn-row">
                <button className="ob-enter-btn" onClick={() => setStep(2)}>Get Started</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="ob-step" key="s2">
              <div className="ob-eyebrow">Your Focus</div>
              <h1 className="ob-heading">What would you like to <em>tend to?</em></h1>
              <p className="ob-sub">Type each one, then press enter to add another.</p>

              {categories.length > 0 && (
                <div className="ob-tags">
                  {categories.map(c => (
                    <span key={c} className="ob-tag">
                      {c}
                      <button className="x" onClick={() => removeCategory(c)} aria-label={`Remove ${c}`}>×</button>
                    </span>
                  ))}
                </div>
              )}

              <input
                ref={catInputRef}
                className={`ob-input ${catFading ? "fading" : ""}`}
                placeholder="e.g. skin, hair, supplements…"
                value={catDraft}
                onChange={e => setCatDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); addCategory(); }
                }}
              />

              <div className="ob-actions">
                <button className="ob-ghost" onClick={() => setStep(1)}>Back</button>
                {categories.length > 0 && (
                  <button className="ob-primary" onClick={() => { setCatIndex(0); setStep(3); }}>
                    Continue
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 3 && categories.length > 0 && (
            <div className="ob-step" key={`s3-${catIndex}`}>
              <div className="ob-eyebrow">
                {catIndex + 1} of {categories.length}
              </div>
              <h1 className="ob-heading">
                When it comes to your <em>{currentCategoryForGoals}</em>,<br/>
                what are you hoping for?
              </h1>
              <p className="ob-sub">Pick any that resonate.</p>

              <div className="ob-pill-grid">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    className={`ob-pill ${currentGoalSet.has(g.id) ? "on" : ""}`}
                    onClick={() => toggleGoal(currentCategoryForGoals, g.id)}
                  >
                    {g.label}
                  </button>
                ))}
                <button
                  className={`ob-pill suggest ${currentGoalSet.has("suggest") ? "on" : ""}`}
                  onClick={() => toggleGoal(currentCategoryForGoals, "suggest")}
                >
                  Open to suggestions
                </button>
              </div>

              <div className="ob-actions">
                <button className="ob-ghost" onClick={backGoals}>Back</button>
                {canAdvanceFromGoals && (
                  <button className="ob-primary" onClick={advanceGoals}>
                    {catIndex < categories.length - 1 ? "Continue" : "Continue"}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="ob-step" key="s4">
              <div className="ob-eyebrow">Your Guide</div>
              <h1 className="ob-heading">How would you like us to <em>guide you?</em></h1>
              <p className="ob-sub">This shapes how Ritual speaks to you.</p>

              <div className="ob-cards">
                {GUIDANCE.map(g => (
                  <button
                    key={g.id}
                    className={`ob-choice ${guidance === g.id ? "on" : ""}`}
                    onClick={() => setGuidance(g.id)}
                  >
                    <strong>{g.title}</strong>
                    <span className="descr">{g.descr}</span>
                  </button>
                ))}
              </div>

              {guidance === "custom" && (
                <textarea
                  className="ob-textarea"
                  placeholder="Describe the kind of guidance you’d like…"
                  value={guidanceCustom}
                  onChange={e => setGuidanceCustom(e.target.value)}
                />
              )}

              <div className="ob-actions">
                <button className="ob-ghost" onClick={() => setStep(3)}>Back</button>
                {guidance && (guidance !== "custom" || guidanceCustom.trim().length > 0) && (
                  <button className="ob-primary" onClick={() => setStep(5)}>Continue</button>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="ob-step" key="s5">
              <div className="ob-eyebrow">Your Rhythm</div>
              <h1 className="ob-heading">How often would you like to <em>check in</em> with yourself?</h1>

              <div className="ob-cards">
                {CHECK_INS.map(c => (
                  <button
                    key={c.id}
                    className={`ob-choice ${checkIn === c.id ? "on" : ""}`}
                    onClick={() => setCheckIn(c.id)}
                  >
                    <strong>{c.label}</strong>
                  </button>
                ))}
              </div>

              <div className="ob-actions">
                <button className="ob-ghost" onClick={() => setStep(4)}>Back</button>
                {checkIn && (
                  <button className="ob-primary" onClick={() => setStep(6)}>Continue</button>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="ob-step" key="s6">
              <div className="ob-eyebrow">A Few Last Things</div>
              <h1 className="ob-heading">A few last <em>things.</em></h1>
              <p className="ob-sub">Entirely optional, but they help us personalize your experience.</p>

              <div className="ob-field-label">Age range</div>
              <div className="ob-soft-row">
                {AGE_RANGES.map(a => (
                  <button
                    key={a}
                    className={`ob-soft ${ageRange === a ? "on" : ""}`}
                    onClick={() => setAgeRange(ageRange === a ? "" : a)}
                  >
                    {a}
                  </button>
                ))}
              </div>

              <div className="ob-field-label">Biological sex</div>
              <div className="ob-soft-row">
                {SEXES.map(s => (
                  <button
                    key={s}
                    className={`ob-soft ${sex === s ? "on" : ""}`}
                    onClick={() => setSex(sex === s ? "" : s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="ob-field-label">Sensitivities or allergies</div>
              <input
                className="ob-input"
                placeholder="e.g. fragrance, retinol, gluten…"
                value={sensitivities}
                onChange={e => setSensitivities(e.target.value)}
              />

              <div className="ob-actions">
                <button className="ob-ghost" onClick={() => {
                  setAgeRange(""); setSex(""); setSensitivities("");
                  setStep(7);
                }}>
                  Skip
                </button>
                <button className="ob-primary" onClick={() => setStep(7)}>Continue</button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="ob-step" key="s7">
              <div className="ob-eyebrow">A Quiet Threshold</div>
              <h1 className="ob-heading">Your ritual is <em>ready.</em></h1>
              <p className="ob-sub">Everything here is yours to shape, at your own pace.</p>

              {err && <div className="ob-err">{err}</div>}

              <div className="ob-center-btn-row">
                <button className="ob-enter-btn" onClick={finish} disabled={saving}>
                  {saving ? "Saving…" : "Enter"}
                </button>
              </div>

              {!saving && (
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <button className="ob-ghost" onClick={() => setStep(6)}>Back</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
