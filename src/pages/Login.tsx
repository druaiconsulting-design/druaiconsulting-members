import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { navigate } from '../lib/router'

type LoadingState = 'google' | 'email' | 'passkey' | 'reset' | null

export default function Login() {
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState<LoadingState>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [resetSent,  setResetSent]  = useState(false)

  // ── Auth handlers ────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading('google')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  const handleEmail = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading('email')
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(error.message); setLoading(null) }
    else navigate('/')
  }

  const handlePasskey = async () => {
    setLoading('passkey')
    setError(null)
    try {
      const { error } = await (supabase.auth as any).signInWithPasskey()
      if (error) { setError(error.message); setLoading(null) }
    } catch {
      setError('Passkey sign-in is not available on this device.')
      setLoading(null)
    }
  }

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter your email address above first, then click Password Reset.')
      return
    }
    setLoading('reset')
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) {
      setError(error.message)
      setLoading(null)
    } else {
      setResetSent(true)
      setLoading(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && loading === null) handleEmail()
  }

  const clearError = () => { if (error) setError(null) }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(30,61,110,0.6) 0%, #0A2342 60%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <img
          src="/dru-clear-logo.png"
          alt="DRU CLEAR™"
          style={{ height: 120, width: 'auto' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>

      {/* Heading block */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 'clamp(24px, 4.5vw, 34px)',
          fontWeight: 700,
          color: '#EDE8DB',
          lineHeight: 1.25,
          margin: '0 0 14px',
          letterSpacing: '-0.01em',
        }}>
          Welcome — Transformation<br />Continues Here
        </h1>

        {/* Animated gold reading sweep — full width, left to right */}
        <div style={{
          width: '100%', height: 2,
          margin: '0 auto 14px',
          borderRadius: 2,
          background: 'rgba(212,175,55,0.18)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            height: '100%', width: '35%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.6) 25%, #D4AF37 50%, #F5D878 55%, #D4AF37 65%, rgba(212,175,55,0.6) 80%, transparent 100%)',
            animation: 'goldRead 1s ease-in-out infinite',
          }} />
        </div>

        {/* Tagline with magenta dots */}
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 11, margin: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, flexWrap: 'wrap',
        }}>
          {['Innovation', 'Effectiveness', 'Integration', 'Performance'].map((word, i, arr) => (
            <span key={word} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#8AA4C8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {word}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: '#C2185B', fontSize: 16, lineHeight: 1, fontWeight: 700 }}>·</span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Form container */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Instruction */}
        <p style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 13, fontStyle: 'italic',
          color: '#D4AF37', textAlign: 'center',
          margin: '0 0 2px',
        }}>
          Use the same email address you used to take the assessment.
        </p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading !== null}
          style={{
            width: '100%', padding: '13px 16px',
            background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#1a1a1a',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            opacity: loading !== null && loading !== 'google' ? 0.55 : 1,
            transition: 'all 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          {loading === 'google' ? (
            <span className="login-spin" style={{
              display: 'inline-block', width: 18, height: 18, borderRadius: '50%',
              border: '2px solid #e0e0e0', borderTopColor: '#4285F4',
            }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Passkey */}
        <button
          onClick={handlePasskey}
          disabled={loading !== null}
          style={{
            width: '100%', padding: '13px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#EDE8DB',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            opacity: loading !== null && loading !== 'passkey' ? 0.55 : 1,
            transition: 'all 0.15s',
          }}
        >
          {loading === 'passkey' ? (
            <span className="login-spin" style={{
              display: 'inline-block', width: 18, height: 18, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#D4AF37',
            }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#D4AF37" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <path d="M12 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>
              <path d="M10.584 16H7l1-4h.01M3.5 12a8.5 8.5 0 1 0 17 0 8.5 8.5 0 0 0-17 0z"/>
            </svg>
          )}
          Sign in with Passkey
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.09)' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8AA4C8', whiteSpace: 'nowrap' }}>
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.09)' }} />
        </div>

        {/* Email */}
        <div>
          <label style={{
            display: 'block', marginBottom: 6,
            fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
            color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError() }}
            onKeyDown={handleKeyDown}
            placeholder="you@example.com"
            disabled={loading !== null}
            autoComplete="email"
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: 8,
              fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#EDE8DB',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Password */}
        <div>
          <label style={{
            display: 'block', marginBottom: 6,
            fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
            color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError() }}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              disabled={loading !== null}
              autoComplete="current-password"
              style={{
                width: '100%', padding: '12px 44px 12px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.11)',
                borderRadius: 8,
                fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#EDE8DB',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
            />
            <button
              onClick={() => setShowPass((s) => !s)}
              title={showPass ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 12,
                top: '50%', transform: 'translateY(-50%)',
                color: '#8AA4C8', padding: 4, lineHeight: 0,
              }}
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(194,24,91,0.1)', border: '1px solid rgba(194,24,91,0.28)',
            fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#e57399', lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        {/* Sign In */}
        <button
          onClick={handleEmail}
          disabled={loading !== null}
          style={{
            width: '100%', padding: '13px 16px',
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
            border: 'none', borderRadius: 10,
            fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 700,
            color: '#0A2342', letterSpacing: '0.06em',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading !== null && loading !== 'email' ? 0.55 : 1,
            marginTop: 4,
            boxShadow: '0 2px 12px rgba(212,175,55,0.25)',
            transition: 'all 0.15s',
          }}
        >
          {loading === 'email' ? (
            <span className="login-spin" style={{
              display: 'inline-block', width: 18, height: 18, borderRadius: '50%',
              border: '2px solid rgba(10,35,66,0.25)', borderTopColor: '#0A2342',
            }} />
          ) : 'Sign In'}
        </button>

        {/* Password Reset */}
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          {resetSent ? (
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#D4AF37',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Check your inbox — a reset link is on its way.
            </span>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={loading !== null}
              style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#8AA4C8',
                textDecoration: 'underline', textDecorationColor: 'rgba(138,164,200,0.4)',
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null && loading !== 'reset' ? 0.4 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
            >
              {loading === 'reset' ? (
                <>
                  <span className="login-spin" style={{
                    display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                    border: '1.5px solid rgba(138,164,200,0.3)', borderTopColor: '#8AA4C8',
                  }} />
                  Sending…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Password Reset
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Copyright */}
      <div style={{
        marginTop: 32,
        fontFamily: 'Inter, sans-serif', fontSize: 11,
        color: 'rgba(138,164,200,0.4)', textAlign: 'center',
      }}>
        © 2026 DRU CLEAR™ · All Rights Reserved · DRU AI Consulting
      </div>

      <style>{`
        @keyframes goldRead {
          0%   { transform: translateX(-100%); opacity: 0; }
          6%   { opacity: 1; }
          68%  { transform: translateX(310%); opacity: 1; }
          82%  { opacity: 0; }
          100% { transform: translateX(-100%); opacity: 0; }
        }
        .login-spin {
          animation: loginSpin 0.75s linear infinite;
        }
        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }
        input[type="email"]::placeholder,
        input[type="password"]::placeholder,
        input[type="text"]::placeholder {
          color: rgba(138,164,200,0.45);
        }
        input[type="email"]:focus,
        input[type="password"]:focus,
        input[type="text"]:focus {
          border-color: rgba(212,175,55,0.45) !important;
          background: rgba(255,255,255,0.09) !important;
        }
      `}</style>
    </div>
  )
}
