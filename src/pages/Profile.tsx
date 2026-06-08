import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Clarity Points level logic ───────────────────────────────────────────────

const LEVELS = [
  { name: 'Connected',    min: 0,    next: 50   },
  { name: 'Contributor',  min: 50,   next: 150  },
  { name: 'Cultivator',   min: 150,  next: 400  },
  { name: 'Cornerstone',  min: 400,  next: 1000 },
  { name: 'Changemaker',  min: 1000, next: null },
]

function getLevelInfo(points: number) {
  let current = LEVELS[0]
  for (const level of LEVELS) {
    if (points >= level.min) current = level
    else break
  }
  const pct = current.next
    ? Math.min(100, Math.round(((points - current.min) / (current.next - current.min)) * 100))
    : 100
  const ptsToNext = current.next ? current.next - points : 0
  const nextName = current.next
    ? LEVELS[LEVELS.findIndex(l => l.name === current.name) + 1]?.name ?? null
    : null
  return { level: current.name, nextName, pct, ptsToNext }
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch { return '' }
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 32, height: 32,
        border: '2px solid rgba(212,175,55,0.2)',
        borderTopColor: '#D4AF37',
        borderRadius: '50%',
        animation: 'dru-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ photoUrl, firstName, lastName, size = 80 }: {
  photoUrl: string | null
  firstName: string | null
  lastName: string | null
  size?: number
}) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt="Profile photo"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', display: 'block', margin: '0 auto',
          border: '2px solid rgba(212,175,55,0.3)',
        }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#0A2342',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: size * 0.3, fontWeight: 700, color: '#D4AF37',
      margin: '0 auto',
    }}>
      {initials}
    </div>
  )
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string | null }) {
  const isAccelerator = tier === 'accelerator'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 20,
      fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: isAccelerator ? 'rgba(194,24,91,0.1)' : 'rgba(212,175,55,0.1)',
      color: isAccelerator ? '#C2185B' : '#B8941F',
      border: isAccelerator
        ? '1px solid rgba(194,24,91,0.25)'
        : '1px solid rgba(212,175,55,0.3)',
    }}>
      ✦ {isAccelerator ? 'Accelerator' : 'Navigator'}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Profile() {
  const { session } = useAuth()

  const [loading, setLoading]   = useState(true)
  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  // Edit form state
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [headline,  setHeadline]  = useState('')
  const [bio,       setBio]       = useState('')
  const [photoUrl,  setPhotoUrl]  = useState('')

  useEffect(() => {
    if (!session?.user) return
    loadProfile()
  }, [session])

  async function loadProfile() {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, photo_url, tier, pathway_stage, clarity_points, community_level, assessment_score, assessment_tier, headline, bio, created_at')
        .eq('id', session!.user.id)
        .single()

      if (err || !data) return
      setProfile(data)
    } catch (err) {
      console.error('[Profile] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  function openEdit() {
    if (!profile) return
    setFirstName(profile.first_name ?? '')
    setLastName(profile.last_name ?? '')
    setHeadline(profile.headline ?? '')
    setBio(profile.bio ?? '')
    setPhotoUrl(profile.photo_url ?? '')
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!profile || saving) return
    setSaving(true)
    setError('')
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          headline: headline.trim() || null,
          bio: bio.trim() || null,
          photo_url: photoUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateErr) throw updateErr

      setProfile(prev => prev ? {
        ...prev,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        photo_url: photoUrl.trim() || null,
      } : prev)

      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('[Profile] save error:', err)
      setError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader />
  if (!profile) return null

  const points = profile.clarity_points ?? 0
  const levelInfo = getLevelInfo(points)
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email

  // ── Shared input style ───────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#FAFAF8',
    border: '1px solid rgba(10,35,66,0.12)',
    borderRadius: 8,
    padding: '10px 12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    color: '#0A2342',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 9,
    fontWeight: 700,
    color: 'rgba(10,35,66,0.4)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 6,
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700,
          color: '#0A2342', margin: '0 0 4px',
        }}>
          My Profile
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13,
          color: 'rgba(10,35,66,0.45)', margin: 0,
        }}>
          Your DRU AI Leadership Ecosystem™ identity
        </p>
      </div>

      {saved && (
        <div style={{
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 20,
          fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
          color: '#B8941F', letterSpacing: '0.06em',
        }}>
          ✓ Profile updated successfully
        </div>
      )}

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* ── LEFT CARD ── */}
        <div style={{
          background: '#fff', border: '1px solid rgba(10,35,66,0.08)',
          borderRadius: 16, padding: '28px 20px', textAlign: 'center',
        }}>
          <div style={{ marginBottom: 14 }}>
            <Avatar
              photoUrl={editing ? (photoUrl || null) : profile.photo_url}
              firstName={editing ? firstName : profile.first_name}
              lastName={editing ? lastName : profile.last_name}
            />
          </div>

          {editing ? (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Photo URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                style={{ ...inputStyle, fontSize: 11 }}
              />
            </div>
          ) : (
            <>
              <div style={{
                fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700,
                color: '#0A2342', marginBottom: 4,
              }}>
                {fullName}
              </div>
              {profile.created_at && (
                <div style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 10,
                  color: 'rgba(10,35,66,0.4)', fontWeight: 600, marginBottom: 14,
                  letterSpacing: '0.04em',
                }}>
                  Member since {formatMemberSince(profile.created_at)}
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <TierBadge tier={profile.tier} />
            {profile.pathway_stage && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20,
                fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(10,35,66,0.06)', color: 'rgba(10,35,66,0.5)',
                border: '1px solid rgba(10,35,66,0.1)',
              }}>
                {profile.pathway_stage} Stage
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(10,35,66,0.08)', margin: '0 0 16px' }} />

          {/* Clarity Points */}
          <div style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
            color: 'rgba(10,35,66,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Clarity Points™
          </div>
          <div style={{
            fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 700,
            color: '#D4AF37', lineHeight: 1, marginBottom: 6,
          }}>
            {points.toLocaleString()}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 20, padding: '3px 10px',
            fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
            color: '#B8941F', letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            ✦ {levelInfo.level}
          </div>

          <div style={{
            height: 4, background: 'rgba(10,35,66,0.08)',
            borderRadius: 4, overflow: 'hidden', marginBottom: 4,
          }}>
            <div style={{
              height: '100%', width: `${levelInfo.pct}%`,
              background: '#D4AF37', borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>

          {levelInfo.nextName ? (
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 9,
              color: 'rgba(10,35,66,0.35)', fontWeight: 600,
            }}>
              {levelInfo.ptsToNext} pts to {levelInfo.nextName}
            </div>
          ) : (
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 9,
              color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em',
            }}>
              MAX LEVEL ✦
            </div>
          )}

          {/* Edit / Cancel button */}
          {!editing ? (
            <button
              onClick={openEdit}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '11px 0', marginTop: 18,
                background: '#0A2342', color: '#D4AF37',
                fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              ✎ Edit Profile
            </button>
          ) : (
            <button
              onClick={cancelEdit}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '11px 0', marginTop: 18,
                background: 'transparent', color: 'rgba(10,35,66,0.4)',
                fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                border: '1px solid rgba(10,35,66,0.12)', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {/* ── RIGHT CARD ── */}
        <div style={{
          background: '#fff', border: '1px solid rgba(10,35,66,0.08)',
          borderRadius: 16, overflow: 'hidden',
        }}>

          {/* Card header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(10,35,66,0.07)',
          }}>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700,
              color: '#0A2342', marginBottom: 2,
            }}>
              {editing ? 'Editing Profile' : (profile.headline || fullName)}
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12,
              color: 'rgba(10,35,66,0.4)',
            }}>
              {editing ? 'Changes save to your profile immediately' : profile.email}
            </div>
          </div>

          <div style={{ padding: '24px' }}>

            {editing ? (
              /* ── EDIT FORM ── */
              <>
                {/* Name row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Headline */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Leadership Strategist & Executive Coach"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    maxLength={120}
                    style={inputStyle}
                  />
                  <div style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: 9,
                    color: 'rgba(10,35,66,0.3)', marginTop: 4, textAlign: 'right',
                  }}>
                    {headline.length}/120
                  </div>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Bio</label>
                  <textarea
                    placeholder="Tell the community about yourself, your leadership journey, and what brings you to DRU AI..."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={500}
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                  />
                  <div style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: 9,
                    color: 'rgba(10,35,66,0.3)', marginTop: 4, textAlign: 'right',
                  }}>
                    {bio.length}/500
                  </div>
                </div>

                {error && (
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 12,
                    color: '#E53935', marginBottom: 14,
                  }}>
                    {error}
                  </div>
                )}

                {/* Save row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  paddingTop: 16, borderTop: '1px solid rgba(10,35,66,0.07)',
                }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '11px 28px',
                      background: saving ? 'rgba(10,35,66,0.1)' : '#0A2342',
                      color: '#D4AF37',
                      fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      border: 'none', borderRadius: 8,
                      cursor: saving ? 'default' : 'pointer',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '11px 20px',
                      background: 'transparent',
                      color: 'rgba(10,35,66,0.4)',
                      fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      border: '1px solid rgba(10,35,66,0.12)', borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* ── VIEW MODE ── */
              <>
                {/* Bio */}
                {profile.bio ? (
                  <div style={{ marginBottom: 24 }}>
                    <div style={labelStyle as React.CSSProperties}>Bio</div>
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 14,
                      color: 'rgba(10,35,66,0.7)', lineHeight: 1.7, margin: 0,
                    }}>
                      {profile.bio}
                    </p>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(212,175,55,0.05)',
                    border: '1px dashed rgba(212,175,55,0.3)',
                    borderRadius: 8, padding: '16px 20px', marginBottom: 24,
                    textAlign: 'center',
                  }}>
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 13,
                      color: 'rgba(10,35,66,0.4)', margin: '0 0 8px',
                    }}>
                      Add a bio to let the community know your leadership story.
                    </p>
                    <button
                      onClick={openEdit}
                      style={{
                        background: 'none', border: 'none',
                        fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
                        color: '#D4AF37', cursor: 'pointer', letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      + Add Bio
                    </button>
                  </div>
                )}

                <div style={{ height: 1, background: 'rgba(10,35,66,0.07)', marginBottom: 20 }} />

                {/* DRU CLEAR™ stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 14,
                }}>
                  {profile.assessment_score != null && (
                    <div style={{
                      background: '#FAFAF8', borderRadius: 10,
                      padding: '14px 16px', border: '1px solid rgba(10,35,66,0.07)',
                    }}>
                      <div style={labelStyle as React.CSSProperties}>DRU CLEAR™ Score</div>
                      <div style={{
                        fontFamily: 'Playfair Display, serif', fontSize: 28,
                        fontWeight: 700, color: '#D4AF37', lineHeight: 1,
                      }}>
                        {profile.assessment_score}
                      </div>
                    </div>
                  )}

                  {profile.assessment_tier && (
                    <div style={{
                      background: '#FAFAF8', borderRadius: 10,
                      padding: '14px 16px', border: '1px solid rgba(10,35,66,0.07)',
                    }}>
                      <div style={labelStyle as React.CSSProperties}>Assessment Tier</div>
                      <div style={{
                        fontFamily: 'Montserrat, sans-serif', fontSize: 13,
                        fontWeight: 700, color: '#0A2342',
                      }}>
                        {profile.assessment_tier}
                      </div>
                    </div>
                  )}

                  <div style={{
                    background: '#FAFAF8', borderRadius: 10,
                    padding: '14px 16px', border: '1px solid rgba(10,35,66,0.07)',
                  }}>
                    <div style={labelStyle as React.CSSProperties}>Community Level</div>
                    <div style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: 13,
                      fontWeight: 700, color: '#0A2342',
                    }}>
                      {profile.community_level ?? levelInfo.level}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
