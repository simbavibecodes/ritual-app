import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Auth from './Auth';
import { supabase } from './supabase';

function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#fdf6f0', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem',
        color: '#b07a5e', fontStyle: 'italic', letterSpacing: '.04em'
      }}>
        Loading your ritual…
      </div>
    );
  }

  return user ? <App user={user} /> : <Auth />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Root /></React.StrictMode>);
