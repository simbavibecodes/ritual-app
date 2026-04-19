import React, { useState, useEffect } from 'react';
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
  const [profileChecking, setProfileChecking]     = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Reset onboarding state on auth change so we re-check for the new user
      setOnboardingComplete(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Whenever we have a user but haven't yet determined their onboarding state, check it.
  useEffect(() => {
    if (!user || onboardingComplete !== null || profileChecking) return;
    let cancelled = false;
    setProfileChecking(true);
    (async () => {
      try {
        // Try user_profile first
        const { data: profile, error: profErr } = await supabase
          .from("user_profile")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profErr && profErr.code !== "PGRST116") {
          // Table might not exist yet (migration not run). Fail open → treat
          // as complete so existing users aren't locked out.
          console.warn("user_profile check failed, treating as complete:", profErr.message);
          if (!cancelled) setOnboardingComplete(true);
          return;
        }

        if (profile?.onboarding_complete) {
          if (!cancelled) setOnboardingComplete(true);
          return;
        }

        // Backwards compatibility: if the user has existing data (any routine,
        // entry, or product row), treat them as an existing user and skip
        // onboarding — we'll auto-seed their categories as ["skin","hair"]
        // inside App.jsx when user_categories is empty.
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
          // Seed a user_profile row so we don't ask them again next load.
          await supabase.from("user_profile").upsert(
            { user_id: user.id, onboarding_complete: true },
            { onConflict: "user_id" }
          );
          if (!cancelled) setOnboardingComplete(true);
          return;
        }

        if (!cancelled) setOnboardingComplete(false);
      } catch (e) {
        console.error("Onboarding check error", e);
        // Fail open so a transient error doesn't block the app.
        if (!cancelled) setOnboardingComplete(true);
      } finally {
        if (!cancelled) setProfileChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, onboardingComplete, profileChecking]);

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
