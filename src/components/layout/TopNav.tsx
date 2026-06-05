import { useState, useEffect } from 'react'
import { useAuth, profileDisplayName, profileAvatar, profileInitials } from '../../context/AuthContext'
import { navigate } from '../../lib/router'
import { supabase } from '../../lib/supabaseClient'
import UpgradeModal from './UpgradeModal'
import SearchModal from './SearchModal'
import NotificationsPanel from './NotificationsPanel'

interface TopNavProps {
  currentPath: string
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

const NAV_LINKS = [
  { label: 'Home',           path: '/' },
  { label: 'Community',      path: '/feed' },
  { label: 'Courses',        path: '/courses' },
  { label: 'Monthly Videos', path: '/videos',  acceleratorOnly: true },
  { label: 'Leaderboard',    path: '/leaderboard' },
  { label: 'Support',        path: '/support' },
]

const NAVIGATOR_URL   = 'https://link.druaiconsulting.com/payment-link/69ead3017dd3512d920794b0'
const ACCELERATOR_URL = 'https://link.druaiconsulting.com/payment-link/69ead3d37dd3512d920794b1'

type UpgradeState = { isOpen: boolean; url: string; tierName: string; price: string }
const MODAL_CLOSED: UpgradeState = { isOpen: false, url: '', tierName: '', price: '' }

export default function TopNav({ currentPath, sidebarCollapsed, onToggleSidebar }: TopNavProps) {
  const { profile, signOut } = useAuth()
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [signOutError,   setSignOutError]   = useState(false)
  const [upgradeModal,   setUpgradeModal]   = useState<UpgradeState>(MODAL_CLOSED)
  const [searchOpen,     setSearchOpen]     = useState(false)
  const [notifOpen,      setNotifOpen]      = useState(false)
  const [unreadCount,    setUnreadCount]    = useState(0)

  // Fetch unread notification count on mount
  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('community_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))
  }, [profile?.id])

  // ── Tier ────────────────────────────────────────────────────
  const tier = (profile?.tier ?? 'free') as 'accelerator' | 'navigator' | 'free'

  const tierBadge = (() => {
    switch (tier) {
      case 'accelerator':
        return { label: 'Accelerator', bg: '#D4AF37',    color: '#0A2342', border: 'none' }
      case 'navigator':
        return { label: 'Navigator',   bg: 'transparent', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.6)' }
      default:
        return { label: 'Free Member', bg: 'transparent', color: '#8AA4C8', border: '1px solid rgba(138,164,200,0.4)' }
    }
  })()

  // ── Helpers ──────────────────────────────────────────────────
  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  const displayName = profileDisplayName(profile)
  const avatar      = profileAvatar(profile)
  const initials    = profileInitials(profile)

  const openUpgrade = (type: 'navigator' | 'accelerator') => {
    setAvatarMenuOpen(false)
    setUpgradeModal(
      type === 'navigator'
        ? { isOpen: true, url: NAVIGATOR_URL,   tierName: 'Navigator',   price: '$97'  }
        : { isOpen: true, url: ACCELERATOR_URL, tierName: 'Accelerator', price: '$197' }
    )
  }

  const handleSignOut = async () => {
    try {
      setSignOutError(false)
      await signOut()
      setAvatarMenuOpen(false)
    } catch {
      setSignOutError(true)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 60,
        background: '#0A2342',
        borderBottom: '1px solid rgba(212,175,55,0.18)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', zIndex: 100,
      }}>

        {/* Sidebar toggle */}
        <button
          className="icon-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#8AA4C8', flexShrink: 0, transition: 'all 0.15s',
          }}
        >
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
        <button
          onClick={() => navigate('/')}
          style={{
            fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 700, color: '#D4AF37',
            letterSpacing: '0.15em', whiteSpace: 'nowrap', flexShrink: 0, padding: '0 4px',
          }}
        >
          DRU AI CONSULTING™
        </button>

        {/* Center nav */}
        <nav style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {NAV_LINKS.map((link) => {
            if (link.acceleratorOnly && tier !== 'accelerator') return null
            const active = isActive(link.path)
            return (
              <button
                key={link.path}
                className="topnav-link"
                onClick={() => navigate(link.path)}
                style={{
                  padding: '5px 13px', borderRadius: 6,
                  fontFamily: 'Montserrat, sans-serif', fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#D4AF37' : '#8AA4C8',
                  background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </button>
            )
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Search */}
          <button
            className="icon-btn"
            onClick={() => setSearchOpen(true)}
            title="Search"
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#8AA4C8', transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={() => { setNotifOpen(o => !o); setAvatarMenuOpen(false) }}
              title="Notifications"
              style={{
                width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#8AA4C8', position: 'relative', transition: 'all 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {/* Unread badge */}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#C2185B',
                  border: '1.5px solid #0A2342',
                }} />
              )}
            </button>

            <NotificationsPanel
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              onUnreadChange={setUnreadCount}
            />
          </div>

          {/* Avatar + dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setAvatarMenuOpen(o => !o); setNotifOpen(false) }}
              title={displayName}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: avatar ? 'transparent' : 'linear-gradient(135deg, #1e3d6e 0%, #0A2342 100%)',
                border: '2px solid rgba(212,175,55,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
                color: '#D4AF37', overflow: 'hidden', flexShrink: 0,
              }}
            >
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
                  borderRadius: 10, padding: '6px', minWidth: 210, zIndex: 150,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>

                  {/* Profile info */}
                  <div style={{
                    padding: '8px 10px 10px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4,
                  }}>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: '#EDE8DB' }}>
                      {displayName}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8AA4C8', marginTop: 2 }}>
                      {profile?.email || ''}
                    </div>
                  </div>

                  {/* Nav links */}
                  {[
                    { label: 'My Profile', path: '/profile',    icon: '👤' },
                    { label: 'Start Here', path: '/start-here', icon: '🏁' },
                  ].map((item) => (
                    <button
                      key={item.path}
                      className="sidebar-nav-item"
                      onClick={() => { navigate(item.path); setAvatarMenuOpen(false) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                        padding: '8px 10px', borderRadius: 7,
                        fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#8AA4C8',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <span>{item.icon}</span><span>{item.label}</span>
                    </button>
                  ))}

                  {/* ── Free → Nav + Acc ── */}
                  {tier === 'free' && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '6px 0 2px' }} />
                      <div style={{ padding: '4px 10px 6px' }}>
                        <div style={{
                          fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
                          color: '#8AA4C8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
                        }}>
                          Upgrade Your Access
                        </div>
                        <button
                          onClick={() => openUpgrade('navigator')}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 7, marginBottom: 6,
                            background: 'transparent', border: '1px solid rgba(212,175,55,0.5)',
                            fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600,
                            color: '#D4AF37', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span>Join Navigator</span>
                          <span style={{ fontSize: 11, opacity: 0.75 }}>$97/mo</span>
                        </button>
                        <button
                          onClick={() => openUpgrade('accelerator')}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 7,
                            background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                            border: 'none',
                            fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
                            color: '#0A2342', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span>Join Accelerator</span>
                          <span style={{ fontSize: 11, opacity: 0.7 }}>$197/mo</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Navigator → Accelerator ── */}
                  {tier === 'navigator' && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '6px 0 2px' }} />
                      <div style={{ padding: '4px 10px 6px' }}>
                        <button
                          onClick={() => openUpgrade('accelerator')}
                          style={{
                            width: '100%', padding: '9px 10px', borderRadius: 7,
                            background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                            border: 'none',
                            fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
                            color: '#0A2342', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span>Upgrade to Accelerator</span>
                          <span style={{ fontSize: 11, opacity: 0.7 }}>$197/mo</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Sign out */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '4px 0' }} />

                  {signOutError && (
                    <div style={{
                      padding: '4px 10px 2px',
                      fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#C2185B',
                    }}>
                      Sign out failed — please try again.
                    </div>
                  )}

                  <button
                    className="sidebar-nav-item"
                    onClick={handleSignOut}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 7,
                      fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#C2185B',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
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

      {/* Search modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal(MODAL_CLOSED)}
        url={upgradeModal.url}
        tierName={upgradeModal.tierName}
        price={upgradeModal.price}
      />
    </>
  )
}
