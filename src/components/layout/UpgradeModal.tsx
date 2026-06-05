import { useState, useEffect } from 'react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  tierName: string
  price: string
}

export default function UpgradeModal({ isOpen, onClose, url, tierName, price }: UpgradeModalProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) setLoading(true)
  }, [isOpen, url])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10, 35, 66, 0.88)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201,
        width: 'min(700px, calc(100vw - 32px))',
        height: 'min(800px, calc(100vh - 80px))',
        background: '#0A2342',
        borderRadius: 16,
        border: '1px solid rgba(212,175,55,0.3)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(212,175,55,0.18)',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
              color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              DRU AI CONSULTING™
            </div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 15, fontWeight: 600,
              color: '#EDE8DB', marginTop: 3,
            }}>
              Upgrade to {tierName} — {price}/mo
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8AA4C8', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* iframe container */}
        <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: '#0A2342',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16, zIndex: 1,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid rgba(212,175,55,0.2)',
                borderTopColor: '#D4AF37',
                animation: 'upgradeModalSpin 0.8s linear infinite',
              }} />
              <div style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 13,
                color: '#8AA4C8', letterSpacing: '0.03em',
              }}>
                Loading secure checkout...
              </div>
            </div>
          )}

          <iframe
            src={url}
            onLoad={() => setLoading(false)}
            style={{
              width: '100%', height: '100%',
              border: 'none',
              opacity: loading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
            title={`Upgrade to ${tierName}`}
          />
        </div>

        {/* Footer trust line */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid rgba(212,175,55,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#8AA4C8" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8AA4C8',
          }}>
            Secure checkout · Founding member pricing locked forever
          </span>
        </div>
      </div>

      <style>{`
        @keyframes upgradeModalSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
