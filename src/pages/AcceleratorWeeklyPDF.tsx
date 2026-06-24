import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { ACCELERATOR_PAYMENT_LINK } from './community/types'

interface WeeklyPdfRow {
  id: string
  title: string
  week_of: string
  pdf_url: string // storage PATH in the private acc-weekly-pdfs bucket, not a URL
  is_active: boolean
  created_at: string
}

// ─── Upgrade gate (Navigator + free tier — Accelerator only resource) ───────

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
          📋
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#0A2342', margin: '0 0 10px' }}>
          The Weekly PDF is an Accelerator perk
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(10,35,66,0.55)', lineHeight: 1.7, margin: '0 0 28px' }}>
          Each week's leadership deep-dive — with action steps and reflection prompts for the Circle — unlocks the moment you upgrade to Accelerator.
        </p>
        <a href={ACCELERATOR_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" style={{
          padding: '13px 22px', background: '#C2185B', color: '#fff', borderRadius: 8,
          fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none',
          display: 'inline-block',
        }}>
          Upgrade to Accelerator — $197/mo
        </a>
      </div>
    </div>
  )
}

// ─── Shared: fetch a fresh signed URL and open it ───────────────────────────

async function openSignedPdf(path: string, mode: 'view' | 'download', setBusy: (v: string | null) => void) {
  setBusy(path + mode)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`/api/weekly-pdf-url?path=${encodeURIComponent(path)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      window.alert("Couldn't open that file. Try again in a moment.")
      return
    }

    const { url } = await res.json()
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    if (mode === 'download') a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch {
    window.alert("Couldn't open that file. Try again in a moment.")
  } finally {
    setBusy(null)
  }
}

// ─── Current week hero card ───────────────────────────────────────────────

function CurrentPdfCard({ row, busy, setBusy }: { row: WeeklyPdfRow; busy: string | null; setBusy: (v: string | null) => void }) {
  return (
    <div style={{
      background: '#0A2342', borderRadius: 16, padding: '32px 28px',
      marginBottom: 28, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.12em', color: '#D4AF37', marginBottom: 10,
      }}>
        THIS WEEK · {row.week_of.toUpperCase()}
      </div>
      <div style={{
        fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700,
        color: '#fff', marginBottom: 18, lineHeight: 1.3,
      }}>
        {row.title}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => openSignedPdf(row.pdf_url, 'view', setBusy)}
          disabled={busy === row.pdf_url + 'view'}
          style={{
            padding: '12px 20px', background: '#D4AF37', color: '#0A2342', borderRadius: 8,
            border: 'none', cursor: busy ? 'default' : 'pointer',
            fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            opacity: busy === row.pdf_url + 'view' ? 0.6 : 1,
          }}
        >
          {busy === row.pdf_url + 'view' ? 'Opening…' : 'View PDF'}
        </button>
        <button
          onClick={() => openSignedPdf(row.pdf_url, 'download', setBusy)}
          disabled={busy === row.pdf_url + 'download'}
          style={{
            padding: '12px 20px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)', cursor: busy ? 'default' : 'pointer',
            fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            opacity: busy === row.pdf_url + 'download' ? 0.6 : 1,
          }}
        >
          {busy === row.pdf_url + 'download' ? 'Preparing…' : 'Download'}
        </button>
      </div>
    </div>
  )
}

// ─── Archive row ─────────────────────────────────────────────────────────

function ArchiveRow({ row, busy, setBusy }: { row: WeeklyPdfRow; busy: string | null; setBusy: (v: string | null) => void }) {
  return (
    <button
      onClick={() => openSignedPdf(row.pdf_url, 'view', setBusy)}
      disabled={busy === row.pdf_url + 'view'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 16px', background: '#fff', borderRadius: 10,
        border: '1px solid rgba(10,35,66,0.08)', textAlign: 'left',
        cursor: busy ? 'default' : 'pointer', marginBottom: 8,
      }}
    >
      <div>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, fontWeight: 700, color: '#0A2342' }}>
          {row.title}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(10,35,66,0.5)', marginTop: 2 }}>
          {row.week_of}
        </div>
      </div>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11.5, fontWeight: 700, color: '#C2185B', letterSpacing: '0.04em' }}>
        {busy === row.pdf_url + 'view' ? 'OPENING…' : 'VIEW →'}
      </div>
    </button>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function AcceleratorWeeklyPDF() {
  const { isAccelerator } = useAuth()
  const [rows, setRows] = useState<WeeklyPdfRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!isAccelerator) { setLoading(false); return }
    let active = true
    ;(async () => {
      const { data, error: dbError } = await supabase
        .from('weekly_pdfs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (!active) return
      if (dbError) { setError(dbError.message); setLoading(false); return }
      setRows((data as WeeklyPdfRow[]) || [])
      setLoading(false)
    })()
    return () => { active = false }
  }, [isAccelerator])

  if (!isAccelerator) return <UpgradeGate />

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const current = rows[0]
  const archive = rows.slice(1)

  return (
    <div style={{ padding: isMobile ? '20px 12px' : '36px 24px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#0A2342', margin: '0 0 6px' }}>
          Accelerator Weekly PDF
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'rgba(10,35,66,0.55)', margin: 0 }}>
          Your weekly leadership deep-dive — bring it to the Circle.
        </p>
      </div>

      {loading && (
        <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: 'rgba(10,35,66,0.4)', fontSize: 13 }}>
          Loading this week's resource…
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '20px', background: '#fdecea', borderRadius: 10, color: '#c62828', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
          Couldn't load the weekly PDF right now. Please refresh or check back shortly.
        </div>
      )}

      {!loading && !error && !current && (
        <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: 'rgba(10,35,66,0.4)', fontSize: 13 }}>
          Nothing published yet — check back soon.
        </div>
      )}

      {!loading && !error && current && <CurrentPdfCard row={current} busy={busy} setBusy={setBusy} />}

      {!loading && !error && archive.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', color: 'rgba(10,35,66,0.45)', marginBottom: 10,
          }}>
            ARCHIVE
          </div>
          {archive.map(row => <ArchiveRow key={row.id} row={row} busy={busy} setBusy={setBusy} />)}
        </div>
      )}
    </div>
  )
}
