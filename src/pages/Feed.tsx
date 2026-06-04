// Day 2 will replace this with real community feed data from Supabase community_comments tables
// For Day 1 this establishes the content area structure

export default function Feed() {
  return (
    <div style={{
      maxWidth: 760,
      margin: '0 auto',
      padding: '32px 24px',
    }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 26,
          fontWeight: 600,
          color: '#EDE8DB',
          marginBottom: 4,
        }}>
          Community Feed
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: 'rgba(138,164,200,0.7)',
        }}>
          What's happening in the DRU AI Leadership Ecosystem™
        </p>
      </div>

      {/* ── Compose box placeholder ── */}
      <div style={{
        background: 'rgba(10,35,66,0.6)',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3d6e, #0A2342)',
          border: '2px solid rgba(212,175,55,0.3)',
          flexShrink: 0,
        }} />
        <div style={{
          flex: 1,
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: 'rgba(138,164,200,0.5)',
        }}>
          Share something with the community…
        </div>
        <button style={{
          padding: '7px 16px',
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 8,
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: '#D4AF37',
          cursor: 'pointer',
        }}>
          Post
        </button>
      </div>

      {/* ── Category filter chips ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        {['All', 'Announcements', 'Discussions', 'Wins', 'Questions'].map((chip, i) => (
          <button
            key={chip}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 12,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? '#0A2342' : 'rgba(138,164,200,0.8)',
              background: i === 0 ? '#D4AF37' : 'rgba(255,255,255,0.05)',
              border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ── Coming Day 2 notice ── */}
      <div style={{
        background: 'rgba(10,35,66,0.4)',
        border: '1px dashed rgba(212,175,55,0.2)',
        borderRadius: 12,
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>📰</div>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 18,
          color: '#D4AF37',
          marginBottom: 8,
        }}>
          Feed Wiring — Day 2
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: 'rgba(138,164,200,0.6)',
          lineHeight: 1.7,
          maxWidth: 380,
          margin: '0 auto',
        }}>
          Post cards, agent posts, and heart/comment interactions will be wired
          to the Supabase <code style={{ color: 'rgba(212,175,55,0.7)', fontSize: 12 }}>community_comments</code> tables in the next session.
        </div>
      </div>
    </div>
  )
}
