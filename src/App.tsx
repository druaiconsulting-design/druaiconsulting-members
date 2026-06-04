import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { navigate } from './lib/router'
import Login from './pages/Login'
import Feed from './pages/Feed'
import MemberLayout from './components/layout/MemberLayout'

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #051528 0%, #0A2342 60%, #07192e 100%)',
      gap: 20,
    }}>
      <div style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 16,
        fontWeight: 700,
        color: '#D4AF37',
        letterSpacing: '0.2em',
      }}>
        DRU AI CONSULTING™
      </div>
      <div style={{
        width: 36,
        height: 36,
        border: '2px solid rgba(212,175,55,0.2)',
        borderTopColor: '#D4AF37',
        borderRadius: '50%',
        animation: 'dru-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

// ─── Coming Soon placeholder ──────────────────────────────────────────────────

function ComingSoon({ title, day }: { title: string; day?: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 12,
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 40 }}>🔨</div>
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 22,
        color: '#D4AF37',
      }}>
        {title}
      </div>
      {day && (
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 13,
          color: 'rgba(138,164,200,0.6)',
        }}>
          Scheduled for {day}
        </div>
      )}
    </div>
  )
}

// ─── App / Router ─────────────────────────────────────────────────────────────

export default function App() {
  const { session, loading } = useAuth()
  const [path, setPath] = useState(window.location.pathname)

  // Listen to popstate (fired by navigate() and browser back/forward)
  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  // Auth guard
  useEffect(() => {
    if (loading) return
    if (!session && path !== '/login') {
      navigate('/login')
    } else if (session && path === '/login') {
      navigate('/')
    }
  }, [session, loading, path])

  if (loading) return <LoadingScreen />

  // Public routes (no session required)
  if (!session || path === '/login') return <Login />

  // ── Authenticated page resolver ──────────────────────────────────────────
  const renderPage = () => {
    // Home / Feed
    if (path === '/' || path === '/feed') return <Feed />

    // Start Here — Day 3
    if (path === '/start-here')
      return <ComingSoon title="Start Here" day="Day 3" />

    // Community routes — Day 2
    if (path.startsWith('/community'))
      return <ComingSoon title="Community" day="Day 2" />

    // Courses routes — Day 3–4
    if (path.startsWith('/courses'))
      return <ComingSoon title="Courses" day="Day 3–4" />

    // Monthly Videos — Day 5
    if (path === '/videos' || path.startsWith('/videos/'))
      return <ComingSoon title="Monthly Leadership Lab!" day="Day 5" />

    // Leaderboard — Day 5
    if (path === '/leaderboard')
      return <ComingSoon title="Leaderboard" day="Day 5" />

    // Resources — Day 5
    if (path.startsWith('/resources'))
      return <ComingSoon title="Resources" day="Day 5" />

    // Support — Day 5
    if (path.startsWith('/support'))
      return <ComingSoon title="Support Hub" day="Day 5" />

    // Profile — upcoming
    if (path === '/profile')
      return <ComingSoon title="My Profile" day="Day 6" />

    // 404
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 12,
        color: 'rgba(138,164,200,0.6)',
      }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 20,
          color: '#D4AF37',
        }}>
          Page Not Found
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 20px',
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 8,
            color: '#D4AF37',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 13,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          Back to Feed
        </button>
      </div>
    )
  }

  return (
    <MemberLayout currentPath={path}>
      {renderPage()}
    </MemberLayout>
  )
}
