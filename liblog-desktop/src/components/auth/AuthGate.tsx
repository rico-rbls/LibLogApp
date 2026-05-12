/**
 * AuthGate.tsx
 * ------------
 * High-contrast login screen for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * - Uses supabase.auth.signInWithPassword (email + password)
 * - On success: session is auto-saved by the Zustand onAuthStateChange listener
 *   in authStore.ts — no manual store writes needed here.
 * - CCC Purple (#652D90) applied to submit button, logo accent, and focus rings.
 * - Displays inline error messages from Supabase (wrong password, user not found, etc.)
 */
import { useState, type FormEvent } from 'react';
import { Library, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';

import { CCC_PURPLE } from '../../utils/constants';
const CCC_PURPLE_DARK = '#4A1F6E';

export default function AuthGate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (authError) {
      // Surface the Supabase error message directly — it's user-friendly
      setError(authError.message);
      return;
    }
    // On success: onAuthStateChange fires SIGNED_IN → setSession in authStore
    // → App.tsx re-renders and shows SidebarLayout. No manual redirect needed.
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1E1030 0%, #2D1A4A 50%, #1a0d2e 100%)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Left Panel: Branding ──────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative purple orbs */}
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: `radial-gradient(circle, ${CCC_PURPLE}33 0%, transparent 70%)`,
          top: '-100px', left: '-100px', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: `radial-gradient(circle, ${CCC_PURPLE}22 0%, transparent 70%)`,
          bottom: '-50px', right: '-50px', pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '400px' }}>
          {/* Logo */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: `linear-gradient(135deg, ${CCC_PURPLE} 0%, #8B4DBF 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: `0 16px 40px ${CCC_PURPLE}55`,
          }}>
            <Library size={40} color="#fff" />
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '8px', lineHeight: 1.2 }}>
            LibLog
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
            Library Management System
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px 24px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Calauan Community College<br />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                Authorized Librarian Access Only
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ───────────────────────────────────────── */}
      <div style={{
        width: '480px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: 'rgba(255,255,255,0.03)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ width: '100%' }}>
          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              Welcome back
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
              Sign in to access the Librarian Dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="librarian@ccc.edu.ph"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                />
                {/* Show/hide password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                background: isLoading
                  ? `${CCC_PURPLE}99`
                  : `linear-gradient(135deg, ${CCC_PURPLE} 0%, ${CCC_PURPLE_DARK} 100%)`,
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.15s, transform 0.1s',
                boxShadow: `0 8px 24px ${CCC_PURPLE}55`,
                fontFamily: 'inherit',
                marginTop: '4px',
              }}
              onMouseEnter={e => {
                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              {isLoading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                : 'Sign In to LibLog'
              }
            </button>
          </form>

          {/* Footer note */}
          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            LibLog — Calauan Community College © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}
