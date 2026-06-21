import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AI_ARSENAL_CATEGORIES } from '../data/aiArsenalData'
import ToolCategoryModal from '../components/resources/ToolCategoryModal'
import { NAVIGATOR_PAYMENT_LINK, ACCELERATOR_PAYMENT_LINK } from './community/types'

// ─── Upgrade gate (free tier) ───────────────────────────────────────────────

function UpgradeGate() {
  return (
    <div style={{ padding: '36px 24px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{
        background: '#fff', border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 16, padding: '40px 32px', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 22,
        }}>
          🧰
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#0A2342', margin: '0 0 10px' }}>
          AI Arsenal is a Navigator + Accelerator perk
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(10,35,66,0.55)', lineHeight: 1.7, margin: '0 0 28px' }}>
          The full curated tool library — categories, recommendations, and quick-start guidance — unlocks the moment you join Navigator or Accelerator.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={NAVIGATOR_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" style={{
            padding: '13px 22px', background: '#0A2342', color: '#fff', borderRadius: 8,
            fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Navigator — $97/mo
          </a>
          <a href={ACCELERATOR_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" style={{
            padding: '13px 22px', background: '#C2185B', color: '#fff', borderRadius: 8,
            fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Accelerator — $197/mo
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Category card ──────────────────────────────────────────────────────────

function CategoryCard({ title, description, imageFile, onClick }: { title: string; description: string; imageFile: string; onClick: () => void }) {
  const [imgError, setImgError] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid rgba(10,35,66,0.08)', borderRadius: 12,
        padding: 0, textAlign: 'left', cursor: 'pointer', overflow: 'hidden',
        transition: 'transform 0.12s, box-shadow 0.12s',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
      }}
    >
      <div style={{
        aspectRatio: '16/9',
        background: imgError || !imageFile
          ? 'linear-gradient(135deg, #0A2342, #1B4D8E)'
          : `#0A2342 url(/${imageFile}) center/cover no-repeat`,
      }}>
        {!imgError && imageFile && (
          <img src={`/${imageFile}`} alt="" style={{ display: 'none' }} onError={() => setImgError(true)} />
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14.5, fontWeight: 700, color: '#0A2342', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, color: 'rgba(10,35,66,0.5)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AIArsenal() {
  const { isPaid } = useAuth()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  if (!isPaid) return <UpgradeGate />

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div style={{ padding: isMobile ? '20px 12px' : '36px 24px', maxWidth: 1140, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 28, borderRadius: 16, overflow: 'hidden' }}>
        <img
          src="/arsenal-banner.png"
          alt="AI Arsenal"
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      {/* Pinned intro post */}
      <div style={{
        background: '#fff', border: '1px solid rgba(10,35,66,0.08)', borderRadius: 12,
        padding: '22px 24px', marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📌</span>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, fontWeight: 700, color: '#0A2342', margin: 0 }}>
            Before You Dive In
          </h2>
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'rgba(10,35,66,0.7)', lineHeight: 1.75 }}>
          <p style={{ margin: '0 0 12px' }}>
            This is a reference, not a checklist. You don't need every tool here — you need the right one for the problem in front of you right now. Come in with a specific need, find what solves it, and get back to building.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Most tools listed have a free plan or trial, so you can try before you commit. Some categories overlap on purpose — different tools fit different working styles, and there's rarely a single "right" answer.
          </p>
          <p style={{ margin: 0, fontStyle: 'italic', color: 'rgba(10,35,66,0.45)', fontSize: 12.5 }}>
            Disclosure: some links in this library are affiliate links. We may earn a small commission if you make a purchase, at no extra cost to you.
          </p>
        </div>
      </div>

      {/* Category grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {AI_ARSENAL_CATEGORIES.map(cat => (
          <CategoryCard
            key={cat.id}
            title={cat.title}
            description={cat.description}
            imageFile={cat.imageFile}
            onClick={() => setActiveCategory(cat.id)}
          />
        ))}
      </div>

      {activeCategory && (
        <ToolCategoryModal
          categoryId={activeCategory}
          onClose={() => setActiveCategory(null)}
          onNavigate={setActiveCategory}
        />
      )}
    </div>
  )
}
