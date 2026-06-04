import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { navigate } from '../../lib/router'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  currentPath: string
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavItem {
  icon: string
  label: string
  path: string
  acceleratorOnly?: boolean
  badge?: number | null
}

interface Section {
  heading: string
  items: NavItem[]
  acceleratorOnly?: boolean
}

// ─── Nav structure (mirrors spec exactly) ────────────────────────────────────

const SECTIONS: Section[] = [
  {
    heading: 'WELCOME',
    items: [
      { icon: '👋', label: 'Welcome!',   path: '/' },
      { icon: '🏁', label: 'Start Here', path: '/start-here' },
    ],
  },
  {
    heading: 'COMMUNITY',
    items: [
      { icon: '📰', label: 'Feed',                path: '/' },
      { icon: '📢', label: 'Announcements',        path: '/community/announcements' },
      { icon: '💬', label: 'Discussions',          path: '/community/discussions' },
      { icon: '⚡', label: 'Accelerator Circle',   path: '/community/accelerator', acceleratorOnly: true },
    ],
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function isActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === '/') {
    return currentPath === '/' || currentPath === '/feed'
  }
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CourseProgressBar({ percent }: { percent: number }) {
  return (
    <div style={{ marginTop: 4, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${percent}%`,
        background: 'linear-gradient(90deg, #D4AF37, #e8c44a)',
        borderRadius: 4,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

function LockBadge() {
  return (
    <span style={{
      marginLeft: 'auto',
      fontSize: 11,
      opacity: 0.5,
    }}>
      🔒
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Sidebar({
  collapsed,
  currentPath,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { isAccelerator } = useAuth()

  const SIDEBAR_WIDTH  = 264
  const COLLAPSED_W    = 64
  const w              = collapsed ? COLLAPSED_W : SIDEBAR_WIDTH

  // Mobile: always full-width drawer, desktop: controlled by `collapsed`
  const isMobile      = window.innerWidth < 768

  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 60,
        left: mobileOpen ? 0 : -SIDEBAR_WIDTH,
        width: SIDEBAR_WIDTH,
        height: 'calc(100vh - 60px)',
        transition: 'left 0.25s ease',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: 60,
        left: 0,
        width: w,
        height: 'calc(100vh - 60px)',
        transition: 'width 0.25s ease',
        zIndex: 40,
      }

  // ── Nav item renderer ────────────────────────────────────────────────────
  const renderItem = (item: NavItem, sectionAcceleratorOnly?: boolean) => {
    const locked = (item.acceleratorOnly || sectionAcceleratorOnly) && !isAccelerator
    const active = !locked && isActive(item.path, currentPath)

    return (
      <button
        key={item.path + item.label}
        className={locked ? undefined : 'sidebar-nav-item'}
        onClick={() => {
          if (locked) return
          navigate(item.path)
          if (isMobile) onMobileClose()
        }}
        title={collapsed ? item.label : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '10px 0' : '8px 12px',
          borderRadius: 8,
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 13,
          fontWeight: active ? 600 : 400,
          color: active ? '#D4AF37' : locked ? 'rgba(237,232,219,0.2)' : '#EDE8DB',
          background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
          borderLeft: active ? '2px solid #D4AF37' : '2px solid transparent',
          transition: 'all 0.15s',
          cursor: locked ? 'default' : 'pointer',
          textAlign: 'left',
          flexShrink: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>

        {!collapsed && (
          <>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </span>
            {item.badge != null && item.badge > 0 && (
              <span style={{
                background: '#C2185B',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 20,
                padding: '1px 6px',
                marginLeft: 'auto',
                flexShrink: 0,
              }}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {locked && <LockBadge />}
          </>
        )}
      </button>
    )
  }

  return (
    <aside
      style={{
        ...sidebarStyle,
        background: '#0A2342',
        borderRight: '1px solid rgba(212,175,55,0.12)',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── New Post button ── */}
      <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 12px 8px' }}>
        <button
          className="new-post-btn"
          onClick={() => {
            navigate('/')
            if (isMobile) onMobileClose()
          }}
          title={collapsed ? 'New Post' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: collapsed ? '10px' : '9px 14px',
            borderRadius: 8,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16 }}>✏️</span>
          {!collapsed && <span>New Post</span>}
        </button>
      </div>

      {/* ── Scrollable nav sections ── */}
      <nav style={{ flex: 1, padding: collapsed ? '4px 8px' : '4px 8px', overflowY: 'auto' }}>

        {/* WELCOME + COMMUNITY sections */}
        {SECTIONS.map((section) => (
          <div key={section.heading} style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div style={{
                padding: '10px 12px 4px',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(138,164,200,0.5)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {section.heading}
              </div>
            )}
            {collapsed && <div style={{ height: 8 }} />}

            {section.items.map((item) => renderItem(item, section.acceleratorOnly))}
          </div>
        ))}

        {/* ── COURSES ── */}
        <div style={{ marginBottom: 8 }}>
          {!collapsed && (
            <div style={{
              padding: '10px 12px 4px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(237,232,219,0.5)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              COURSES
            </div>
          )}

          {/* Course item with progress bar */}
          <button
            className="sidebar-nav-item"
            onClick={() => { navigate('/courses'); if (isMobile) onMobileClose() }}
            title={collapsed ? 'From Confusion to Confident with AI™' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: collapsed ? 'center' : 'flex-start',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '10px 0' : '8px 12px',
              borderRadius: 8,
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 13,
              fontWeight: isActive('/courses', currentPath) ? 600 : 400,
              color: isActive('/courses', currentPath) ? '#D4AF37' : '#EDE8DB',
              background: isActive('/courses', currentPath) ? 'rgba(212,175,55,0.15)' : 'transparent',
              borderLeft: isActive('/courses', currentPath) ? '2px solid #D4AF37' : '2px solid transparent',
              transition: 'all 0.15s',
              textAlign: 'left',
              flexShrink: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              flexDirection: collapsed ? 'row' : 'column',
            }}
          >
            {collapsed ? (
              <span style={{ fontSize: 16 }}>🎓</span>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🎓</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}>
                      From Confusion to Confident with AI™
                    </div>
                    <CourseProgressBar percent={0} />
                    <div style={{
                      fontSize: 10,
                      color: 'rgba(212,175,55,0.65)',
                      marginTop: 3,
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      0% complete
                    </div>
                  </div>
                </div>
              </>
            )}
          </button>

          {/* More courses coming soon */}
          {!collapsed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 12,
              color: 'rgba(237,232,219,0.3)',
              fontStyle: 'italic',
            }}>
              <span>➕</span>
              <span>More courses coming soon…</span>
            </div>
          )}
        </div>

        {/* ── ACC MONTHLY VIDEOS (Accelerator only) ── */}
        <div style={{ marginBottom: 8 }}>
          {!collapsed && (
            <div style={{
              padding: '10px 12px 4px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              color: isAccelerator ? 'rgba(212,175,55,0.7)' : 'rgba(237,232,219,0.25)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              ACC MONTHLY VIDEOS
              {!isAccelerator && <span style={{ fontSize: 10 }}>🔒</span>}
            </div>
          )}

          {[
            { icon: '🎥', label: 'Monthly Leadership Lab!', path: '/videos' },
            { icon: '▶️', label: 'Replays',                  path: '/videos/replays' },
          ].map((item) => renderItem({ ...item, acceleratorOnly: true }, true))}
        </div>

        {/* ── RESOURCES ── */}
        <div style={{ marginBottom: 8 }}>
          {!collapsed && (
            <div style={{
              padding: '10px 12px 4px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(237,232,219,0.5)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              RESOURCES
            </div>
          )}
          {[
            { icon: '📄', label: 'Framework Downloads', path: '/resources' },
            { icon: '💡', label: 'AI Insights Archive', path: '/resources/insights' },
            { icon: '🛠️', label: 'Tool Guides',         path: '/resources/tools' },
          ].map((item) => renderItem(item))}
        </div>

        {/* ── SUPPORT ── */}
        <div style={{ marginBottom: 16 }}>
          {!collapsed && (
            <div style={{
              padding: '10px 12px 4px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(237,232,219,0.5)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              SUPPORT
            </div>
          )}
          {[
            { icon: '💬', label: 'Chat with Support', path: '/support' },
            { icon: '✉️', label: 'Email Support',      path: '/support/email' },
          ].map((item) => renderItem(item))}
        </div>
      </nav>

      {/* ── Bottom brand strip ── */}
      {!collapsed && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(212,175,55,0.1)',
          fontFamily: 'Cinzel, serif',
          fontSize: 9,
          color: 'rgba(237,232,219,0.3)',
          letterSpacing: '0.12em',
          textAlign: 'center',
        }}>
          DRU AI LEADERSHIP ECOSYSTEM™
        </div>
      )}
    </aside>
  )
}
