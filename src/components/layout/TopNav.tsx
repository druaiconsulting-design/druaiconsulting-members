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
      <style>{`
        :root { --members-topnav-h: 100px; }
        .dru-members-nav-scroll::-webkit-scrollbar { display: none; }
        .dru-members-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .dru-members-nav-link {
          padding: 5px 13px;
          border-radius: 6px;
          font-family: 'Montserrat', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #8AA4C8;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
          scroll-snap-align: start;
        }
        .dru-members-nav-link.active {
          font-weight: 600;
          color: #D4AF37;
          background: rgba(212,175,55,0.1);
        }
        .dru-members-nav-link:hover { color: #D4AF37; }
        .dru-members-logo-full { display: block; }
        .dru-members-logo-shield { display: none; }
        @media (max-width: 768px) {
          :root { --members-topnav-h: 64px; }
          .dru-members-header { height: 64px !important; }
          .dru-members-logo-full { display: none !important; }
          .dru-members-logo-shield { display: block !important; }
          .dru-members-nav-link { font-size: 11px; padding: 5px 8px; }
          .dru-members-tier-badge { display: none; }
        }
      `}</style>

      <header className="dru-members-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 100,
        background: '#0A2342',
        borderBottom: '1px solid rgba(212,175,55,0.18)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px', zIndex: 100,
        overflow: 'hidden',
      }}>

        {/* Sidebar toggle — matches AdminTopNav panel icon exactly */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'transparent', border: 'none',
            color: '#EDE8DB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'color 0.15s, background 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#D4AF37' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#EDE8DB' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>

        {/* Logo — replaces "DRU AI CONSULTING™" text */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 4px', display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
        >
          {/* Full logo — desktop only */}
          <img
            src="/new-dru-clear-transparent-logo.png"
            alt="DRU CLEAR™"
            className="dru-members-logo-full"
            style={{ height: 100, width: 'auto', objectFit: 'contain', display: 'block' }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.style.display = 'none'
              const fallback = img.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'inline'
            }}
          />
          {/* Fallback text if image fails */}
          <span style={{
            display: 'none',
            fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 700,
            color: '#D4AF37', letterSpacing: '0.15em', whiteSpace: 'nowrap',
          }}>
            DRU AI CONSULTING™
          </span>
          {/* Mobile logo — transparent PNG, sized to fit 64px bar */}
          <img
            src="/new-dru-clear-transparent-logo.png"
            alt="DRU CLEAR™"
            className="dru-members-logo-shield"
            style={{ height: 56, width: 'auto', maxWidth: 160, objectFit: 'contain' }}
          />
        </button>

        {/* Center nav — scrollable, centered */}
        <nav
          className="dru-members-nav-scroll"
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflowX: 'auto', overflowY: 'hidden',
            height: '100%', gap: 2,
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity',
          }}
        >
          {NAV_LINKS.map((link) => {
            if (link.acceleratorOnly && tier !== 'accelerator') return null
            const active = isActive(link.path)
            return (
              <button
                key={link.path}
                className={`topnav-link dru-members-nav-link${active ? ' active' : ''}`}
                onClick={() => navigate(link.path)}
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

          {/* Avatar + dropdown — profile pic enlarged to 42px */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setAvatarMenuOpen(o => !o); setNotifOpen(false) }}
              title={displayName}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: avatar ? 'transparent' : 'linear-gradient(135deg, #1e3d6e 0%, #0A2342 100%)',
                border: '2px solid rgba(212,175,55,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 700,
                color: '#D4AF37', overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                transition: 'border-color 0.15s',
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
                  position: 'absolute', top: 50, right: 0,
                  background: '#0f2d52', border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 10, padding: '6px', minWidth: 210, zIndex: 150,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>

                  {/* Profile info with larger avatar preview */}
                  <div style={{
                    padding: '10px 10px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    {/* Larger avatar in dropdown */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: avatar ? 'transparent' : 'linear-gradient(135deg, #1e3d6e 0%, #0A2342 100%)',
                      border: '2px solid rgba(212,175,55,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Montserrat, sans-serif', fontSize: 16, fontWeight: 700,
                      color: '#D4AF37', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {avatar
                        ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initials || '?'}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: '#EDE8DB' }}>
                        {displayName}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8AA4C8', marginTop: 2 }}>
                        {profile?.email || ''}
                      </div>
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
          <div
            className="dru-members-tier-badge"
            style={{
              padding: '4px 11px', borderRadius: 20,
              background: tierBadge.bg, color: tierBadge.color, border: tierBadge.border,
              fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
            }}
          >
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
