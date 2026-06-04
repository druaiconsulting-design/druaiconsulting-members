import { ReactNode, useState, useEffect } from 'react'
import TopNav from './TopNav'
import Sidebar from './Sidebar'

interface MemberLayoutProps {
  children: ReactNode
  currentPath: string
}

const TOPNAV_H  = 60
const SIDEBAR_W = 264
const COLLAPSED = 64

export default function MemberLayout({ children, currentPath }: MemberLayoutProps) {
  const [collapsed,       setCollapsed]       = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 768)

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

  const effectiveMargin = isMobile ? 0 : collapsed ? COLLAPSED : SIDEBAR_W

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

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
          top: TOPNAV_H,
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

        {/* ── Main content area ── */}
        <main
          style={{
            position: 'absolute',
            top: 0,
            left: effectiveMargin,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#07192e',
            transition: 'left 0.25s ease',
          }}
        >
          <div className="dru-page-enter" key={currentPath} style={{ minHeight: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
