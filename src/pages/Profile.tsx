import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { NotificationPreferences } from './community/types'
import { useCommunityLevels, getLevelInfo } from '../lib/communityLevels'

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsTab = 'profile' | 'notifications' | 'privacy'

interface ProfileData {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  tier: string | null
  pathway_stage: string | null
  clarity_points: number | null
  community_level: string | null
  assessment_score: number | null
  assessment_tier: string | null
  headline: string | null
  bio: string | null
  created_at: string | null
  show_in_directory: boolean | null
  prevent_messaging: boolean | null
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch { return '' }
}

// ─── Shared components ────────────────────────────────────────────────────────

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 32, height: 32,
        border: '2px solid rgba(212,175,55,0.2)',
        borderTopColor: '#D4AF37', borderRadius: '50%',
        animation: 'dru-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

function Avatar({ photoUrl, firstName, lastName, size = 80 }: {
  photoUrl: string | null; firstName: string | null; lastName: string | null; size?: number
}) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  if (photoUrl) {
    return (
      <img src={photoUrl} alt="Profile"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto', border: '2px solid rgba(212,175,55,0.3)' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#0A2342',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Montserrat, sans-serif', fontSize: size * 0.3,
      fontWeight: 700, color: '#D4AF37', margin: '0 auto',
    }}>
      {initials}
    </div>
  )
}

function TierBadge({ tier }: { tier: string | null }) {
  const isAcc = tier === 'accelerator'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 20,
      fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: isAcc ? 'rgba(194,24,91,0.1)' : 'rgba(212,175,55,0.1)',
      color: isAcc ? '#C2185B' : '#B8941F',
      border: isAcc ? '1px solid rgba(194,24,91,0.25)' : '1px solid rgba(212,175,55,0.3)',
    }}>
      ✦ {isAcc ? 'Accelerator' : 'Navigator'}
    </div>
  )
}

function Toggle({ on, onClick, gold = false }: { on: boolean; onClick: () => void; gold?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? (gold ? '#D4AF37' : '#0A2342') : 'rgba(10,35,66,0.12)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ─── Left card (shared across all tabs) ───────────────────────────────────────

function LeftCard({ profile }: { profile: ProfileData }) {
  const levels = useCommunityLevels()
  const points = profile.clarity_points ?? 0
  const levelInfo = getLevelInfo(points, levels)
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email

  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(10,35,66,0.08)',
      borderRadius: 16, padding: '28px 20px', textAlign: 'center',
    }}>
      <div style={{ marginBottom: 14 }}>
        <Avatar photoUrl={profile.photo_url} firstName={profile.first_name} lastName={profile.last_name} />
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: '#0A2342', marginBottom: 3 }}>
        {fullName}
      </div>
      {profile.created_at && (
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: 'rgba(10,35,66,0.4)', fontWeight: 600, marginBottom: 14, letterSpacing: '0.04em' }}>
          Member since {formatMemberSince(profile.created_at)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <TierBadge tier={profile.tier} />
        {profile.pathway_stage && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20,
            fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'rgba(10,35,66,0.06)', color: 'rgba(10,35,66,0.5)', border: '1px solid rgba(10,35,66,0.1)',
          }}>
            {profile.pathway_stage} Stage
          </div>
        )}
      </div>
      <div style={{ height: 1, background: 'rgba(10,35,66,0.08)', margin: '0 0 16px' }} />
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(10,35,66,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
        Clarity Points™
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 700, color: '#D4AF37', lineHeight: 1, marginBottom: 6 }}>
        {points.toLocaleString()}
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 20, padding: '3px 10px', marginBottom: 10,
        fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
        color: '#B8941F', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        ✦ {levelInfo.level}
      </div>
      <div style={{ height: 4, background: 'rgba(10,35,66,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${levelInfo.pct}%`, background: '#D4AF37', borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
      {levelInfo.nextName ? (
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: 'rgba(10,35,66,0.35)', fontWeight: 600 }}>
          {levelInfo.ptsToNext} pts to {levelInfo.nextName}
        </div>
      ) : (
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em' }}>
          MAX LEVEL ✦
        </div>
      )}
    </div>
  )
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({ profile, onUpdate }: {
  profile: ProfileData
  onUpdate: (updates: Partial<ProfileData>) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [headline,  setHeadline]  = useState('')
  const [bio,       setBio]       = useState('')
  const [photoUrl,  setPhotoUrl]  = useState('')

  const { session } = useAuth()
  const levels = useCommunityLevels()
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email

  function openEdit() {
    setFirstName(profile.first_name ?? '')
    setLastName(profile.last_name ?? '')
    setHeadline(profile.headline ?? '')
    setBio(profile.bio ?? '')
    setPhotoUrl(profile.photo_url ?? '')
    setError('')
    setEditing(true)
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const updates = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        photo_url: photoUrl.trim() || null,
        updated_at: new Date().toISOString(),
      }
      const { error: err } = await supabase.from('profiles').update(updates).eq('id', profile.id)
      if (err) throw err
      onUpdate(updates)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#FAFAF8',
    border: '1px solid rgba(10,35,66,0.12)', borderRadius: 8,
    padding: '10px 12px', fontFamily: 'Inter, sans-serif',
    fontSize: 13, color: '#0A2342', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
    color: 'rgba(10,35,66,0.4)', letterSpacing: '0.12em',
    textTransform: 'uppercase', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,35,66,0.08)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(10,35,66,0.07)' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#0A2342', marginBottom: 2 }}>
          {editing ? 'Editing Profile' : (profile.headline || fullName)}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(10,35,66,0.4)' }}>
          {editing ? 'Changes save to your profile immediately' : profile.email}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {saved && (
          <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#B8941F' }}>
            ✓ Profile updated
          </div>
        )}

        {editing ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div><label style={labelStyle}>First Name</label><input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Last Name</label><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Photo URL</label>
              <input type="text" placeholder="https://..." value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Headline</label>
              <input type="text" placeholder="e.g. AI Leadership Strategist & Executive Coach" value={headline} onChange={e => setHeadline(e.target.value)} maxLength={120} style={inputStyle} />
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: 'rgba(10,35,66,0.3)', marginTop: 4, textAlign: 'right' }}>{headline.length}/120</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Bio</label>
              <textarea placeholder="Tell the community about yourself, your leadership journey, and what brings you to DRU AI..." value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={5} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: 'rgba(10,35,66,0.3)', marginTop: 4, textAlign: 'right' }}>{bio.length}/500</div>
            </div>
            {error && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#E53935', marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(10,35,66,0.07)' }}>
              <button onClick={handleSave} disabled={saving} style={{ padding: '11px 28px', background: saving ? 'rgba(10,35,66,0.1)' : '#0A2342', color: '#D4AF37', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} style={{ padding: '11px 20px', background: 'transparent', color: 'rgba(10,35,66,0.4)', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(10,35,66,0.12)', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {profile.bio ? (
              <div style={{ marginBottom: 24 }}>
                <div style={labelStyle as React.CSSProperties}>Bio</div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(10,35,66,0.7)', lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px dashed rgba(212,175,55,0.3)', borderRadius: 8, padding: '16px 20px', marginBottom: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.4)', margin: '0 0 8px' }}>Add a bio to let the community know your leadership story.</p>
                <button onClick={openEdit} style={{ background: 'none', border: 'none', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#D4AF37', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>+ Add Bio</button>
              </div>
            )}
            <div style={{ height: 1, background: 'rgba(10,35,66,0.07)', marginBottom: 20 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 24 }}>
              {profile.assessment_score != null && (
                <div style={{ background: '#FAFAF8', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(10,35,66,0.07)' }}>
                  <div style={labelStyle as React.CSSProperties}>DRU CLEAR™ Score</div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>{profile.assessment_score}</div>
                </div>
              )}
              {profile.assessment_tier && (
                <div style={{ background: '#FAFAF8', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(10,35,66,0.07)' }}>
                  <div style={labelStyle as React.CSSProperties}>Assessment Tier</div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2342' }}>{profile.assessment_tier}</div>
                </div>
              )}
              <div style={{ background: '#FAFAF8', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(10,35,66,0.07)' }}>
                <div style={labelStyle as React.CSSProperties}>Community Level</div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2342' }}>{profile.community_level ?? getLevelInfo(profile.clarity_points ?? 0, levels).level}</div>
              </div>
            </div>
            <button onClick={openEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 24px', background: '#0A2342', color: '#D4AF37', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              ✎ Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Notifications tab ────────────────────────────────────────────────────────

const DEFAULT_PREFS: NotificationPreferences = {
  mention_push: true,        mention_inapp: true,        mention_email: true,
  reply_push: true,          reply_inapp: true,          reply_email: true,
  new_agent_post_push: true, new_agent_post_inapp: true, new_agent_post_email: false,
  new_post_push: false,      new_post_inapp: true,       new_post_email: false,
}

const PREF_GROUPS: {
  key: string; label: string; description: string
  push: keyof NotificationPreferences
  inapp: keyof NotificationPreferences
  email: keyof NotificationPreferences
}[] = [
  { key: 'mention',        label: '@Mentions',        description: 'When someone mentions you in a post or comment',   push: 'mention_push',        inapp: 'mention_inapp',        email: 'mention_email' },
  { key: 'reply',          label: 'Thread replies',   description: 'When someone replies to your comment',             push: 'reply_push',          inapp: 'reply_inapp',          email: 'reply_email' },
  { key: 'new_agent_post', label: 'Agent posts',      description: 'New content from DRU AI agents',                   push: 'new_agent_post_push', inapp: 'new_agent_post_inapp', email: 'new_agent_post_email' },
  { key: 'new_post',       label: 'New posts',        description: 'New posts from community members',                 push: 'new_post_push',       inapp: 'new_post_inapp',       email: 'new_post_email' },
]

function NotificationsTab({ userId }: { userId: string }) {
  const [prefs, setPrefs]             = useState<NotificationPreferences | null>(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPushEnabled(Notification.permission === 'granted')
    supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setPrefs(data as NotificationPreferences)
        } else {
          // Create default row
          const row = { user_id: userId, ...DEFAULT_PREFS }
          await supabase.from('notification_preferences').upsert(row)
          setPrefs(DEFAULT_PREFS)
        }
        setLoading(false)
      })
  }, [userId])

  const togglePref = async (key: keyof NotificationPreferences) => {
    if (!prefs) return
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    await supabase.from('notification_preferences').update({ [key]: !prefs[key] }).eq('user_id', userId)
  }

  const turnOffAll = async () => {
    if (!prefs || saving) return
    setSaving(true)
    const allOff: NotificationPreferences = {
      mention_push: false,        mention_inapp: false,        mention_email: false,
      reply_push: false,          reply_inapp: false,          reply_email: false,
      new_agent_post_push: false, new_agent_post_inapp: false, new_agent_post_email: false,
      new_post_push: false,       new_post_inapp: false,       new_post_email: false,
    }
    setPrefs(allOff)
    await supabase.from('notification_preferences').update(allOff).eq('user_id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,35,66,0.08)', borderRadius: 16, padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'dru-spin 0.8s linear infinite' }} />
    </div>
  )

  if (!prefs) return null

  const labelStyle: React.CSSProperties = { fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(10,35,66,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,35,66,0.08)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(10,35,66,0.07)' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#0A2342', marginBottom: 2 }}>Notifications</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(10,35,66,0.4)' }}>Choose how you want to be notified about community activity</div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Push enable banner */}
        {!pushEnabled && (
          <div style={{ background: 'rgba(10,35,66,0.04)', border: '1px solid rgba(10,35,66,0.1)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#0A2342', marginBottom: 2 }}>Enable push notifications</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(10,35,66,0.5)' }}>Get real-time alerts on this device</div>
            </div>
            <button
              onClick={async () => { const p = await Notification.requestPermission(); if (p === 'granted') setPushEnabled(true) }}
              style={{ padding: '8px 18px', background: '#0A2342', color: '#D4AF37', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
            >
              Enable
            </button>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(10,35,66,0.07)' }}>
          <div />
          {['Push', 'In-app', 'Email'].map(l => (
            <div key={l} style={{ ...labelStyle, textAlign: 'center' as const }}>{l}</div>
          ))}
        </div>

        {/* Pref rows */}
        {PREF_GROUPS.map((group, i) => (
          <div key={group.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 8, alignItems: 'center', padding: '14px 0', borderBottom: i < PREF_GROUPS.length - 1 ? '1px solid rgba(10,35,66,0.05)' : 'none' }}>
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2342', marginBottom: 2 }}>{group.label}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(10,35,66,0.4)' }}>{group.description}</div>
            </div>
            {[group.push, group.inapp, group.email].map((key) => (
              <div key={key as string} style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle on={prefs[key]} onClick={() => togglePref(key)} />
              </div>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, marginTop: 4, borderTop: '1px solid rgba(10,35,66,0.07)' }}>
          <button onClick={turnOffAll} disabled={saving} style={{ padding: '10px 20px', background: 'transparent', color: 'rgba(10,35,66,0.5)', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid rgba(10,35,66,0.15)', borderRadius: 8, cursor: saving ? 'default' : 'pointer' }}>
            Turn off all
          </button>
          {saved && (
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#B8941F', letterSpacing: '0.06em' }}>✓ Saved</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Privacy tab ──────────────────────────────────────────────────────────────

function PrivacyTab({ profile, onUpdate }: { profile: ProfileData; onUpdate: (updates: Partial<ProfileData>) => void }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const toggle = async (field: 'show_in_directory' | 'prevent_messaging') => {
    if (saving) return
    setSaving(true)
    const newVal = !profile[field]
    const { error } = await supabase.from('profiles').update({ [field]: newVal }).eq('id', profile.id)
    if (!error) {
      onUpdate({ [field]: newVal })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,35,66,0.08)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(10,35,66,0.07)' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#0A2342', marginBottom: 2 }}>Privacy</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(10,35,66,0.4)' }}>Control your visibility and messaging preferences</div>
      </div>

      <div style={{ padding: '24px' }}>
        {saved && (
          <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#B8941F' }}>✓ Saved</div>
        )}

        {/* Visibility */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#0A2342', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Visibility</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#0A2342', marginBottom: 3 }}>Show my profile in the member directory</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(10,35,66,0.45)' }}>Let other members find and view your profile</div>
            </div>
            <Toggle on={profile.show_in_directory ?? true} onClick={() => toggle('show_in_directory')} />
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(10,35,66,0.07)', marginBottom: 24 }} />

        {/* Messaging */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#0A2342', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Messaging</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#0A2342', marginBottom: 3 }}>Prevent members from messaging me</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(10,35,66,0.45)' }}>Direct messaging is coming soon to the DRU portal</div>
            </div>
            <Toggle on={profile.prevent_messaging ?? false} onClick={() => toggle('prevent_messaging')} />
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(10,35,66,0.07)', marginBottom: 24 }} />

        {/* Blocked members */}
        <div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#0A2342', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Blocked Members</div>
          <div style={{ background: '#FAFAF8', border: '1px solid rgba(10,35,66,0.07)', borderRadius: 10, padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, opacity: 0.25, marginBottom: 10 }}>👥</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.4)' }}>No blocked members. Blocked members can't message you.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Profile() {
  const { session } = useAuth()

  // Read initial tab from URL hash or query param
  const hash = window.location.hash.slice(1) as SettingsTab
  const searchParams = new URLSearchParams(window.location.search)
  const initialTab = (['profile', 'notifications', 'privacy'].includes(hash) ? hash : null)
    ?? (searchParams.get('tab') as SettingsTab)
    ?? 'profile'

  const [tab, setTab]           = useState<SettingsTab>(initialTab)
  const [loading, setLoading]   = useState(true)
  const [profile, setProfile]   = useState<ProfileData | null>(null)

  useEffect(() => {
    // Clean up hash from URL without triggering re-navigation
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    if (!session?.user) return
    loadProfile()
  }, [session])

  async function loadProfile() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, photo_url, tier, pathway_stage, clarity_points, community_level, assessment_score, assessment_tier, headline, bio, created_at, show_in_directory, prevent_messaging')
        .eq('id', session!.user.id)
        .single()
      if (data) setProfile(data)
    } catch (err) {
      console.error('[Profile] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleUpdate(updates: Partial<ProfileData>) {
    setProfile(prev => prev ? { ...prev, ...updates } : prev)
  }

  if (loading) return <Loader />
  if (!profile) return null

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'profile',       label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy',       label: 'Privacy' },
  ]

  return (
    <div style={{ padding: window.innerWidth < 768 ? '16px 12px' : '28px 24px', maxWidth: 900, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#0A2342', margin: '0 0 4px' }}>
          Account Settings
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.45)', margin: 0 }}>
          Manage your profile, notifications, and privacy
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(10,35,66,0.08)', paddingBottom: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? '#0A2342' : 'transparent'}`,
              fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
              color: tab === t.id ? '#0A2342' : 'rgba(10,35,66,0.4)',
              cursor: 'pointer', letterSpacing: '0.06em',
              textTransform: 'uppercase', transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'minmax(0, 240px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <LeftCard profile={profile} />

        <div>
          {tab === 'profile'       && <ProfileTab       profile={profile} onUpdate={handleUpdate} />}
          {tab === 'notifications' && <NotificationsTab userId={profile.id} />}
          {tab === 'privacy'       && <PrivacyTab       profile={profile} onUpdate={handleUpdate} />}
        </div>
      </div>
    </div>
  )
}
