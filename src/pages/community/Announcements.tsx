import { navigate } from '../../lib/router'

export default function Announcements() {
  return (
    <div style={{ minHeight: '60vh', padding: '40px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      {/* Back link */}
      <div style={{ width: '100%', maxWidth: 600, marginBottom: 32 }}>
        <button
          onClick={() => navigate('/feed')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(10,35,66,0.45)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.5px', padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#0A2342' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(10,35,66,0.45)' }}
        >
          ← Community Feed
        </button>
      </div>

      {/* Big card */}
      <div style={{ width: '100%', maxWidth: 600, background: '#FFFFFF', borderRadius: 20, boxShadow: '0 8px 40px rgba(10,35,66,0.10)', overflow: 'hidden', position: 'relative' }}>

        {/* Gold accent strip */}
        <div style={{ height: 5, background: 'linear-gradient(90deg, #D4AF37, #B8941F, #D4AF37, #B8941F, #D4AF37)' }} />

        <div style={{ padding: '48px 40px 52px', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
            border: '2px solid rgba(212,175,55,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: 40,
            boxShadow: '0 0 0 8px rgba(212,175,55,0.06)',
          }}>
            📣
          </div>

          {/* Eyebrow */}
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '4px', fontWeight: 600, color: '#B8941F', marginBottom: 12, textTransform: 'uppercase' }}>
            DRU AI LEADERSHIP ECOSYSTEM™
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 700, color: '#0A2342', letterSpacing: '0.5px', lineHeight: 1.2, margin: '0 0 16px' }}>
            Announcements
          </h1>

          {/* Coming soon badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
            color: '#0A2342',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '6px 20px',
            borderRadius: 999,
            marginBottom: 28,
          }}>
            <span>✦</span>
            <span>Coming Soon</span>
            <span>✦</span>
          </div>

          {/* Description */}
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(10,35,66,0.55)', lineHeight: 1.75, maxWidth: 440, margin: '0 auto 32px' }}>
            This space is being prepared for something meaningful. Milestone celebrations, important updates, and exclusive news from the ecosystem will live here.
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)', marginBottom: 28 }} />

          {/* What's coming teaser */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {[
              { icon: '🏆', text: 'Member milestone celebrations' },
              { icon: '⚡', text: 'Ecosystem updates and new features' },
              { icon: '🎯', text: 'Important community news' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#FAFAF8', borderRadius: 10, border: '1px solid #F0EDE8' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: 'rgba(10,35,66,0.6)', fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}
