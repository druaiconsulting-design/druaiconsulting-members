import { useAuth } from '../../context/AuthContext'
import { navigate } from '../../lib/router'

const ACCELERATOR_URL = 'https://link.druaiconsulting.com/payment-link/69ead3d37dd3512d920794b1'

export default function AcceleratorCircle() {
  const { profile } = useAuth()
  const tier = (profile?.tier ?? 'free') as string
  const isAccelerator = tier === 'accelerator'

  return (
    <div style={{ minHeight: '60vh', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Back link */}
        <button
          onClick={() => navigate('/feed')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(10,35,66,0.45)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.5px', marginBottom: 20, padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#0A2342' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(10,35,66,0.45)' }}
        >
          ← Community Feed
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '3px', fontWeight: 600, color: '#B8941F', marginBottom: 8 }}>
            DRU AI LEADERSHIP ECOSYSTEM™
          </div>
          <h1 style={{ fontFamily: "'Cinzel', serif", color: '#0A2342', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.2, margin: 0 }}>
            ⚡ Accelerator Circle
          </h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(10,35,66,0.45)', marginTop: 8, marginBottom: 0 }}>
            Your exclusive inner circle — deeper conversations, bigger wins, higher-level leaders.
          </p>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)', marginBottom: 28 }} />

        {isAccelerator ? (
          /* ── ACCELERATOR VIEW ──────────────────────────────────────────── */
          <div>
            {/* Welcome card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: 16, boxShadow: '0 2px 12px rgba(10,35,66,0.06)', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ height: 4, background: 'linear-gradient(90deg, #D4AF37, #B8941F, #D4AF37)' }} />
              <div style={{ padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #B8941F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    ⚡
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700, color: '#0A2342', marginBottom: 4 }}>
                      Welcome to the Circle
                    </div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: 'rgba(10,35,66,0.5)' }}>
                      Accelerator Members Only
                    </div>
                  </div>
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: 'rgba(10,35,66,0.6)', lineHeight: 1.75, margin: 0 }}>
                  This is your inner circle. Ask deeper questions, share bigger wins, and connect with fellow Accelerator leaders who are serious about AI-powered transformation. The conversations that happen here go beyond the feed.
                </p>
              </div>
            </div>

            {/* Community values */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { icon: '🤝', title: 'Peer Accountability', desc: 'Connect with leaders at your level. Share challenges, celebrate wins.' },
                { icon: '🧠', title: 'Deeper Strategy', desc: 'Go beyond basics. This is where real transformation conversations happen.' },
                { icon: '🚀', title: 'Accelerate Together', desc: 'Your peers are your competitive advantage. Use this space.' },
              ].map(card => (
                <div key={card.title} style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(10,35,66,0.04)' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700, color: '#0A2342', marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: 'rgba(10,35,66,0.5)', lineHeight: 1.6 }}>{card.desc}</div>
                </div>
              ))}
            </div>

            {/* Go to feed CTA */}
            <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700, color: '#0A2342', marginBottom: 4 }}>Ready to post?</div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: 'rgba(10,35,66,0.5)' }}>Your Accelerator Circle posts go in the community feed — visible to all members.</div>
              </div>
              <button
                onClick={() => navigate('/feed')}
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700, color: '#0A2342', cursor: 'pointer', flexShrink: 0 }}
              >
                Go to Community Feed →
              </button>
            </div>
          </div>

        ) : (
          /* ── NAVIGATOR UPGRADE GATE ────────────────────────────────────── */
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: 20, boxShadow: '0 8px 40px rgba(10,35,66,0.08)', overflow: 'hidden', textAlign: 'center' }}>
              <div style={{ height: 4, background: 'linear-gradient(90deg, #D4AF37, #B8941F, #D4AF37)' }} />
              <div style={{ padding: '44px 36px 48px' }}>

                {/* Lock icon */}
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '2px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>
                  ⚡
                </div>

                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '3px', color: '#B8941F', marginBottom: 10 }}>ACCELERATOR ONLY</div>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: '#0A2342', lineHeight: 1.2, margin: '0 0 14px' }}>
                  Accelerator Circle
                </h2>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: 'rgba(10,35,66,0.55)', lineHeight: 1.75, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                  A private space for Accelerator members to go deeper — advanced strategy, peer accountability, and high-level leadership conversations.
                </p>

                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent)', marginBottom: 28 }} />

                {/* What you unlock */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 32 }}>
                  {[
                    'Access to the exclusive Accelerator Circle community',
                    'Monthly Leadership Lab! video content',
                    'Weekly Accelerator Framework PDF',
                    'DeAnna\'s Strategic Edge insights',
                    "Today's Action Challenge — daily accountability",
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: 'rgba(10,35,66,0.6)' }}>
                      <span style={{ color: '#D4AF37', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={ACCELERATOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)', color: '#0A2342', fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', padding: '14px 32px', borderRadius: 10, textDecoration: 'none', marginBottom: 12, boxShadow: '0 4px 16px rgba(212,175,55,0.25)' }}
                >
                  Upgrade to Accelerator — $197/mo
                </a>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: 'rgba(10,35,66,0.35)' }}>
                  Cancel anytime · Instant access
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
