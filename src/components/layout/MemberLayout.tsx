import { ReactNode, useState, useEffect, useRef, useCallback } from 'react'
import TopNav from './TopNav'
import Sidebar from './Sidebar'

interface MemberLayoutProps {
  children: ReactNode
  currentPath: string
}

const TOPNAV_H  = 100
const SIDEBAR_W = 264
const COLLAPSED = 64
const PTR_THRESHOLD = 72   // px to pull before triggering refresh

export default function MemberLayout({ children, currentPath }: MemberLayoutProps) {
  const [collapsed,         setCollapsed]         = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile,          setIsMobile]          = useState(window.innerWidth < 768)
  const [ptrPull,           setPtrPull]           = useState(0)   // 0–PTR_THRESHOLD
  const [ptrRefreshing,     setPtrRefreshing]     = useState(false)

  const touchStartY  = useRef(0)
  const isPulling    = useRef(false)

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(true)
      else setCollapsed(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Pull-to-refresh handlers ──────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    const el = document.getElementById('dru-main-scroll')
    if (!el || el.scrollTop > 0) return   // only trigger when already at top
    touchStartY.current = e.touches[0].clientY
    isPulling.current = true
  }, [isMobile])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isPulling.current || ptrRefreshing) return
    const el = document.getElementById('dru-main-scroll')
    if (!el || el.scrollTop > 0) { isPulling.current = false; return }
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setPtrPull(Math.min(delta * 0.5, PTR_THRESHOLD))
    }
  }, [isMobile, ptrRefreshing])

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !isPulling.current) return
    isPulling.current = false
    if (ptrPull >= PTR_THRESHOLD) {
      setPtrRefreshing(true)
      setPtrPull(PTR_THRESHOLD)
      setTimeout(() => window.location.reload(), 600)
    } else {
      setPtrPull(0)
    }
  }, [isMobile, ptrPull])

  const effectiveMargin = isMobile ? 0 : collapsed ? COLLAPSED : SIDEBAR_W

  return (
    <div
      style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* ── Fixed Top Nav ── */}
      <TopNav
        currentPath={currentPath}
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => {
          if (isMobile) setMobileSidebarOpen((o) => !o)
          else setCollapsed((c) => !c)
        }}
      />

      {/* ── Body row ── */}
      <div
        style={{
          position: 'fixed',
          top: isMobile ? 0 : ('var(--members-topnav-h, 100px)' as any),
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
        }}
      >
        {/* Sidebar */}
        <Sidebar
          collapsed={collapsed}
          currentPath={currentPath}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Mobile overlay behind drawer */}
        {isMobile && mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 45,
            }}
          />
        )}

        {/* ── Pull-to-refresh indicator ── */}
        {isMobile && (ptrPull > 0 || ptrRefreshing) && (
          <div style={{
            position: 'absolute',
            top: 72 + ptrPull - 36,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 60,
            transition: ptrRefreshing ? 'none' : 'top 0.1s ease',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '3px solid #D4AF37',
              borderTopColor: 'transparent',
              animation: ptrRefreshing ? 'spin 0.7s linear infinite' : 'none',
              transform: ptrRefreshing ? undefined : `rotate(${(ptrPull / PTR_THRESHOLD) * 270}deg)`,
              background: '#0A2342',
            }} />
          </div>
        )}

        {/* ── Main content area ── */}
        <main
          id="dru-main-scroll"
          style={{
            position: 'absolute',
            top: 0,
            left: effectiveMargin,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#FAFAF8',
            transition: 'left 0.25s ease',
            paddingTop: isMobile ? 72 + ptrPull : 0,
            paddingBottom: isMobile ? 60 : 0,
          }}
        >
          <div className="dru-page-enter" key={currentPath} style={{ minHeight: '100%' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
