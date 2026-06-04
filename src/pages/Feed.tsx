import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, profileAvatar, profileInitials } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string
  title: string | null
  content: string
  post_type: string | null
  category: string | null
  tier_required: string | null
  agent_id: string | null
  agent_name: string | null
  user_id: string | null
  published_at: string
  is_pinned: boolean
  pdf_url: string | null
  image_url: string | null
}

interface PostAuthor {
  id: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  picture: string | null
  tier: string | null
  community_level: string | null
}

interface ReactionData {
  count: number
  userReacted: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  announcement: { bg: 'rgba(212,175,55,0.18)', color: '#D4AF37' },
  discussion:   { bg: 'rgba(10,35,66,0.08)', color: '#2D5A8E' },
  win:          { bg: 'rgba(72,187,120,0.18)',  color: '#68d391' },
  question:     { bg: 'rgba(194,24,91,0.18)',   color: '#e8759b' },
}

const CATEGORY_LABELS: Record<string, string> = {
  announcement: 'Announcement',
  discussion:   'Discussion',
  win:          'Win 🎉',
  question:     'Question',
}

// Agent color — derive from name
function agentColor(name: string): string {
  const colors = ['#D4AF37', '#8AA4C8', '#68d391', '#e8759b', '#a78bfa', '#fb923c']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ─── Avatar components ────────────────────────────────────────────────────────

function AgentBubble({ name }: { name: string }) {
  const color = agentColor(name)
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}33, ${color}22)`,
      border: `2px solid ${color}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color,
    }}>
      {initials}
    </div>
  )
}

function MemberBubble({ author }: { author: PostAuthor | null }) {
  const av = author?.photo_url || author?.picture || null
  const init = author
    ? ((author.first_name?.[0] || '') + (author.last_name?.[0] || '')).toUpperCase() || '?'
    : '?'
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'linear-gradient(135deg, #1e3d6e, #0A2342)',
      border: '2px solid rgba(212,175,55,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#D4AF37',
    }}>
      {av ? <img src={av} alt={init} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : init}
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post, author, reactions, commentCount, onReact, onCommentClick,
}: {
  post: Post
  author: PostAuthor | null
  reactions: ReactionData
  commentCount: number
  onReact: (postId: string) => void
  onCommentClick: (postId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isAgent = !!post.agent_name
  const authorName = isAgent
    ? post.agent_name!
    : author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Member' : 'Member'

  const catKey  = (post.category || post.post_type || '').toLowerCase()
  const catStyle = CATEGORY_COLORS[catKey] || { bg: 'rgba(255,255,255,0.06)', color: '#8AA4C8' }
  const catLabel = CATEGORY_LABELS[catKey] || catKey || 'Post'

  const CHAR_LIMIT = 280
  const needsTrunc = post.content.length > CHAR_LIMIT
  const displayContent = needsTrunc && !expanded
    ? post.content.slice(0, CHAR_LIMIT) + '…'
    : post.content

  return (
    <article style={{
      background: '#ffffff',
      border: `1px solid ${post.is_pinned ? 'rgba(212,175,55,0.5)' : 'rgba(10,35,66,0.1)'}`,
      borderRadius: 12,
      padding: '18px 20px',
      marginBottom: 12,
      transition: 'border-color 0.15s',
    }}>
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
          fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600,
          color: '#B8941F', letterSpacing: '0.08em',
        }}>
          <span>📌</span> PINNED
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        {isAgent
          ? <AgentBubble name={post.agent_name!} />
          : <MemberBubble author={author} />
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#0A2342',
            }}>
              {authorName}
            </span>
            {isAgent && (
              <span style={{
                padding: '1px 7px', borderRadius: 20, background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.25)',
                fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 600,
                color: 'rgba(212,175,55,0.8)', letterSpacing: '0.08em',
              }}>
                AI AGENT
              </span>
            )}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#8898A4', marginLeft: 'auto' }}>
              {timeAgo(post.published_at)}
            </span>
          </div>

          {/* Category chip */}
          <div style={{ marginTop: 4 }}>
            <span style={{
              padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              fontFamily: 'Montserrat, sans-serif',
              background: catStyle.bg, color: catStyle.color,
            }}>
              {catLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <div style={{
          fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600,
          color: '#0A2342', marginBottom: 8, lineHeight: 1.4,
        }}>
          {post.title}
        </div>
      )}

      {/* Content */}
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#2D3748',
        lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {displayContent}
        {needsTrunc && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              marginLeft: 6, background: 'none', border: 'none', padding: 0,
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600,
              color: '#B8941F', cursor: 'pointer',
            }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden' }}>
          <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }} />
        </div>
      )}

      {/* Actions row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(10,35,66,0.08)' }}>
        {/* Heart */}
        <button
          onClick={() => onReact(post.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8,
            background: reactions.userReacted ? 'rgba(194,24,91,0.15)' : 'transparent',
            border: `1px solid ${reactions.userReacted ? 'rgba(194,24,91,0.4)' : 'transparent'}`,
            fontFamily: 'Inter, sans-serif', fontSize: 13,
            color: reactions.userReacted ? '#C2185B' : '#6B7A8D',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 15 }}>{reactions.userReacted ? '❤️' : '🤍'}</span>
          {reactions.count > 0 && <span>{reactions.count}</span>}
        </button>

        {/* Comment */}
        <button
          onClick={() => onCommentClick(post.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid transparent',
            fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A8D',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>
    </article>
  )
}

// ─── Compose Box ──────────────────────────────────────────────────────────────

const MEMBER_CATEGORIES = ['Discussion', 'Win', 'Question']

function ComposeBox({ onSubmit }: { onSubmit: (content: string, category: string) => Promise<void> }) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Discussion')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const av      = profileAvatar(profile)
  const initials = profileInitials(profile)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    await onSubmit(content.trim(), category.toLowerCase())
    setContent('')
    setCategory('Discussion')
    setOpen(false)
    setSubmitting(false)
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(10,35,66,0.12)',
      borderRadius: 12, padding: '14px 16px', marginBottom: 20,
    }}>
      {/* Closed state */}
      {!open && (
        <div onClick={() => { setOpen(true); setTimeout(() => textareaRef.current?.focus(), 50) }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg, #1e3d6e, #0A2342)',
            border: '2px solid rgba(212,175,55,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#D4AF37',
          }}>
            {av ? <img src={av} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9BABB7' }}>
            Share something with the community…
          </div>
          <button style={{
            padding: '6px 14px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.5)',
            borderRadius: 8, fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600,
            color: '#D4AF37', cursor: 'pointer',
          }}>
            Post
          </button>
        </div>
      )}

      {/* Open state */}
      {open && (
        <div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share a win, ask a question, or start a discussion…"
            rows={4}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#0A2342',
              lineHeight: 1.7, resize: 'none', padding: 0, marginBottom: 14,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Category selector */}
            <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {MEMBER_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '4px 12px', borderRadius: 20,
                  fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: category === cat ? 'rgba(212,175,55,0.15)' : 'rgba(10,35,66,0.06)',
                  border: `1px solid ${category === cat ? 'rgba(212,175,55,0.4)' : 'rgba(10,35,66,0.15)'}`,
                  color: category === cat ? '#B8941F' : '#4A5568',
                  transition: 'all 0.15s',
                }}>
                  {cat}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} style={{
              padding: '7px 14px', borderRadius: 8,
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#6B7A8D',
              cursor: 'pointer', background: 'transparent', border: '1px solid rgba(10,35,66,0.15)',
            }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!content.trim() || submitting} style={{
              padding: '7px 18px', borderRadius: 8,
              background: content.trim() ? 'linear-gradient(135deg, #D4AF37, #c9a62e)' : 'rgba(212,175,55,0.2)',
              border: 'none', fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700,
              color: content.trim() ? '#0A2342' : 'rgba(212,175,55,0.4)',
              cursor: content.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
            }}>
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTERS = [
  { label: 'All',           value: 'all' },
  { label: 'Announcements', value: 'announcement' },
  { label: 'Discussions',   value: 'discussion' },
  { label: 'Wins',          value: 'win' },
  { label: 'Questions',     value: 'question' },
]

// ─── Main Feed Component ──────────────────────────────────────────────────────

export default function Feed() {
  const { user, profile, isAccelerator } = useAuth()

  const [posts,       setPosts]       = useState<Post[]>([])
  const [authors,     setAuthors]     = useState<Record<string, PostAuthor>>({})
  const [reactions,   setReactions]   = useState<Record<string, ReactionData>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('all')

  // ── Fetch posts ─────────────────────────────────────────────────────────────
  const loadFeed = async () => {
    setLoading(true)

    let query = supabase
      .from('community_posts')
      .select('*')
      .eq('is_active', true)
      .eq('is_flagged', false)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50)

    // Gate accelerator-only posts for navigators
    if (!isAccelerator) {
      query = query.or('tier_required.is.null,tier_required.eq.navigator')
    }

    const { data: postsData, error } = await query
    if (error || !postsData) { setLoading(false); return }

    setPosts(postsData as Post[])

    // ── Fetch author profiles for member posts ────────────────────────────
    const memberUserIds = [...new Set(
      postsData.filter((p) => p.user_id && !p.agent_name).map((p) => p.user_id as string)
    )]
    if (memberUserIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, photo_url, picture, tier, community_level')
        .in('id', memberUserIds)
      if (profileData) {
        const map: Record<string, PostAuthor> = {}
        profileData.forEach((p) => { map[p.id] = p as PostAuthor })
        setAuthors(map)
      }
    }

    // ── Fetch reactions ───────────────────────────────────────────────────
    const postIds = postsData.map((p) => p.id)
    if (postIds.length > 0) {
      const { data: rxData } = await supabase
        .from('community_reactions')
        .select('post_id, member_id, reaction_type')
        .in('post_id', postIds)
        .eq('reaction_type', 'heart')

      const rxMap: Record<string, ReactionData> = {}
      postIds.forEach((id) => { rxMap[id] = { count: 0, userReacted: false } })
      if (rxData) {
        rxData.forEach((r) => {
          if (!rxMap[r.post_id]) rxMap[r.post_id] = { count: 0, userReacted: false }
          rxMap[r.post_id].count++
          if (r.member_id === user?.id) rxMap[r.post_id].userReacted = true
        })
      }
      setReactions(rxMap)

      // ── Fetch comment counts ───────────────────────────────────────────
      const { data: commentData } = await supabase
        .from('community_comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_active', true)

      const cMap: Record<string, number> = {}
      postIds.forEach((id) => { cMap[id] = 0 })
      if (commentData) {
        commentData.forEach((c) => { cMap[c.post_id] = (cMap[c.post_id] || 0) + 1 })
      }
      setCommentCounts(cMap)
    }

    setLoading(false)
  }

  useEffect(() => { loadFeed() }, [isAccelerator])

  // ── Submit new post ─────────────────────────────────────────────────────────
  const handleSubmitPost = async (content: string, category: string) => {
    if (!user || !profile) return
    await supabase.from('community_posts').insert({
      user_id: user.id,
      content,
      category,
      post_type: 'member',
      is_active: true,
      is_flagged: false,
      is_pinned: false,
      published_at: new Date().toISOString(),
    })
    await loadFeed()
  }

  // ── Toggle heart reaction ───────────────────────────────────────────────────
  const handleReact = async (postId: string) => {
    if (!user) return
    const current = reactions[postId] || { count: 0, userReacted: false }

    // Optimistic update
    setReactions((prev) => ({
      ...prev,
      [postId]: {
        count: current.userReacted ? current.count - 1 : current.count + 1,
        userReacted: !current.userReacted,
      },
    }))

    if (current.userReacted) {
      await supabase.from('community_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('member_id', user.id)
        .eq('reaction_type', 'heart')
    } else {
      await supabase.from('community_reactions')
        .insert({ post_id: postId, member_id: user.id, reaction_type: 'heart' })
    }
  }

  // ── Filter posts ────────────────────────────────────────────────────────────
  const filteredPosts = filter === 'all'
    ? posts
    : posts.filter((p) => {
        const cat = (p.category || p.post_type || '').toLowerCase()
        return cat === filter
      })

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 24px 48px', maxWidth: 720, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 600,
          color: '#0A2342', marginBottom: 4,
        }}>
          Community Feed
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7A8D' }}>
          What's happening in the DRU AI Leadership Ecosystem™
        </p>
      </div>

      {/* Compose box */}
      <ComposeBox onSubmit={handleSubmitPost} />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{
            padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: filter === f.value ? 600 : 400,
            color: filter === f.value ? '#0A2342' : '#4A5568',
            background: filter === f.value ? '#D4AF37' : 'rgba(10,35,66,0.06)',
            border: filter === f.value ? 'none' : '1px solid rgba(10,35,66,0.15)',
            transition: 'all 0.15s',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{
            width: 32, height: 32, border: '2px solid rgba(212,175,55,0.2)',
            borderTopColor: '#D4AF37', borderRadius: '50%',
            animation: 'dru-spin 0.8s linear infinite',
          }} />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{
          background: '#f0ede4', border: '1px dashed rgba(212,175,55,0.4)',
          borderRadius: 12, padding: '48px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#D4AF37', marginBottom: 8 }}>
            {filter === 'all' ? 'No posts yet' : `No ${filter}s yet`}
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A8D' }}>
            Be the first to post in this community.
          </div>
        </div>
      ) : (
        filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={post.user_id ? (authors[post.user_id] || null) : null}
            reactions={reactions[post.id] || { count: 0, userReacted: false }}
            commentCount={commentCounts[post.id] || 0}
            onReact={handleReact}
            onCommentClick={() => {/* Day 2b: comment thread expand */}}
          />
        ))
      )}
    </div>
  )
}
