import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { navigate } from '../../lib/router'
import { useAuth } from '../../context/AuthContext'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PostResult {
  id: string
  title: string
  post_type: string | null
  published_at: string
}

interface MemberResult {
  id: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { profile } = useAuth()
  const [query, setQuery]     = useState('')
  const [posts, setPosts]     = useState<PostResult[]>([])
  const [members, setMembers] = useState<MemberResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const tier = (profile?.tier ?? 'free') as string

  // Focus on open, reset on close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60)
      setQuery(''); setPosts([]); setMembers([])
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setPosts([]); setMembers([]); return }
    const t = setTimeout(() => runSearch(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const runSearch = async (q: string) => {
    setLoading(true)
    try {
      // Posts query — tier-filtered
      let postQ = supabase
        .from('community_posts')
        .select('id, title, post_type, published_at')
        .eq('is_active', true)
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order('published_at', { ascending: false })
        .limit(5)

      if (tier === 'navigator') {
        postQ = postQ.or('tier_required.is.null,tier_required.eq.free,tier_required.eq.navigator')
      } else if (tier === 'free') {
        postQ = postQ.or('tier_required.is.null,tier_required.eq.free')
      }
      // accelerator: no extra filter, sees all

      const [{ data: postData }, { data: memberData }] = await Promise.all([
        postQ,
        supabase
          .from('profiles')
          .select('id, first_name, last_name, photo_url')
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
          .limit(4),
      ])

      setPosts(postData ?? [])
      setMembers(memberData ?? [])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const hasResults  = posts.length > 0 || members.length > 0
  const showEmpty   = query.length >= 2 && !loading && !hasResults

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,35,66,0.5)', backdropFilter: 'blur(2px)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 68, left: '50%', transform: 'translateX(-50%)',
        width: 'min(580px, calc(100vw - 32px))',
        background: '#ffffff', borderRadius: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
        border: '1px solid rgba(0,0,0,0.08)',
        zIndex: 201, overflow: 'hidden',
      }}>

        {/* Input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          borderBottom: query.length >= 2 ? '1px solid rgba(0,0,0,0.08)' : 'none',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8AA4C8" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for posts, members, and more"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#0A2342',
              background: 'transparent',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: '#8AA4C8', padding: 4, lineHeight: 0, flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        {query.length < 2 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#DCDCDC" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'block', margin: '0 auto 14px' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#0A2342', marginBottom: 8 }}>
              Search the community
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#8AA4C8', lineHeight: 1.6 }}>
              Try searching for keywords in posts, comments, members, and more...
            </p>
          </div>

        ) : loading ? (
          <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37',
              animation: 'srchSpin 0.7s linear infinite',
            }} />
          </div>

        ) : showEmpty ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#8AA4C8' }}>
              No results for "<strong style={{ color: '#0A2342' }}>{query}</strong>"
            </p>
          </div>

        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>

            {/* Full search row */}
            <div
              onClick={() => { navigate('/feed'); onClose() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px', cursor: 'pointer',
                background: 'rgba(212,175,55,0.05)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8AA4C8" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#0A2342', flex: 1 }}>
                <strong>{query}</strong> — Search for posts, comments, and more
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
                <polyline points="13 17 18 12 13 7"/><line x1="6" y1="12" x2="18" y2="12"/>
              </svg>
            </div>

            {/* Post results */}
            {posts.map(post => (
              <div
                key={post.id}
                onClick={() => { navigate('/feed'); onClose() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9F8F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(212,175,55,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#0A2342',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {post.title}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8AA4C8', marginTop: 2, textTransform: 'capitalize' }}>
                    {post.post_type?.replace(/_/g, ' ') ?? 'Post'}
                  </p>
                </div>
              </div>
            ))}

            {/* Member results */}
            {members.map(member => {
              const name = [member.first_name, member.last_name].filter(Boolean).join(' ')
              const initials = [(member.first_name || '')[0], (member.last_name || '')[0]].filter(Boolean).join('').toUpperCase()
              return (
                <div
                  key={member.id}
                  onClick={() => { navigate('/profile'); onClose() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 16px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9F8F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1e3d6e, #0A2342)',
                    border: '1.5px solid rgba(212,175,55,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {member.photo_url
                      ? <img src={member.photo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>{initials || '?'}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#0A2342' }}>{name || 'Member'}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8AA4C8', marginTop: 1 }}>Member</p>
                  </div>
                </div>
              )
            })}

          </div>
        )}
      </div>

      <style>{`@keyframes srchSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
