import { useState } from "react";
import { supabase } from "./supabase";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
.auth-wrap{
  min-height:100vh;
  background:
    radial-gradient(ellipse at 22% 10%, rgba(175,200,158,.55) 0%, transparent 48%),
    radial-gradient(ellipse at 80% 90%, rgba(55,85,70,.5) 0%, transparent 50%),
    linear-gradient(162deg,#A6BA96 0%,#84A076 22%,#6C9272 50%,#577A68 78%,#47665A 100%);
  background-attachment:fixed;
  display:flex;align-items:center;justify-content:center;padding:24px;
  font-family:'DM Sans',sans-serif
}
.auth-card{
  background:rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.3);
  backdrop-filter:blur(32px) saturate(1.4);
  -webkit-backdrop-filter:blur(32px) saturate(1.4);
  border-radius:28px;padding:44px 32px;width:100%;max-width:360px;
  box-shadow:0 24px 64px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.25)
}
.auth-title{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:300;color:#fff;text-align:center;line-height:1.1;margin-bottom:6px;text-shadow:0 2px 12px rgba(0,0,0,.15)}
.auth-title span{font-style:italic;color:rgba(255,255,255,.75)}
.auth-sub{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.5);text-align:center;margin-bottom:32px}
.auth-tabs{display:flex;gap:0;background:rgba(0,0,0,.18);border-radius:24px;padding:3px;margin-bottom:24px}
.auth-tab{flex:1;background:none;border:none;border-radius:21px;padding:9px 0;font-family:'DM Sans',sans-serif;font-size:.76rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.5);cursor:pointer;transition:all .2s}
.auth-tab.active{background:#1E3428;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.25)}
.auth-field{width:100%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:13px 16px;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#fff;outline:none;margin-bottom:11px;transition:border .18s,background .18s;box-sizing:border-box}
.auth-field:focus{border-color:rgba(255,255,255,.55);background:rgba(255,255,255,.18)}
.auth-field::placeholder{color:rgba(255,255,255,.38)}
.auth-btn{width:100%;background:#1E3428;color:#fff;border:none;border-radius:14px;padding:15px;font-family:'DM Sans',sans-serif;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-top:4px;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.auth-btn:hover{background:#243D30}
.auth-btn:disabled{opacity:.45;cursor:not-allowed}
.auth-err{background:rgba(180,60,40,.25);border:1px solid rgba(255,120,100,.3);border-radius:11px;padding:10px 14px;font-size:.82rem;color:rgba(255,200,190,.9);margin-bottom:12px;line-height:1.4}
.auth-ok{background:rgba(40,100,60,.3);border:1px solid rgba(100,200,130,.3);border-radius:11px;padding:10px 14px;font-size:.82rem;color:rgba(160,230,190,.95);margin-bottom:12px;line-height:1.4}
.auth-forgot{background:none;border:none;font-size:.76rem;color:rgba(255,255,255,.45);cursor:pointer;text-decoration:underline;display:block;margin:12px auto 0;font-family:'DM Sans',sans-serif}
.auth-forgot:hover{color:rgba(255,255,255,.7)}
.auth-keep{display:flex;align-items:center;gap:9px;margin-bottom:12px;cursor:pointer;font-size:.8rem;color:rgba(255,255,255,.55);font-family:'DM Sans',sans-serif}
`;

export default function Auth() {
  const [tab, setTab]       = useState("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [ok, setOk]         = useState("");

  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  const handle = async () => {
    setErr(""); setOk(""); setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email, password: pass,
          options: { persistSession: keepLoggedIn }
        });
        if (error) setErr(error.message);
      } else if (tab === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) setErr(error.message);
        else setOk("Check your email for a confirmation link, then come back and log in!");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setErr(error.message);
        else setOk("Password reset email sent — check your inbox.");
      }
    } catch(e) {
      setErr("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-title">My <span>Ritual</span></div>
          <div className="auth-sub">Skin · Hair</div>

          <div className="auth-tabs">
            {[["login","Log In"],["signup","Sign Up"]].map(([v,l])=>(
              <button key={v} className={`auth-tab ${tab===v?"active":""}`} onClick={()=>{setTab(v);setErr("");setOk("");}}>
                {l}
              </button>
            ))}
          </div>

          {err && <div className="auth-err">{err}</div>}
          {ok  && <div className="auth-ok">{ok}</div>}

          {tab !== "reset" && (
            <>
              <input className="auth-field" type="email" placeholder="Email address"
                value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handle()}/>
              <input className="auth-field" type="password" placeholder="Password"
                value={pass} onChange={e=>setPass(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handle()}/>
            </>
          )}
          {tab === "reset" && (
            <input className="auth-field" type="email" placeholder="Your email address"
              value={email} onChange={e=>setEmail(e.target.value)}/>
          )}

          {tab==="login"&&(
            <label className="auth-keep">
              <input type="checkbox" checked={keepLoggedIn} onChange={e=>setKeepLoggedIn(e.target.checked)}
                style={{width:15,height:15,accentColor:"#7EC49A",cursor:"pointer"}}/>
              Keep me logged in
            </label>
          )}
          <button className="auth-btn" onClick={handle} disabled={loading||!email||(tab!=="reset"&&!pass)}>
            {loading ? "…" : tab==="login" ? "Log In" : tab==="signup" ? "Create Account" : "Send Reset Email"}
          </button>

          {tab==="login" && (
            <button className="auth-forgot" onClick={()=>{setTab("reset");setErr("");setOk("");}}>
              Forgot password?
            </button>
          )}
          {tab==="reset" && (
            <button className="auth-forgot" onClick={()=>{setTab("login");setErr("");setOk("");}}>
              ← Back to log in
            </button>
          )}
        </div>
      </div>
    </>
  );
}
