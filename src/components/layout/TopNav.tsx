import { useState } from 'react'
import { useAuth, profileDisplayName, profileAvatar, profileInitials } from '../../context/AuthContext'
import { navigate } from '../../lib/router'

interface TopNavProps {
  currentPath: string
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

const NAV_LINKS = [
  { label: 'Home',           path: '/' },
  { label: 'Courses',        path: '/courses' },
  { label: 'Monthly Videos', path: '/videos',      acceleratorOnly: true },
  { label: 'Leaderboard',    path: '/leaderboard' },
  { label: 'Support',        path: '/support' },
]

export default function TopNav({ currentPath, sidebarCollapsed, onToggleSidebar }: TopNavProps) {
  const { profile, isAccelerator, signOut } = useAuth()
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/' || currentPath === '/feed'
    return currentPath.startsWith(path)
  }

  const displayName = profileDisplayName(profile)
  const avatar     = profileAvatar(profile)
  const initials   = profileInitials(profile)

  const tierBadge = isAccelerator
    ? { label: 'Accelerator', bg: '#D4AF37', color: '#0A2342', border: 'none' }
    : { label: 'Navigator',   bg: 'transparent', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.6)' }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 60,
      background: '#0A2342',
      borderBottom: '1px solid rgba(212,175,55,0.18)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', zIndex: 100,
    }}>

      {/* Sidebar toggle */}
      <button className="icon-btn" onClick={onToggleSidebar} style={{
        width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#8AA4C8', fontSize: 16, flexShrink: 0, transition: 'all 0.15s',
      }} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {sidebarCollapsed ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        )}
      </button>

      {/* Logo */}
      <button onClick={() => navigate('/')} style={{
        fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 700, color: '#D4AF37',
        letterSpacing: '0.15em', whiteSpace: 'nowrap', flexShrink: 0, padding: '0 4px',
      }}>
        DRU AI CONSULTING™
      </button>

      {/* Center nav */}
      <nav style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {NAV_LINKS.map((link) => {
          if (link.acceleratorOnly && !isAccelerator) return null
          const active = isActive(link.path)
          return (
            <button key={link.path} className="topnav-link" onClick={() => navigate(link.path)} style={{
              padding: '5px 13px', borderRadius: 6,
              fontFamily: 'Montserrat, sans-serif', fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? '#D4AF37' : '#8AA4C8',
              background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {link.label}
            </button>
          )
        })}
      </nav>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Search */}
        <button className="icon-btn" style={{
          width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#8AA4C8', transition: 'all 0.15s',
        }} title="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        {/* Notifications */}
        <button className="icon-btn" style={{
          width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#8AA4C8', position: 'relative', transition: 'all 0.15s',
        }} title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* Avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setAvatarMenuOpen((o) => !o)} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: avatar ? 'transparent' : 'linear-gradient(135deg, #1e3d6e 0%, #0A2342 100%)',
            border: '2px solid rgba(212,175,55,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
            color: '#D4AF37', overflow: 'hidden', flexShrink: 0,
          }} title={displayName}>
            {avatar
              ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials || '?'}
          </button>

          {avatarMenuOpen && (
            <>
              <div onClick={() => setAvatarMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 149 }} />
              <div style={{
                position: 'absolute', top: 42, right: 0,
                background: '#0f2d52', border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 10, padding: '6px', minWidth: 180, zIndex: 150,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: '#EDE8DB' }}>
                    {displayName}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8AA4C8', marginTop: 2 }}>
                    {profile?.email || ''}
                  </div>
                </div>

                {[
                  { label: 'My Profile', path: '/profile',    icon: '👤' },
                  { label: 'Start Here', path: '/start-here', icon: '🏁' },
                ].map((item) => (
                  <button key={item.path} className="sidebar-nav-item"
                    onClick={() => { navigate(item.path); setAvatarMenuOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 7,
                      fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#8AA4C8',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}>
                    <span>{item.icon}</span><span>{item.label}</span>
                  </button>
                ))}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '4px 0' }} />

                <button className="sidebar-nav-item"
                  onClick={async () => { await signOut(); setAvatarMenuOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 7,
                    fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#C2185B',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}>
                  <span>🚪</span><span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Tier badge */}
        <div style={{
          padding: '4px 11px', borderRadius: 20,
          background: tierBadge.bg, color: tierBadge.color, border: tierBadge.border,
          fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
        }}>
          {tierBadge.label}
        </div>
      </div>
    </header>
  )
}
