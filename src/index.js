import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Auth from './Auth';
import Onboarding from './Onboarding';
import { supabase } from './supabase';

function Loading({ label = "Loading your ritual…" }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#fdf6f0', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem',
      color: '#b07a5e', fontStyle: 'italic', letterSpacing: '.04em'
    }}>
      {label}
    </div>
  );
}

function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Onboarding gating: null = still checking, false = needs onboarding, true = done
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  // Guard against concurrent profile checks. Using a ref (not state) so that
  // React StrictMode's double-invocation can't deadlock us: a cancelled first
  // run must still be able to reset the guard in `finally` regardless of
  // component unmount state.
  const checkingRef = useRef(false);
  // Hard-stop safety net: if the async check takes > 8s (network, weird RLS,
  // etc.), fail open so the user isn't staring at "Preparing your space…"
  // forever. Better to land them in the app with the legacy ["skin","hair"]
  // defaults than to block indefinitely.
  const timeoutRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Reset onboarding state on auth change so we re-check for the new user
      setOnboardingComplete(null);
      checkingRef.current = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Whenever we have a user but haven't yet determined their onboarding state, check it.
  useEffect(() => {
    if (!user || onboardingComplete !== null) return;
    if (checkingRef.current) return;
    checkingRef.current = true;

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      checkingRef.current = false;
      setOnboardingComplete(value);
    };

    // Safety-net timeout — never block longer than 8s.
    timeoutRef.current = setTimeout(() => {
      console.warn("Onboarding check timed out after 8s — failing open.");
      finish(true);
    }, 8000);

    (async () => {
      try {
        const { data: profile, error: profErr } = await supabase
          .from("user_profile")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profErr && profErr.code !== "PGRST116") {
          console.warn("user_profile check failed, treating as complete:", profErr.message);
          finish(true); return;
        }

        if (profile?.onboarding_complete) { finish(true); return; }

        // Existing-user backwards-compat — skip onboarding if any data exists.
        const [
          { data: anyRoutine },
          { data: anyEntry },
          { data: anyProduct },
        ] = await Promise.all([
          supabase.from("routines").select("user_id").eq("user_id", user.id).limit(1),
          supabase.from("entries").select("user_id").eq("user_id", user.id).limit(1),
          supabase.from("products").select("user_id").eq("user_id", user.id).limit(1),
        ]);
        const isExistingUser =
          (anyRoutine && anyRoutine.length > 0) ||
          (anyEntry && anyEntry.length > 0) ||
          (anyProduct && anyProduct.length > 0);

        if (isExistingUser) {
          // Fire-and-forget — don't block the gate on this write.
          supabase.from("user_profile").upsert(
            { user_id: user.id, onboarding_complete: true },
            { onConflict: "user_id" }
          ).then(({ error }) => { if (error) console.warn("user_profile seed failed:", error.message); });
          finish(true); return;
        }

        finish(false);
      } catch (e) {
        console.error("Onboarding check error — failing open:", e);
        finish(true);
      }
    })();
  }, [user, onboardingComplete]);

  if (loading) return <Loading />;
  if (!user)  return <Auth />;
  if (onboardingComplete === null) return <Loading label="Preparing your space…" />;
  if (onboardingComplete === false) {
    return <Onboarding user={user} onComplete={() => setOnboardingComplete(true)} />;
  }
  return <App user={user} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Root /></React.StrictMode>);
