import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { AI_ARSENAL_CATEGORIES, DIFFICULTY_COLOR, ToolCategory, Tool } from '../../data/aiArsenalData'

interface SummaryBullet { name: string; meta: string; body: string }
interface SummaryPayload { bullets: SummaryBullet[]; quickStart?: string; levelUp?: string }

interface ToolCategoryModalProps {
  categoryId: string
  onClose: () => void
  onNavigate: (categoryId: string) => void
}

// ─── Header icon button ──────────────────────────────────────────────────────

function IconButton({
  children, onClick, title, active, className,
}: { children: React.ReactNode; onClick?: () => void; title?: string; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={className}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: active ? 'rgba(212,175,55,0.18)' : 'rgba(10,35,66,0.06)',
        border: active ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(10,35,66,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#D4AF37' : 'rgba(10,35,66,0.5)',
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      {children}
    </button>
  )
}

// ─── Animated summarize star (spins gently on hover) ───────────────────────

function SummarizeStar({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="currentColor"
      style={{
        transition: 'transform 0.6s ease',
        transform: spinning ? 'rotate(180deg) scale(1.15)' : 'rotate(0deg) scale(1)',
      }}
    >
      <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z" />
      <path d="M19 14l.9 2.8L23 18l-3.1 1.2L19 22l-.9-2.8L15 18l3.1-1.2L19 14z" opacity="0.6" />
    </svg>
  )
}

// ─── Tool entry (full detail view) ───────────────────────────────────────────

function ToolEntry({ tool, isLast }: { tool: Tool; isLast: boolean }) {
  return (
    <div style={{ paddingBottom: isLast ? 0 : 24, marginBottom: isLast ? 0 : 24, borderBottom: isLast ? 'none' : '1px solid rgba(10,35,66,0.08)' }}>
      <h3 style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 16, fontWeight: 700,
        color: '#0A2342', margin: '0 0 6px', letterSpacing: '0.01em',
      }}>
        {tool.name.toUpperCase()}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: DIFFICULTY_COLOR[tool.difficulty], flexShrink: 0 }} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.75)' }}>
          {tool.difficulty} | {tool.pricingModel}
        </span>
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.5)', marginBottom: 6 }}>
        {tool.inputModel}
      </div>

      {tool.url !== '#' && (
        <a href={tool.url} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#1B4D8E', textDecoration: 'none', wordBreak: 'break-all' }}>
          {tool.url}
        </a>
      )}

      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2342', marginBottom: 3 }}>Best for:</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'rgba(10,35,66,0.75)', lineHeight: 1.6 }}>{tool.bestFor}</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2342', marginBottom: 6 }}>Key features:</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {tool.features.map((f, i) => (
            <li key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'rgba(10,35,66,0.75)', lineHeight: 1.7 }}>{f}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 14, paddingLeft: 12, borderLeft: '3px solid #D4AF37' }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2342', marginBottom: 3 }}>Use this when:</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'rgba(10,35,66,0.75)', lineHeight: 1.6 }}>{tool.useWhen}</div>
        {tool.alsoUsedIn && tool.alsoUsedIn.length > 0 && (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, color: 'rgba(10,35,66,0.45)', fontStyle: 'italic', marginTop: 4 }}>
            (Also used in: {tool.alsoUsedIn.join(', ')})
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Summary overlay (matches "Summary of ___" card) ───────────────────────

function SummaryOverlay({
  category, summary, loading, error, onClose,
}: { category: ToolCategory; summary: SummaryPayload | null; loading: boolean; error: string | null; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: '12px 12px 0 12px',
      background: '#fff', borderRadius: 12,
      border: '1px solid rgba(212,175,55,0.35)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      zIndex: 20, display: 'flex', flexDirection: 'column',
      maxHeight: 'calc(100% - 12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px', borderBottom: '1px solid rgba(10,35,66,0.08)', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: 'rgba(10,35,66,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Summary of
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#0A2342' }}>
            {category.title}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(10,35,66,0.4)', padding: 4 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ overflowY: 'auto', padding: '16px 20px 20px' }}>
        {loading && (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'rgba(10,35,66,0.5)', padding: '20px 0', textAlign: 'center' }}>
            Generating summary…
          </div>
        )}
        {error && (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: '#C2185B', padding: '20px 0', textAlign: 'center' }}>
            {error}
          </div>
        )}
        {summary && !loading && (
          <>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, fontStyle: 'italic', color: 'rgba(10,35,66,0.6)', lineHeight: 1.7, margin: '0 0 14px' }}>
              {category.description}
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {summary.bullets.map((b, i) => (
                <li key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'rgba(10,35,66,0.8)', lineHeight: 1.7, marginBottom: 8 }}>
                  <strong style={{ color: '#0A2342' }}>{b.name}</strong>
                  {' — '}<em>{b.meta}</em>{': '}{b.body}
                </li>
              ))}
            </ul>
            {(summary.quickStart || summary.levelUp) && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(10,35,66,0.08)' }}>
                {summary.quickStart && (
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.75)', marginBottom: 6 }}>
                    <strong style={{ color: '#0A2342' }}>Quick Start:</strong> {summary.quickStart}
                  </div>
                )}
                {summary.levelUp && (
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.75)' }}>
                    <strong style={{ color: '#0A2342' }}>Level Up:</strong> {summary.levelUp}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function ToolCategoryModal({ categoryId, onClose, onNavigate }: ToolCategoryModalProps) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [starHover, setStarHover] = useState(false)

  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState<SummaryPayload | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const index = AI_ARSENAL_CATEGORIES.findIndex(c => c.id === categoryId)
  const category: ToolCategory | undefined = AI_ARSENAL_CATEGORIES[index]

  // ── Reset summary panel + load bookmark state on category change ──
  useEffect(() => {
    setShowSummary(false)
    setSummary(null)
    setSummaryError(null)
    if (!user || !category) return
    let active = true
    supabase
      .from('resource_bookmarks')
      .select('id')
      .eq('member_id', user.id)
      .eq('category_id', category.id)
      .maybeSingle()
      .then(({ data }) => { if (active) setBookmarked(!!data) })
    return () => { active = false }
  }, [user, category?.id])

  if (!category) return null

  const hasPrev = index > 0
  const hasNext = index < AI_ARSENAL_CATEGORIES.length - 1

  const toggleBookmark = async () => {
    if (!user || bookmarkLoading) return
    setBookmarkLoading(true)
    try {
      if (bookmarked) {
        await supabase.from('resource_bookmarks').delete().eq('member_id', user.id).eq('category_id', category.id)
        setBookmarked(false)
      } else {
        await supabase.from('resource_bookmarks').insert({ member_id: user.id, category_id: category.id })
        setBookmarked(true)
      }
    } catch {
      // Bookmark is a nice-to-have — never block the read experience on failure
    } finally {
      setBookmarkLoading(false)
    }
  }

  const runSummarize = async () => {
    setShowSummary(true)
    if (summary) return // already loaded for this category
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch('/api/summarize-tool-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ categoryId: category.id }),
      })
      if (!resp.ok) throw new Error()
      const json = await resp.json()
      setSummary(json.summary)
    } catch {
      setSummaryError('Could not generate a summary right now — try again in a moment.')
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,35,66,0.55)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201,
        width: expanded ? 'calc(100vw - 24px)' : 'min(720px, calc(100vw - 24px))',
        height: expanded ? 'calc(100vh - 24px)' : 'min(820px, calc(100vh - 60px))',
        background: '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px 16px', flexShrink: 0, borderBottom: '1px solid rgba(10,35,66,0.08)',
        }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#0A2342', margin: 0 }}>
            {category.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton
              title="Summarize"
              active={showSummary}
              onClick={runSummarize}
            >
              <span onMouseEnter={() => setStarHover(true)} onMouseLeave={() => setStarHover(false)} style={{ display: 'flex' }}>
                <SummarizeStar spinning={starHover} />
              </span>
            </IconButton>

            <IconButton title={bookmarked ? 'Remove bookmark' : 'Bookmark'} active={bookmarked} onClick={toggleBookmark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </IconButton>

            <div style={{ position: 'relative' }}>
              <IconButton title="More" onClick={() => setMenuOpen(o => !o)} active={menuOpen}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                </svg>
              </IconButton>
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0, zIndex: 10, background: '#fff', borderRadius: 10, minWidth: 190,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(10,35,66,0.08)', padding: 6,
                }}>
                  <button
                    onClick={() => { toggleBookmark(); setMenuOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 6, background: 'transparent',
                      border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: '#0A2342',
                    }}
                  >
                    {bookmarked ? 'Remove bookmark' : 'Bookmark this'}
                  </button>
                </div>
              )}
            </div>

            <IconButton title={expanded ? 'Exit full page' : 'Full page'} onClick={() => setExpanded(e => !e)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
              </svg>
            </IconButton>

            <IconButton title="Close" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </IconButton>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px', position: 'relative' }}>
          {showSummary && (
            <SummaryOverlay
              category={category}
              summary={summary}
              loading={summaryLoading}
              error={summaryError}
              onClose={() => setShowSummary(false)}
            />
          )}

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontStyle: 'italic', color: 'rgba(10,35,66,0.6)', lineHeight: 1.7, margin: '0 0 22px' }}>
            {category.description}
          </p>

          {category.tools.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px', fontFamily: 'Inter, sans-serif', fontSize: 13.5,
              color: 'rgba(10,35,66,0.4)', border: '1px dashed rgba(10,35,66,0.15)', borderRadius: 10,
            }}>
              Tools for this category are coming soon.
            </div>
          ) : (
            category.tools.map((tool, i) => (
              <ToolEntry key={tool.name} tool={tool} isLast={i === category.tools.length - 1 && !category.quickStart} />
            ))
          )}

          {(category.quickStart || category.levelUp) && (
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {category.quickStart && (
                <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#D4AF37', marginBottom: 8 }}>💡 QUICK START</div>
                  {category.quickStart.map((s, i) => (
                    <div key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.7)', lineHeight: 1.7 }}>• {s}</div>
                  ))}
                </div>
              )}
              {category.levelUp && (
                <div style={{ background: 'rgba(194,24,91,0.05)', border: '1px solid rgba(194,24,91,0.18)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#C2185B', marginBottom: 8 }}>⚡ LEVEL UP</div>
                  {category.levelUp.map((s, i) => (
                    <div key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.7)', lineHeight: 1.7 }}>• {s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prev / Next */}
        {hasPrev && (
          <button onClick={() => onNavigate(AI_ARSENAL_CATEGORIES[index - 1].id)} title="Previous category" style={navArrowStyle('left')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        )}
        {hasNext && (
          <button onClick={() => onNavigate(AI_ARSENAL_CATEGORIES[index + 1].id)} title="Next category" style={navArrowStyle('right')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>
    </>
  )
}

function navArrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'fixed', top: '50%', [side]: 'max(8px, calc(50vw - 400px))',
    transform: 'translateY(-50%)', zIndex: 202,
    width: 40, height: 40, borderRadius: '50%',
    background: '#fff', border: '1px solid rgba(10,35,66,0.1)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0A2342', cursor: 'pointer',
  } as React.CSSProperties
}
