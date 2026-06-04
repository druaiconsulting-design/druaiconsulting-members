import { useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── Google "G" icon SVG ──────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

// ─── Input component ──────────────────────────────────────────────────────────

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(212,175,55,0.8)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${focused ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 8,
          padding: '11px 14px',
          color: '#EDE8DB',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          transition: 'border-color 0.15s',
          width: '100%',
        }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Login() {
  const { signInWithEmail, signInWithGoogle } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError(null)
    setLoading(true)
    const { error: err } = await signInWithEmail(email, password)
    setLoading(false)
    if (err) setError(err)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    await signInWithGoogle()
    // Supabase redirects away — spinner stays until redirect
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #051528 0%, #0A2342 45%, #07192e 100%)',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background decorative pattern */}
      <div aria-hidden style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(212,175,55,0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute',
        top: -120,
        right: -120,
        width: 400,
        height: 400,
        borderRadius: '50%',
        border: '1px solid rgba(212,175,55,0.06)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute',
        bottom: -80,
        left: -80,
        width: 280,
        height: 280,
        borderRadius: '50%',
        border: '1px solid rgba(212,175,55,0.05)',
        pointerEvents: 'none',
      }} />

      {/* ── Card ── */}
      <div
        className="dru-page-enter"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(10,35,66,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212,175,55,0.18)',
          borderRadius: 16,
          padding: '40px 36px',
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Gold top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
          borderRadius: '0 0 2px 2px',
        }} />

        {/* ── Brand header ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 14,
            fontWeight: 700,
            color: '#D4AF37',
            letterSpacing: '0.2em',
            marginBottom: 10,
          }}>
            DRU AI CONSULTING™
          </div>

          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 22,
            fontWeight: 600,
            color: '#EDE8DB',
            marginBottom: 8,
            lineHeight: 1.2,
          }}>
            Member Portal
          </div>

          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11,
            color: 'rgba(138,164,200,0.7)',
            letterSpacing: '0.08em',
          }}>
            AI Mastery · Leadership Clarity · Measurable Results
          </div>
        </div>

        {/* ── Google Sign-In ── */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px 16px',
            background: googleLoading ? 'rgba(255,255,255,0.04)' : '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: '#1a1a1a',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            marginBottom: 20,
            opacity: googleLoading ? 0.6 : 1,
          }}
        >
          {googleLoading ? (
            <div style={{
              width: 18,
              height: 18,
              border: '2px solid rgba(0,0,0,0.15)',
              borderTopColor: '#4285F4',
              borderRadius: '50%',
              animation: 'dru-spin 0.7s linear infinite',
            }} />
          ) : (
            <GoogleIcon />
          )}
          <span>{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
        </button>

        {/* ── Divider ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: 'rgba(138,164,200,0.5)',
            letterSpacing: '0.05em',
          }}>
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* ── Email/password form ── */}
        <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(194,24,91,0.15)',
              border: '1px solid rgba(194,24,91,0.4)',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: '#e8759b',
            }}>
              {error}
            </div>
          )}

          {/* Sign In button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading
                ? 'rgba(212,175,55,0.4)'
                : 'linear-gradient(135deg, #D4AF37 0%, #c9a62e 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#0A2342',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(10,35,66,0.3)',
                  borderTopColor: '#0A2342',
                  borderRadius: '50%',
                  animation: 'dru-spin 0.7s linear infinite',
                }} />
                <span>Signing in…</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* ── Not yet a member CTA ── */}
        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: 'rgba(138,164,200,0.7)',
            lineHeight: 1.6,
          }}>
            Not yet a member?{' '}
            <a
              href="https://assessment.druaiconsulting.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#D4AF37',
                fontWeight: 600,
                textDecoration: 'underline',
                textDecorationColor: 'rgba(212,175,55,0.4)',
                textUnderlineOffset: 3,
              }}
            >
              Take the DRU CLEAR™ Assessment
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
