import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Account & Billing',
  'Course Access',
  'Community',
  'Frameworks',
  'Other',
]

const STRIPE_PORTAL  = 'https://billing.stripe.com/p/login/14A9AT0q42PQ7sk8j78Zq00'
const HERO_BANNER_URL = '' // ← paste your hero image URL here when ready

const NAVY       = '#1B4D8E'
const GOLD       = '#D4AF37'
const MAGENTA    = '#C2185B'
const WARM_WHITE = '#FAFAF8'

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'landing' | 'manage' | 'contact' | 'protocols'

// ─── Shared styles ────────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  minHeight: '100%',
  background: WARM_WHITE,
  fontFamily: 'Montserrat, sans-serif',
}

const backBtn: React.CSSProperties = {
  display:     'inline-flex',
  alignItems:  'center',
  gap:         6,
  background:  'rgba(255,255,255,0.12)',
  border:      'none',
  borderRadius: 20,
  padding:     '5px 14px',
  color:       'rgba(255,255,255,0.75)',
  fontFamily:  'Montserrat, sans-serif',
  fontSize:    12,
  cursor:      'pointer',
  marginBottom: 12,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SupportHub() {
  const { profile, session } = useAuth()

  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768)
  const [view,        setView]        = useState<View>('landing')
  const [category,    setCategory]    = useState<string | null>(null)
  const [question,    setQuestion]    = useState('')
  const [file,        setFile]        = useState<File | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [pwSent,      setPwSent]      = useState(false)
  const [pwError,     setPwError]     = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const email      = session?.user?.email || ''
  const memberName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || email
    : email
  const tier       = profile?.tier || 'navigator'
  const isAcc      = tier === 'accelerator'
  const planLabel  = isAcc ? 'Accelerator' : 'Navigator'
  const planPrice  = isAcc ? '$197' : '$97'
  const stripeUrl  = `${STRIPE_PORTAL}${email ? `?prefilled_email=${encodeURIComponent(email)}` : ''}`

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handlePasswordReset = async () => {
    if (!email) return
    setPwError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`,
    })
    if (error) setPwError(error.message)
    else setPwSent(true)
  }

  const handleSubmit = async () => {
    if (!category || !question.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      let fileUrl: string | null = null
      if (file && session?.user?.id) {
        const ext  = file.name.split('.').pop()
        const path = `${session.user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('support-files').upload(path, file)
        if (!upErr) {
          const { data } = supabase.storage.from('support-files').getPublicUrl(path)
          fileUrl = data.publicUrl
        }
      }
      const { error } = await supabase.from('support_requests').insert({
        member_id:    session?.user?.id,
        member_name:  memberName || email,
        member_email: email,
        member_tier:  tier,
        category,
        question:     question.trim(),
        file_url:     fileUrl,
      })
      if (error) throw error
      setSubmitted(true)
    } catch {
      setSubmitError('Something went wrong. Please try again or email support@support.druaiconsulting.com.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetContact = () => {
    setSubmitted(false); setCategory(null); setQuestion(''); setFile(null); setSubmitError('')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LANDING
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'landing') {
    const cards = [
      {
        id:    'manage'    as View,
        icon:  '💳',
        label: 'Account',
        title: 'Manage Your Account',
        sub:   'Billing, password & settings',
        ring:  'rgba(212,175,55,0.18)',
        rbdr:  'rgba(212,175,55,0.3)',
      },
      {
        id:    'contact'   as View,
        icon:  '🎧',
        label: 'Support',
        title: 'Contact Our Team',
        sub:   'Reply within one business day',
        ring:  'rgba(194,24,91,0.15)',
        rbdr:  'rgba(194,24,91,0.35)',
      },
      {
        id:    'protocols' as View,
        icon:  '👥',
        label: 'Community',
        title: 'Community Protocols',
        sub:   'Standards & guidelines',
        ring:  'rgba(212,175,55,0.12)',
        rbdr:  'rgba(212,175,55,0.25)',
      },
    ]

    return (
      <div style={pageWrap}>

        {/* ── Header ── */}
        {isMobile ? (
          /* Mobile: navy brand header */
          <div style={{ background: NAVY, padding: '24px 20px 28px' }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 11, color: GOLD,
              letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8,
            }}>
              Support Hub
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
              How can we help you?
            </h1>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Select a topic below to get started.
            </p>
          </div>
        ) : (
          /* Desktop: clean minimal header */
          <div style={{ padding: '28px 40px 16px', background: WARM_WHITE }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 10, color: NAVY,
              letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Support Hub
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              How can we help you?
            </h1>
          </div>
        )}

        {/* ── Hero banner image (optional) ── */}
        {HERO_BANNER_URL && (
          <div style={{
            margin:   isMobile ? '0' : '0 40px 0',
            overflow: 'hidden',
            borderRadius: isMobile ? 0 : 12,
          }}>
            <img
              src={HERO_BANNER_URL}
              alt="Support Hub"
              style={{ width: '100%', display: 'block', maxHeight: isMobile ? 180 : 220, objectFit: 'cover' }}
            />
          </div>
        )}

        {/* ── Cards ── */}
        <div style={{
          padding:        isMobile ? '20px 16px' : '20px 40px',
          display:        'flex',
          flexDirection:  isMobile ? 'column' : 'row',
          gap:            isMobile ? 12 : 16,
          maxWidth:       isMobile ? undefined : 1100,
          margin:         '0 auto',
          boxSizing:      'border-box',
          width:          '100%',
        }}>
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setView(card.id)}
              style={{
                flex:         isMobile ? 'none' : '1',
                borderRadius: 12,
                overflow:     'hidden',
                border:       '0.5px solid rgba(0,0,0,0.08)',
                cursor:       'pointer',
                transition:   'opacity 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity   = '0.93'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity   = '1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Card banner */}
              <div style={{
                background:     NAVY,
                padding:        isMobile ? '24px 20px 20px' : '20px 16px 16px',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                minHeight:      isMobile ? 140 : 120,
              }}>
                <div style={{
                  width:          isMobile ? 72 : 56,
                  height:         isMobile ? 72 : 56,
                  borderRadius:   '50%',
                  background:     card.ring,
                  border:         `1.5px solid ${card.rbdr}`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  marginBottom:   10,
                  fontSize:       isMobile ? 36 : 28,
                }}>
                  {card.icon}
                </div>
                <div style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 9,
                  color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
                  letterSpacing: '1.5px', marginBottom: 5,
                }}>
                  {card.label}
                </div>
                <div style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize:   isMobile ? 17 : 15,
                  fontWeight: 700,
                  color:      '#fff',
                  textAlign:  'center',
                  lineHeight: 1.2,
                }}>
                  {card.title}
                </div>
              </div>

              {/* Card footer */}
              <div style={{
                background:     '#fff',
                padding:        '10px 14px',
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
              }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#888' }}>
                  {card.sub}
                </span>
                <span style={{ color: '#bbb', fontSize: 16, lineHeight: 1 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MANAGE ACCOUNT
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'manage') {
    const faqs = [
      {
        q: 'Why am I seeing a charge from DRU AI Consulting?',
        a: "That's your Navigator or Accelerator membership. It covers your access to the community, courses, frameworks, monthly resources, and AI insights.",
      },
      {
        q: 'Did I agree to this charge?',
        a: "Yes. When you signed up, you reviewed the subscription terms on the checkout page. We also sent a welcome email right after with all the details. Can't find it? Check your spam folder.",
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Anytime. Click Manage Your Billing above and the cancel option will be right there.',
      },
      {
        q: 'How do I update my payment method?',
        a: 'Use the Manage Your Billing button above. Your current card is shown at the top with an option to swap it out.',
      },
      {
        q: "My payment didn't go through. What now?",
        a: "Almost always an expired card or billing address mismatch. Update via Manage Your Billing — our system retries automatically.",
      },
    ]

    const pageContent: React.CSSProperties = {
      padding:   isMobile ? '24px 20px' : '32px 40px',
      maxWidth:  760,
      margin:    '0 auto',
      boxSizing: 'border-box',
      width:     '100%',
    }

    return (
      <div style={pageWrap}>
        <div style={{ background: NAVY, padding: isMobile ? '14px 20px 22px' : '14px 40px 22px' }}>
          <button onClick={() => setView('landing')} style={backBtn}>← Support Hub</button>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 5 }}>
            Support Hub
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>
            Manage Your Account
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontStyle: 'italic', fontSize: 13, color: GOLD, margin: 0 }}>
            Your Account, Your Control
          </p>
        </div>

        <div style={pageContent}>

          {/* ── Inline subscription card ── */}
          <div style={{
            background:   NAVY,
            borderRadius: 12,
            padding:      '18px 20px',
            marginBottom: 20,
            display:      'flex',
            justifyContent: 'space-between',
            alignItems:   'center',
          }}>
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                Current Plan
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                {planLabel}
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 700, color: GOLD }}>
                {planPrice}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>/mo</span>
              </div>
            </div>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              background:   'rgba(100,220,100,0.12)',
              border:       '1px solid rgba(100,220,100,0.25)',
              borderRadius: 20,
              padding:      '5px 12px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#66BB6A' }} />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#81C784' }}>Active</span>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 16 }}>
            Update your payment method, view billing history, or change your password from here.
          </p>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 28 }}>
            <button
              onClick={() => { window.location.href = stripeUrl }}
              style={{
                flex:         1,
                background:   NAVY,
                color:        '#fff',
                border:       'none',
                borderRadius: 32,
                padding:      '13px 24px',
                fontFamily:   'Montserrat, sans-serif',
                fontSize:     14,
                fontWeight:   600,
                cursor:       'pointer',
              }}
            >
              Manage Your Billing
            </button>

            {pwSent ? (
              <div style={{
                flex:         1,
                background:   'rgba(27,77,142,0.06)',
                border:       `1px solid rgba(27,77,142,0.2)`,
                borderRadius: 32,
                padding:      '13px 24px',
                fontFamily:   'Montserrat, sans-serif',
                fontSize:     13,
                color:        NAVY,
                textAlign:    'center',
              }}>
                ✓ Reset link sent to {email}
              </div>
            ) : (
              <button
                onClick={handlePasswordReset}
                style={{
                  flex:         1,
                  background:   'transparent',
                  color:        NAVY,
                  border:       `1.5px solid ${NAVY}`,
                  borderRadius: 32,
                  padding:      '13px 24px',
                  fontFamily:   'Montserrat, sans-serif',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       'pointer',
                }}
              >
                Change Your Password
              </button>
            )}
          </div>

          {pwError && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: MAGENTA, margin: '0 0 16px' }}>{pwError}</p>}

          {/* ── FAQ ── */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginBottom: 20 }} />
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>
            Common billing questions
          </h2>

          {faqs.map(({ q, a }, i) => (
            <div key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '14px 0' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: NAVY, margin: '0 0 5px', textDecoration: 'underline' }}>{q}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: 0, lineHeight: 1.65 }}>{a}</p>
            </div>
          ))}

          {/* ── Escalation ── */}
          <div style={{ marginTop: 20, background: 'rgba(27,77,142,0.05)', border: `1px solid rgba(27,77,142,0.12)`, borderRadius: 10, padding: '14px 18px' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: NAVY, margin: '0 0 4px' }}>Need something else?</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#666', margin: '0 0 8px', lineHeight: 1.5 }}>Our team will get back to you within one business day.</p>
            <button onClick={() => setView('contact')} style={{ background: 'none', border: 'none', color: MAGENTA, fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              Contact Our Team →
            </button>
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT OUR TEAM
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'contact') {
    const pageContent: React.CSSProperties = {
      padding:   isMobile ? '24px 20px' : '32px 40px',
      maxWidth:  680,
      margin:    '0 auto',
      boxSizing: 'border-box',
      width:     '100%',
    }

    if (submitted) {
      return (
        <div style={pageWrap}>
          <div style={{ background: NAVY, padding: isMobile ? '14px 20px 22px' : '14px 40px 22px' }}>
            <button onClick={() => { setView('landing'); resetContact() }} style={backBtn}>← Support Hub</button>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Contact Our Team</h1>
          </div>
          <div style={{ ...pageContent, textAlign: 'center', paddingTop: 60 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `rgba(27,77,142,0.1)`, border: `2px solid ${NAVY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 26 }}>✓</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: NAVY, margin: '0 0 10px' }}>Request received!</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#555', lineHeight: 1.65, margin: '0 0 28px' }}>
              We'll respond to <strong>{email}</strong> within one business day.
            </p>
            <button onClick={() => { setView('landing'); resetContact() }} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 32, padding: '12px 28px', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Back to Support Hub
            </button>
          </div>
        </div>
      )
    }

    const canSubmit = !!category && question.trim().length > 0 && !submitting

    return (
      <div style={pageWrap}>
        <div style={{ background: NAVY, padding: isMobile ? '14px 20px 22px' : '14px 40px 22px' }}>
          <button onClick={() => setView('landing')} style={backBtn}>← Support Hub</button>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 5 }}>Support Hub</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Contact Our Team</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>We'll respond within one business day.</p>
        </div>

        <div style={pageContent}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#333', margin: '0 0 10px' }}>
            What do you need help with? <span style={{ color: MAGENTA }}>*</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            {CATEGORIES.map((cat, i) => {
              const active = category === cat
              return (
                <button key={cat} onClick={() => setCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: active ? 'rgba(27,77,142,0.06)' : '#fff', border: active ? `1.5px solid ${NAVY}` : '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: active ? NAVY : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: active ? GOLD : '#888', flexShrink: 0, transition: 'all 0.15s' }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: active ? NAVY : '#333', fontWeight: active ? 600 : 400 }}>
                    {cat}
                  </span>
                </button>
              )
            })}
          </div>

          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#333', margin: '0 0 8px' }}>
            Describe your question or issue <span style={{ color: MAGENTA }}>*</span>
          </p>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Tell us what's going on in detail..." style={{ width: '100%', minHeight: 90, borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', padding: '10px 12px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#333', background: '#fff', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20, outline: 'none', lineHeight: 1.6 }} />

          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#333', margin: '0 0 8px' }}>
            Screenshots or documents? <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span>
          </p>
          <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed rgba(0,0,0,0.15)', borderRadius: 10, padding: '16px', textAlign: 'center', background: '#f7f7f5', cursor: 'pointer', marginBottom: 20 }}>
            {file ? (
              <div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: NAVY, margin: 0, fontWeight: 600 }}>📎 {file.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null) }} style={{ background: 'none', border: 'none', color: MAGENTA, fontSize: 12, cursor: 'pointer', marginTop: 3, fontFamily: 'Montserrat, sans-serif', padding: 0 }}>Remove</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 22, marginBottom: 4 }}>⬆️</div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: NAVY, fontWeight: 600, margin: 0 }}>Choose a file or drag it here</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#999', margin: '2px 0 0' }}>Screenshots, PDFs, or documents</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />

          <div style={{ display: isMobile ? 'block' : 'flex', gap: 16, marginBottom: 8 }}>
            <div style={{ flex: 1, marginBottom: isMobile ? 12 : 0 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#333', margin: '0 0 6px' }}>Your name</p>
              <input type="text" value={memberName} readOnly style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', padding: '9px 12px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#999', background: '#f0f0ee', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#333', margin: '0 0 6px' }}>Email address</p>
              <input type="email" value={email} readOnly style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', padding: '9px 12px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#999', background: '#f0f0ee', boxSizing: 'border-box' }} />
            </div>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#aaa', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 4 }}>🔒 Pre-filled from your profile</p>

          {submitError && (
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: MAGENTA, margin: '0 0 14px', lineHeight: 1.5, background: 'rgba(194,24,91,0.06)', borderRadius: 8, padding: '10px 14px' }}>
              {submitError}
            </p>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: '100%', background: canSubmit ? MAGENTA : '#ccc', color: '#fff', border: 'none', borderRadius: 32, padding: '13px 24px', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
          <div style={{ height: 32 }} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMMUNITY PROTOCOLS
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'protocols') {
    const pageContent: React.CSSProperties = {
      padding:   isMobile ? '24px 20px' : '32px 40px',
      maxWidth:  760,
      margin:    '0 auto',
      boxSizing: 'border-box',
      width:     '100%',
    }

    return (
      <div style={pageWrap}>
        <div style={{ background: NAVY, padding: isMobile ? '14px 20px 22px' : '14px 40px 22px' }}>
          <button onClick={() => setView('landing')} style={backBtn}>← Support Hub</button>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 5 }}>DRU AI Leadership Ecosystem™</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#fff', margin: 0 }}>Community Protocols</h1>
        </div>

        <div style={pageContent}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 6px' }}>Welcome to the DRU AI Consulting Community Connection.</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 24px' }}>We are excited you have chosen to join us. Leadership with AI is our edge and your advantage. These protocols are put in place to ensure your growth, connection, and collaboration.</p>

          {[
            { title: 'Lead with Respect and Intention', body: "Each member is at a unique stage of the Leadership with AI journey. Some are new; others are deep in implementation. Meet everyone where they are. Ideas are always welcome. If a conversation intensifies, lead by example. We are all here to learn from one another." },
            { title: "What's Shared Here, Stays Here", body: "This is a private community. Conversations, frameworks, insights, course content, and member contributions stay here. Members trust each other to maintain confidentiality. Honor that trust as you expect others to honor yours." },
          ].map(({ title, body }, i) => (
            <div key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 0' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 7px' }}>{title}</h3>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: 0, lineHeight: 1.7 }}>{body}</p>
            </div>
          ))}

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 0' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 7px' }}>This Is a Leadership Space, Not a Marketplace</h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: '0 0 10px', lineHeight: 1.7 }}>We're here to grow — not sell. No promotions, service pitches, affiliate links, DMs with offers, or partial insights to drive traffic elsewhere. When unsure, ask before posting.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['DMing members to pitch a product, service, or offer','Posting partial insights to push people toward outside content','"DM me to learn more" or any similar invite to transact','Promoting outside tools or programs'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: MAGENTA, fontSize: 13, lineHeight: 1.5, flexShrink: 0 }}>✕</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 0' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 7px' }}>Zero Tolerance for Discrimination and Harassment</h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: '0 0 10px', lineHeight: 1.7 }}>We do not tolerate harassment, hate speech, political policies, or discrimination of any kind. This is a safe space. No exceptions.</p>
            <div style={{ background: 'rgba(194,24,91,0.07)', borderLeft: `3px solid ${MAGENTA}`, borderRadius: '0 8px 8px 0', padding: '8px 12px' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#333', margin: 0, fontWeight: 600 }}>Violations result in immediate removal — no warnings.</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 0' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 10px' }}>When Standards Aren't Met</h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.7 }}>Our community is actively moderated. If something crosses a line:</p>
            {[['First, a private conversation.','Most issues are confusion and resolve here.'],['A clear warning.','A repeat offense results in a formal warning and a chance to realign.'],['Removal from the Community.',"Repeated violations result in loss of membership. You'll receive a full explanation."]].map(([step, desc], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, color: GOLD }}>{i + 1}</span>
                </div>
                <div>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: '#333' }}>{step} </span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555' }}>{desc}</span>
                </div>
              </div>
            ))}
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>
              All decisions are documented. Appeals: <a href="mailto:support@support.druaiconsulting.com" style={{ color: NAVY, fontWeight: 600 }}>support@support.druaiconsulting.com</a>.
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 0' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 7px' }}>Your participation keeps us strong: See Something? Say Something.</h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: 0, lineHeight: 1.7 }}>If you see content or behavior that doesn't belong, report it. You protect this community for everyone.</p>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 0' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 7px' }}>For additional support: Need Help?</h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', lineHeight: 1.7, margin: '0 0 8px' }}>
              Contact us at <a href="mailto:support@support.druaiconsulting.com" style={{ color: NAVY, fontWeight: 600 }}>support@support.druaiconsulting.com</a>. Keep support questions out of the community feed.
            </p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: 0, fontStyle: 'italic' }}>Enjoy, — The DRU AI Consulting Team</p>
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>
    )
  }

  return null
}
