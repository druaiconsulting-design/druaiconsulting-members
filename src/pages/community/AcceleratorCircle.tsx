import { useState, useEffect, useCallback } from 'react'
import { useAuth, profileAvatar } from '../../context/AuthContext'
import { supabase, ACCELERATOR_PAYMENT_LINK } from './types'
import type { CommunityPost } from './types'
import ComposeBox from './ComposeBox'
import PostCard from './PostCard'
import MemberAvatar from './MemberAvatar'
import MemberProfile from '../community-engagement/MemberProfile'

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@700&family=Inter:wght@400;500&display=swap');
  @keyframes ccFadeIn  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ccShimmer { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  * { box-sizing: border-box; }
`

interface AccMember {
  id:              string
  first_name:      string | null
  photo_url:       string | null
  community_level: string | null
}

export default function AcceleratorCircle() {
  const { profile, isAccelerator } = useAuth()

  const userId       = profile?.id           ?? ''
  const userName     = profile?.first_name   ?? ''
  const userPhotoUrl = profileAvatar(profile) || profile?.photo_url || undefined

  const [posts,            setPosts]            = useState<CommunityPost[]>([])
  const [memberCount,      setMemberCount]      = useState(0)
  const [memberAvatars,    setMemberAvatars]    = useState<AccMember[]>([])
  const [loading,          setLoading]          = useState(true)
  const [photoMap,         setPhotoMap]         = useState<Record<string, string>>({})
  const [levelMap,         setLevelMap]         = useState<Record<string, string>>({})
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [isAdmin,          setIsAdmin]          = useState(false)

  const loadCircle = useCallback(async () => {
    setLoading(true)

    // 1. Load all Accelerator member profiles
    const { data: accProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, photo_url, community_level')
      .eq('tier', 'accelerator')

    const members = (accProfiles ?? []) as AccMember[]
    setMemberCount(members.length)
    setMemberAvatars(members.slice(0, 5))

    const pm: Record<string, string> = {}
    const lm: Record<string, string> = {}
    members.forEach(m => {
      if (m.photo_url)       pm[m.id] = m.photo_url
      if (m.community_level) lm[m.id] = m.community_level
    })
    setPhotoMap(pm)
    setLevelMap(lm)

    // 2. Check admin
    const { data: sessionData } = await supabase.auth.getSession()
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    setIsAdmin(sessionData?.session?.user?.email?.toLowerCase() === adminEmail?.toLowerCase())

    // 3. Load posts from Accelerator members only
    const accIds = members.map(m => m.id)
    if (accIds.length === 0) { setPosts([]); setLoading(false); return }

    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*')
      .eq('is_active', true)
      .in('agent_id', accIds)
      .order('is_pinned',    { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50)

    setPosts((postsData ?? []) as CommunityPost[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAccelerator) loadCircle()
  }, [isAccelerator, loadCircle])

  // Real-time new posts
  useEffect(() => {
    if (!isAccelerator) return
    const channel = supabase.channel('acc_circle_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
        const newPost = payload.new as CommunityPost
        if (!newPost.is_active) return
        setPosts(prev => prev.find(p => p.id === newPost.id) ? prev : [newPost, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isAccelerator])

  const handleNewPost = useCallback((post: CommunityPost) => {
    setPosts(prev => [post, ...prev])
    if (post.agent_id && profile?.photo_url) {
      setPhotoMap(m => ({ ...m, [post.agent_id]: profile.photo_url! }))
    }
  }, [profile?.photo_url])

  const handlePinChange = useCallback((postId: string, pinned: boolean) => {
    setPosts(prev => {
      const updated = prev.map(p => p.id === postId ? { ...p, is_pinned: pinned } as CommunityPost : p)
      return [...updated].sort((a, b) => {
        const ap = (a as any).is_pinned ? 1 : 0
        const bp = (b as any).is_pinned ? 1 : 0
        if (bp !== ap) return bp - ap
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      })
    })
  }, [])

  // ── NAVIGATOR GATE ─────────────────────────────────────────────────────
  if (!isAccelerator) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{ minHeight: '60vh', padding: '40px 24px 80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 520 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: 20, boxShadow: '0 8px 40px rgba(10,35,66,0.08)', overflow: 'hidden', textAlign: 'center' }}>
              <div style={{ height: 4, background: 'linear-gradient(90deg, #D4AF37, #B8941F, #D4AF37)' }} />
              <div style={{ padding: '44px 36px 48px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '2px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>⚡</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '3px', color: '#B8941F', marginBottom: 10 }}>ACCELERATOR ONLY</div>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: '#0A2342', lineHeight: 1.2, margin: '0 0 14px' }}>Accelerator Circle</h2>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: 'rgba(10,35,66,0.55)', lineHeight: 1.75, margin: '0 auto 28px', maxWidth: 400 }}>
                  A private space for Accelerator members — advanced strategy, peer accountability, and high-level leadership conversations.
                </p>
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent)', marginBottom: 28 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 32 }}>
                  {[
                    'Access to the exclusive Accelerator Circle community',
                    'Monthly Leadership Lab! video content',
                    'Weekly Accelerator Framework PDF',
                    "DeAnna's Strategic Edge insights",
                    "Today's Action Challenge — daily accountability",
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: 'rgba(10,35,66,0.6)' }}>
                      <span style={{ color: '#D4AF37', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <a href={ACCELERATOR_PAYMENT_LINK} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)', color: '#0A2342', fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', padding: '14px 32px', borderRadius: 10, textDecoration: 'none', marginBottom: 12, boxShadow: '0 4px 16px rgba(212,175,55,0.25)' }}>
                  Upgrade to Accelerator — $197/mo
                </a>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: 'rgba(10,35,66,0.35)' }}>Cancel anytime · Instant access</div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── ACCELERATOR VIEW ───────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: '100%', background: '#FAFAF8' }}>
        <main style={{ padding: '40px 24px 80px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: 28, animation: 'ccFadeIn 0.5s ease both' }}>
              <div style={{ color: '#B8941F', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '3px', fontWeight: 600, marginBottom: 8 }}>
                DRU AI LEADERSHIP ECOSYSTEM™
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={{ fontFamily: "'Cinzel', serif", color: '#0A2342', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.2, margin: 0 }}>
                    ⚡ Accelerator Circle
                  </h1>
                  <p style={{ color: 'rgba(10,35,66,0.45)', fontFamily: "'Montserrat', sans-serif", fontSize: 14, marginTop: 8, marginBottom: 0 }}>
                    Your exclusive inner circle — deeper conversations, bigger wins, higher-level leaders.
                  </p>
                </div>

                {/* Member count + overlapping avatars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {memberAvatars.map((m, i) => (
                      <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: memberAvatars.length - i, borderRadius: '50%', border: '2px solid #FAFAF8' }}>
                        <MemberAvatar firstName={m.first_name || '?'} photoUrl={m.photo_url ?? undefined} size={32} />
                      </div>
                    ))}
                  </div>
                  {memberCount > 0 && (
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(10,35,66,0.55)' }}>
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)', marginBottom: 28 }} />

            {/* Welcome card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: 16, boxShadow: '0 2px 12px rgba(10,35,66,0.06)', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: 4, background: 'linear-gradient(90deg, #D4AF37, #B8941F, #D4AF37)' }} />
              <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #B8941F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⚡</div>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: '#0A2342', marginBottom: 2 }}>Welcome to the Circle</div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: 'rgba(10,35,66,0.45)' }}>Accelerator Members Only</div>
                  </div>
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: 'rgba(10,35,66,0.6)', lineHeight: 1.75, margin: 0 }}>
                  This is your inner circle. Ask deeper questions, share bigger wins, and connect with fellow Accelerator leaders who are serious about AI-powered transformation. The conversations that happen here go beyond the feed.
                </p>
              </div>
            </div>

            {/* Three value cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { icon: '🤝', title: 'Peer Accountability',  desc: 'Connect with leaders at your level. Share challenges, celebrate wins.' },
                { icon: '🧠', title: 'Deeper Strategy',       desc: 'Go beyond basics. This is where real transformation conversations happen.' },
                { icon: '🚀', title: 'Accelerate Together',   desc: 'Your peers are your competitive advantage. Use this space.' },
              ].map(card => (
                <div key={card.title} style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(10,35,66,0.04)' }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700, color: '#0A2342', marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: 'rgba(10,35,66,0.5)', lineHeight: 1.6 }}>{card.desc}</div>
                </div>
              ))}
            </div>

            {/* Compose box + post feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ComposeBox
                userId={userId}
                userName={userName}
                userPhotoUrl={userPhotoUrl}
                onPostSubmitted={handleNewPost}
              />

              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ background: '#FFF', border: '1px solid #E8E4DF', borderRadius: 12, height: 180, animation: 'ccShimmer 1.5s ease infinite', animationDelay: `${i * 150}ms` }} />
                ))
              ) : posts.length === 0 ? (
                <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: '#0A2342', marginBottom: 8 }}>Be the first to post</div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: 'rgba(10,35,66,0.4)' }}>
                    Start a conversation — your Accelerator Circle is ready.
                  </div>
                </div>
              ) : (
                posts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={i}
                    userId={userId}
                    userName={userName}
                    userPhotoUrl={userPhotoUrl}
                    isAdmin={isAdmin}
                    photoMap={photoMap}
                    levelMap={levelMap}
                    onMemberClick={setSelectedMemberId}
                    onPinChange={handlePinChange}
                  />
                ))
              )}
            </div>

          </div>
        </main>
      </div>

      {selectedMemberId && (
        <MemberProfile
          profileUserId={selectedMemberId}
          viewerUserId={userId}
          isAdmin={false}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </>
  )
}
