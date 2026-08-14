
import { useState } from 'react'
import { NAVIGATOR_PAYMENT_LINK, ACCELERATOR_PAYMENT_LINK } from './types'
import UpgradeModal from '../../components/layout/UpgradeModal'
import { useBrandCopy } from '../../lib/brandCopy'

// ── Feature lists ────────────────────────────────────────────────
const NAVIGATOR_FEATURES = [
  'Access to DRU AI Consulting — Community Connection',
  'Daily {POSITIONING} Insights',
  'Framework Micro-Lessons',
  'AI Arsenal — Your Curated Library of 100+ AI Tools',
  'Executive Founder Pricing — Locked In Forever',
]

// First item renders as dash/italic intro line; rest as magenta checkmarks
const ACCELERATOR_FEATURES = [
  'Everything in Navigator, plus:',
  'Today\'s Action Challenge',
  'DeAnna\'s Strategic Edge',
  'Accelerator Circle — Your Exclusive Community with Top-Tier Leaders',
  'Weekly Leadership Deep-Dive — Delivered to You',
  'DeAnna\'s Monthly Leadership Training Lab! Video',
  'Executive Founder Pricing — Locked In Forever',
]

type UpgradeState = { isOpen: boolean; url: string; tierName: string; price: string }
const MODAL_CLOSED: UpgradeState = { isOpen: false, url: '', tierName: '', price: '' }

// =============================================================================
// JOIN PAGE — shown to free-tier users
// =============================================================================
export default function CommunityJoin() {
  const positioning = useBrandCopy('positioning');
  const [upgradeModal, setUpgradeModal] = useState<UpgradeState>(MODAL_CLOSED)

  const openUpgrade = (type: 'navigator' | 'accelerator') => {
    setUpgradeModal(
      type === 'navigator'
        ? { isOpen: true, url: NAVIGATOR_PAYMENT_LINK,   tierName: 'Navigator',   price: '$97'  }
        : { isOpen: true, url: ACCELERATOR_PAYMENT_LINK, tierName: 'Accelerator', price: '$197' }
    )
  }

  return (
    <>
      <div style={{ minHeight: '100dvh', background: '#F9F8F5', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, paddingBottom: '4rem' }}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #0A2342 0%, #0d2d56 50%, #0A2342 100%)',
            borderBottom: '3px solid #D4AF37',
            padding: '3.5rem 1.5rem 3rem',
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 600, height: 300,
              background: 'radial-gradient(ellipse, rgba(194,24,91,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              color: '#C2185B', fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '1rem',
            }}>
              🔥 Founders Special — Limited Time
            </p>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              color: '#FFFFFF', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 700, lineHeight: 1.2,
              maxWidth: 640, margin: '0 auto 1rem',
            }}>
              Join the DRU AI Consulting<br />
              <span style={{ color: '#D4AF37' }}>Community Connection</span>
            </h1>

            <p style={{
              fontFamily: "'Playfair Display', serif",
              color: 'rgba(230,230,230,0.9)',
              fontSize: '1rem', fontStyle: 'italic',
              maxWidth: 480, margin: '0 auto',
            }}>
              A Community of valuable people adding value to others.
            </p>
          </div>

          {/* ── Pricing cards ────────────────────────────────── */}
          <div style={{ padding: '2.5rem 1.5rem', maxWidth: 720, margin: '0 auto' }}>
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              color: '#0A2342', fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              textAlign: 'center', marginBottom: '1.5rem',
            }}>
              Choose Your Path
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Navigator */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(10,35,66,0.07)',
              }}>
                <div style={{
                  background: 'rgba(212,175,55,0.06)',
                  borderBottom: '1px solid rgba(212,175,55,0.2)',
                  padding: '1.25rem 1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <p style={{
                        fontFamily: "'Montserrat', sans-serif",
                        color: '#D4AF37', fontSize: '0.65rem', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.35rem',
                      }}>
                        DRU CLEAR™
                      </p>
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        color: '#0A2342', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem',
                      }}>
                        Navigator
                      </h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", color: '#6B7A8D', fontSize: '0.75rem' }}>
                        Preferred Access
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        fontFamily: "'Playfair Display', serif",
                        color: '#D4AF37', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1,
                      }}>
                        $97
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", color: '#6B7A8D', fontSize: '0.68rem' }}>/month</p>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'rgba(0,0,0,0.3)', fontSize: '0.63rem',
                        textDecoration: 'line-through', marginTop: '0.2rem',
                      }}>
                        normally $167
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {NAVIGATOR_FEATURES.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <span style={{ color: '#D4AF37', fontSize: '0.7rem', marginTop: 3, flexShrink: 0 }}>✓</span>
                        <p style={{ fontFamily: "'Inter', sans-serif", color: '#333333', fontSize: '0.78rem', lineHeight: 1.5 }}>
                          {f.replace('{POSITIONING}', positioning)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => openUpgrade('navigator')}
                    style={{
                      display: 'block', width: '100%',
                      background: 'transparent', border: '1.5px solid #D4AF37',
                      borderRadius: 8, padding: '0.85rem',
                      fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                      fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: '#D4AF37', textAlign: 'center', cursor: 'pointer',
                      boxSizing: 'border-box', transition: 'all 0.15s',
                    }}
                  >
                    Join as Navigator Founder →
                  </button>
                </div>
              </div>

              {/* Accelerator */}
              <div style={{
                background: '#FFFFFF',
                border: '2px solid #C2185B',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(194,24,91,0.12)',
              }}>
                <div style={{
                  background: 'rgba(194,24,91,0.06)',
                  borderBottom: '1px solid rgba(194,24,91,0.2)',
                  padding: '1.25rem 1.5rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#C2185B', borderRadius: 50, padding: '0.3rem 0.75rem' }}>
                      <p style={{
                        fontFamily: "'Montserrat', sans-serif",
                        color: '#FFFFFF', fontSize: '0.6rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
                      }}>
                        Best Value
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <p style={{
                        fontFamily: "'Montserrat', sans-serif",
                        color: '#C2185B', fontSize: '0.65rem', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.35rem',
                      }}>
                        DRU CLEAR™
                      </p>
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        color: '#0A2342', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem',
                      }}>
                        Accelerator
                      </h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", color: '#6B7A8D', fontSize: '0.75rem' }}>
                        Platinum Access & Monthly Training Video
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        fontFamily: "'Playfair Display', serif",
                        color: '#C2185B', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1,
                      }}>
                        $197
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", color: '#6B7A8D', fontSize: '0.68rem' }}>/month</p>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'rgba(0,0,0,0.3)', fontSize: '0.63rem',
                        textDecoration: 'line-through', marginTop: '0.2rem',
                      }}>
                        normally $297
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {ACCELERATOR_FEATURES.map((f, i) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <span style={{
                          color: i === 0 ? 'rgba(0,0,0,0.25)' : '#C2185B',
                          fontSize: '0.7rem', marginTop: 3, flexShrink: 0,
                        }}>
                          {i === 0 ? '—' : '✓'}
                        </span>
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          color: i === 0 ? '#888888' : '#333333',
                          fontSize: '0.78rem', lineHeight: 1.5,
                          fontStyle: i === 0 ? 'italic' : 'normal',
                        }}>
                          {f.replace('{POSITIONING}', positioning)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => openUpgrade('accelerator')}
                    style={{
                      display: 'block', width: '100%',
                      background: '#C2185B', border: 'none',
                      borderRadius: 8, padding: '0.85rem',
                      fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                      fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: '#FFFFFF', textAlign: 'center', cursor: 'pointer',
                      boxSizing: 'border-box', transition: 'all 0.15s',
                    }}
                  >
                    Join as Accelerator Founder →
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom statement box */}
            <div style={{
              marginTop: '2rem', textAlign: 'center',
              padding: '1.75rem 2rem',
              background: '#FFFFFF',
              border: '1px solid rgba(10,35,66,0.1)',
              borderRadius: 14,
              boxShadow: '0 2px 12px rgba(10,35,66,0.06)',
            }}>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                color: '#D4AF37', fontSize: '1.05rem',
                fontStyle: 'italic', fontWeight: 700, marginBottom: '0.75rem',
              }}>
                One is too small of a number.
              </p>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                color: '#0A2342', fontSize: '1.25rem', fontWeight: 700,
                lineHeight: 1.4, marginBottom: '0.85rem',
              }}>
                The Power of the Community is<br />Connection and Collaboration.
              </p>
              <p style={{
                fontFamily: "'Montserrat', sans-serif",
                color: '#D4AF37', fontSize: '0.8rem', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>
                Join us!
              </p>
            </div>

          </div>
        </main>
      </div>

      {/* Upgrade modal — portal-embedded checkout */}
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
