import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { navigate } from '../../lib/router'
import { supabase } from '../../lib/supabaseClient'
import LevelBadge from './LevelBadge'
import MemberAvatar from '../community/MemberAvatar'
import MemberProfile from './MemberProfile'
import { useCommunityLevels, levelStyle, type LevelTier } from '../../lib/communityLevels'

interface LeaderboardRow {
  id:              string
  full_name:       string
  photo_url:       string | null
  community_level: string
  pathway_stage:   string
  clarity_points:  number
  tier:            string
  all_time_rank:   number
  weekly_points:   number
  weekly_rank:     number
}

// =============================================================================
// HOW DO POINTS WORK — modal
// =============================================================================
function HowPointsWorkModal({ onClose }: { onClose: () => void }) {
  const levels = useCommunityLevels()
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,35,66,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', padding: '32px', position: 'relative', boxShadow: '0 24px 64px rgba(10,35,66,0.2)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1EFE8', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'rgba(10,35,66,0.45)', lineHeight: 1 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E8E4DF'; (e.currentTarget as HTMLButtonElement).style.color = '#0A2342'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F1EFE8'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(10,35,66,0.45)'; }}
        >×</button>

        {/* Title */}
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: '700', color: '#0A2342', marginBottom: '24px', paddingRight: '40px' }}>
          How do points work?
        </div>

        {/* Earn points section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: '700', color: 'rgba(10,35,66,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
            Earn Clarity Points™
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { action: 'Create a post',          pts: '+5 pts', desc: 'Share a win, question, resource, or challenge with the community.' },
              { action: 'Write a comment',         pts: '+2 pts', desc: 'Engage and respond to posts in the feed.' },
              { action: 'Receive a heart',         pts: '+1 pt',  desc: 'Every heart your post or comment receives earns you a point.' },
            ].map(item => (
              <div key={item.action} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#FAFAF8', border: '1px solid #E8E4DF', borderRadius: '8px', padding: '12px 14px' }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: '700', color: '#B8941F', background: '#FFFBEE', padding: '2px 8px', borderRadius: '4px', flexShrink: 0, marginTop: '1px' }}>{item.pts}</span>
                <div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: '700', color: '#0A2342', marginBottom: '2px' }}>{item.action}</div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', color: 'rgba(10,35,66,0.5)', lineHeight: '1.5' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)', marginBottom: '24px' }} />

        {/* Levels section */}
        <div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: '700', color: 'rgba(10,35,66,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
            Community Levels
          </div>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: 'rgba(10,35,66,0.55)', lineHeight: '1.6', marginBottom: '14px' }}>
            As you earn Clarity Points™ you advance through community levels. Your level badge is displayed on every post and on the leaderboard.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {levels.map((level, i) => {
              const s = levelStyle(level.name, levels)
              return (
                <div key={level.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 12px', border: '1px solid #E8E4DF', borderRadius: '8px', background: '#FAFAF8' }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color }}>{level.name}</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', color: 'rgba(10,35,66,0.4)', fontWeight: '600' }}>
                    {level.min === 0 ? '0 pts' : `${level.min.toLocaleString()} pts`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LEADERBOARD
// =============================================================================
export default function Leaderboard() {
  const { profile } = useAuth()
  const userId = profile?.id ?? ''

  const [view,             setView]             = useState<'weekly' | 'alltime'>('weekly')
  const [rows,             setRows]             = useState<LeaderboardRow[]>([])
  const [myData,           setMyData]           = useState<LeaderboardRow | null>(null)
  const [myRowBelowTop10,  setMyRowBelowTop10]  = useState<LeaderboardRow | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [showHowPoints,    setShowHowPoints]    = useState(false)

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('community_leaderboard').select('*')
      if (!data) { setLoading(false); return }
      const all = data as LeaderboardRow[]
      const sorted = view === 'weekly'
        ? [...all].sort((a, b) => a.weekly_rank - b.weekly_rank)
        : [...all].sort((a, b) => a.all_time_rank - b.all_time_rank)
      setRows(sorted.slice(0, 10))
      const me = all.find(r => r.id === userId)
      setMyData(me ?? null)
      if (me) {
        const rank = view === 'weekly' ? me.weekly_rank : me.all_time_rank
        setMyRowBelowTop10(rank > 10 ? me : null)
      } else {
        setMyRowBelowTop10(null)
      }
      setLoading(false)
    }
    load()
  }, [view, userId])

  // ── Personal stats helpers ────────────────────────────────────────────────
  const levels          = useCommunityLevels()
  const communityLevel  = myData?.community_level ?? 'Connected'
  const clarityPts      = myData?.clarity_points  ?? 0
  const safeIdx         = Math.max(0, levels.findIndex(l => l.name === communityLevel))
  const currentLevel    = levels[safeIdx]
  const nextLevel       = levels[safeIdx + 1] ?? null
  const pointsToNext    = nextLevel ? Math.max(0, nextLevel.min - clarityPts) : 0
  const progressPct     = nextLevel
    ? Math.min(100, ((clarityPts - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100

  // ── Row helpers ───────────────────────────────────────────────────────────
  const getRowRank = (r: LeaderboardRow) => view === 'weekly' ? r.weekly_rank  : r.all_time_rank
  const getRowPts  = (r: LeaderboardRow) => view === 'weekly' ? r.weekly_points : r.clarity_points
  const medal      = (n: number) => n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : null

  const renderRow = (row: LeaderboardRow, isMe: boolean) => {
    const rank = getRowRank(row)
    const pts  = getRowPts(row)
    return (
      <div
        key={row.id}
        style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? '32px 1fr 80px' : '40px 1fr 120px', alignItems: 'center', gap: typeof window !== 'undefined' && window.innerWidth < 768 ? '8px' : '12px', padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '12px 10px' : '16px 20px', background: isMe ? '#FFFBEE' : '#FFFFFF', borderBottom: '1px solid #F0EDE8', borderLeft: isMe ? '3px solid #D4AF37' : '3px solid transparent', transition: 'background 0.15s ease' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = isMe ? '#FFF8E1' : '#FAFAF8' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isMe ? '#FFFBEE' : '#FFFFFF' }}
      >
        <div style={{ textAlign: 'center', fontFamily: "'Montserrat', sans-serif", fontWeight: '700', fontSize: rank <= 3 ? '18px' : '13px', color: 'rgba(10,35,66,0.3)' }}>
          {medal(rank) ?? rank}
        </div>
        <button
          onClick={() => setSelectedMemberId(row.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
        >
          <MemberAvatar firstName={row.full_name.split(' ')[0] || row.full_name} photoUrl={row.photo_url ?? undefined} size={44} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: '600', color: '#0A2342', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                {row.full_name}{isMe ? ' (you)' : ''}
              </span>
              <LevelBadge level={row.community_level} />
            </div>
          </div>
        </button>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: '700', color: '#0A2342' }}>{pts?.toLocaleString() ?? '—'}</div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', color: 'rgba(10,35,66,0.4)' }}>
            {view === 'weekly' ? 'this week' : 'Clarity Points™'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '60vh', padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '20px 12px 80px' : '40px 24px 80px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/feed')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: '600', color: 'rgba(10,35,66,0.45)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.5px', marginBottom: '20px', padding: 0, transition: 'color 0.15s ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#0A2342' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(10,35,66,0.45)' }}
        >← Community Feed</button>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ color: '#B8941F', fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '3px', fontWeight: '600', marginBottom: '8px' }}>
            DRU AI LEADERSHIP ECOSYSTEM™
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontFamily: "'Cinzel', serif", color: '#0A2342', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: '700', letterSpacing: '0.5px', lineHeight: '1.2', margin: 0 }}>
                Clarity Points™ Leaderboard
              </h1>
              <p style={{ color: 'rgba(10,35,66,0.45)', fontFamily: "'Montserrat', sans-serif", fontSize: '14px', marginTop: '8px', marginBottom: 0 }}>
                Earn points by posting, commenting, and engaging with the community.
              </p>
            </div>
            <div style={{ display: 'flex', background: '#F1EFE8', borderRadius: '8px', padding: '3px', gap: '2px', alignSelf: 'flex-start', flexShrink: 0 }}>
              {(['weekly', 'alltime'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px', background: view === v ? '#FFFFFF' : 'transparent', color: view === v ? '#0A2342' : 'rgba(10,35,66,0.4)', boxShadow: view === v ? '0 1px 3px rgba(10,35,66,0.1)' : 'none', transition: 'all 0.15s ease' }}>
                  {v === 'weekly' ? 'This Week' : 'All-Time'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)', marginBottom: '28px' }} />

        {/* ── Personal stats card ─────────────────────────────────────────── */}
        {myData && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(10,35,66,0.08)' }}>

            {/* Gold accent strip — rounded top to match card without overflow:hidden */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #D4AF37, #B8941F, #D4AF37)', borderRadius: '16px 16px 0 0' }} />

            <div style={{ padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '16px 14px 20px' : '28px 32px 32px' }}>

              {/* Top row: avatar + name/level hero */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>

                {/* Avatar with gold ring + rank badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '108px', height: '108px', borderRadius: '50%', border: '4px solid #D4AF37', padding: '3px', background: '#fff', boxShadow: '0 0 0 3px rgba(212,175,55,0.15)' }}>
                    <MemberAvatar firstName={myData.full_name.split(' ')[0] || myData.full_name} photoUrl={myData.photo_url ?? undefined} size={100} />
                  </div>
                  {myData.weekly_rank > 0 && (
                    <div style={{ position: 'absolute', bottom: 2, right: 2, width: '30px', height: '30px', borderRadius: '50%', background: '#0A2342', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(10,35,66,0.3)' }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: '800', color: '#D4AF37' }}>#{myData.weekly_rank}</span>
                    </div>
                  )}
                </div>

                {/* Name + Level name as HERO */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: '8px' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: '500', color: 'rgba(10,35,66,0.5)', marginBottom: '4px' }}>
                    {myData.full_name}
                  </div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: '26px', fontWeight: '700', color: '#B8941F', lineHeight: '1.1', marginBottom: '6px' }}>
                    {communityLevel}
                  </div>
                  {nextLevel ? (
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: 'rgba(10,35,66,0.5)', fontWeight: '500' }}>
                      {pointsToNext} points to level up
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', color: '#B8941F', fontWeight: '700', letterSpacing: '0.5px' }}>
                      MAX LEVEL ✦
                    </div>
                  )}
                  {/* Rank chips */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F7F5EE', border: '1px solid #E8E4DF', borderRadius: '6px', padding: '4px 10px' }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', color: 'rgba(10,35,66,0.4)', fontWeight: '600', letterSpacing: '0.3px' }}>THIS WEEK</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: '800', color: '#0A2342' }}>#{myData.weekly_rank || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F7F5EE', border: '1px solid #E8E4DF', borderRadius: '6px', padding: '4px 10px' }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', color: 'rgba(10,35,66,0.4)', fontWeight: '600', letterSpacing: '0.3px' }}>ALL-TIME</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: '800', color: '#0A2342' }}>#{myData.all_time_rank || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {nextLevel && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: '700', color: 'rgba(10,35,66,0.4)', letterSpacing: '0.3px' }}>YOUR PROGRESS</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: '700', color: '#B8941F' }}>{Math.round(progressPct)}%</span>
                  </div>
                  <div style={{ height: '10px', background: '#F1EFE8', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #D4AF37, #B8941F)', borderRadius: '999px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontFamily: "'Montserrat', sans-serif", fontSize: '10px', color: 'rgba(10,35,66,0.35)', fontWeight: '600' }}>
                    <span>{currentLevel.name} · {currentLevel.min} pts</span>
                    <span>{nextLevel.name} · {nextLevel.min} pts</span>
                  </div>
                </div>
              )}

              {/* Level progression track */}
              <div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: '700', color: 'rgba(10,35,66,0.4)', letterSpacing: '0.5px', marginBottom: '14px' }}>COMMUNITY LEVELS</div>
                <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 'max-content', gap: 0 }}>
                    {levels.map((level, i) => {
                      const isUnlocked = safeIdx >= i
                      const isCurrent  = level.name === communityLevel
                      return (
                        <div key={level.name} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isCurrent ? '#0A2342' : isUnlocked ? '#D4AF37' : '#F1EFE8', border: `2px solid ${isCurrent ? '#0A2342' : isUnlocked ? '#D4AF37' : '#E0DDD7'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isCurrent ? '0 0 0 3px rgba(212,175,55,0.2)' : 'none' }}>
                              {!isUnlocked
                                ? <span style={{ color: 'rgba(10,35,66,0.2)', fontSize: '13px' }}>🔒</span>
                                : isCurrent
                                  ? <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D4AF37', display: 'block' }} />
                                  : <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>✓</span>
                              }
                            </div>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: isCurrent ? '800' : '500', color: isCurrent ? '#0A2342' : isUnlocked ? '#B8941F' : 'rgba(10,35,66,0.3)', whiteSpace: 'nowrap', textAlign: 'center' }}>
                              {level.name}
                            </span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', color: isCurrent ? 'rgba(10,35,66,0.5)' : 'rgba(10,35,66,0.25)', whiteSpace: 'nowrap', fontWeight: isCurrent ? '700' : '400' }}>
                              {level.min === 0 ? '0 pts' : `${level.min} pts`}
                            </span>
                          </div>
                          {i < levels.length - 1 && (
                            <div style={{ width: '36px', height: '2px', background: isUnlocked && !isCurrent ? '#D4AF37' : isUnlocked ? 'rgba(212,175,55,0.35)' : '#E0DDD7', margin: '17px 0 0', flexShrink: 0 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Leaderboard table ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowHowPoints(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: '600', color: 'rgba(10,35,66,0.4)', letterSpacing: '0.3px', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#0A2342' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(10,35,66,0.4)' }}
          >How do points work? →</button>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(10,35,66,0.06)', marginBottom: '16px' }}>

          {/* Table — no header row, cleaner like Circle */}
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: '72px', background: '#FFF', borderBottom: '1px solid #F0EDE8', animation: 'ccShimmer 1.5s ease infinite', animationDelay: `${i * 100}ms` }} />
              ))
            : rows.length === 0
              ? <div style={{ padding: '48px 20px', textAlign: 'center', fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: 'rgba(10,35,66,0.35)' }}>No members ranked yet — start posting to earn Clarity Points™</div>
              : rows.map(row => renderRow(row, row.id === userId))
          }

          {!loading && myRowBelowTop10 && (
            <>
              <div style={{ padding: '6px 20px', background: '#F5F3EF', borderTop: '1px dashed #E8E4DF' }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: '600', color: 'rgba(10,35,66,0.4)', letterSpacing: '0.5px' }}>YOUR RANK</span>
              </div>
              {renderRow(myRowBelowTop10, true)}
            </>
          )}
        </div>

        {/* Points legend */}
        <div style={{ padding: '14px 20px', background: '#FAFAF8', border: '1px solid #E8E4DF', borderRadius: '10px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: '600', color: 'rgba(10,35,66,0.4)', letterSpacing: '0.5px', flexShrink: 0 }}>EARN POINTS:</span>
          {[
            { action: 'Post created',    pts: '+5 pts' },
            { action: 'Comment written', pts: '+2 pts' },
            { action: 'Heart received',  pts: '+1 pt'  },
          ].map(item => (
            <div key={item.action} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', color: 'rgba(10,35,66,0.55)' }}>{item.action}</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: '700', color: '#B8941F', background: '#FFFBEE', padding: '1px 6px', borderRadius: '4px' }}>{item.pts}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Member profile modal */}
      {selectedMemberId && (
        <MemberProfile
          profileUserId={selectedMemberId}
          viewerUserId={userId}
          isAdmin={false}
          onClose={() => setSelectedMemberId(null)}
        />
      )}

      {/* How do points work modal */}
      {showHowPoints && <HowPointsWorkModal onClose={() => setShowHowPoints(false)} />}
    </div>
  )
}
