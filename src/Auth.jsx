import { useState } from "react";
import { supabase } from "./supabase";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
.auth-wrap{min-height:100vh;background:#fdf6f0;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif}
.auth-card{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:24px;padding:40px 32px;width:100%;max-width:380px}
.auth-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:300;color:#3a2e27;text-align:center;line-height:1.1;margin-bottom:6px}
.auth-title span{font-style:italic;color:#b07a5e}
.auth-sub{font-size:.76rem;letter-spacing:.15em;text-transform:uppercase;color:#a08070;text-align:center;margin-bottom:32px}
.auth-tabs{display:flex;gap:0;background:#f0e8e0;border-radius:20px;padding:3px;margin-bottom:24px}
.auth-tab{flex:1;background:none;border:none;border-radius:17px;padding:8px 0;font-family:'DM Sans',sans-serif;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#a08070;cursor:pointer;transition:all .2s}
.auth-tab.active{background:#b07a5e;color:#fff}
.auth-field{width:100%;background:#fdf6f0;border:1.5px solid #e8d8cc;border-radius:12px;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#3a2e27;outline:none;margin-bottom:12px;transition:border .18s;box-sizing:border-box}
.auth-field:focus{border-color:#b07a5e}
.auth-field::placeholder{color:#c0a898;font-style:italic}
.auth-btn{width:100%;background:#b07a5e;color:#fff;border:none;border-radius:12px;padding:14px;font-family:'DM Sans',sans-serif;font-size:.84rem;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-top:4px}
.auth-btn:hover{background:#9a6248}
.auth-btn:disabled{opacity:.5;cursor:not-allowed}
.auth-err{background:#fde8e0;border:1px solid #e8c0b0;border-radius:10px;padding:10px 14px;font-size:.82rem;color:#c07060;margin-bottom:12px;line-height:1.4}
.auth-ok{background:#e8f0e8;border:1px solid #b8d4b8;border-radius:10px;padding:10px 14px;font-size:.82rem;color:#3a5a3a;margin-bottom:12px;line-height:1.4}
.auth-forgot{background:none;border:none;font-size:.76rem;color:#a08070;cursor:pointer;text-decoration:underline;display:block;margin:10px auto 0;font-family:'DM Sans',sans-serif}
`;

export default function Auth() {
  const [tab, setTab]       = useState("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [ok, setOk]         = useState("");

  const handle = async () => {
    setErr(""); setOk(""); setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
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
