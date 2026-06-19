import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// ─── Stripe setup ─────────────────────────────────────────────────────────────

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Account & Billing',
  'Course Access',
  'Community',
  'Frameworks',
  'Other',
]

const HERO_BANNER_URL = '/images/support-hub/support-hub-banner.png'

const NAVY       = '#1B4D8E'
const GOLD       = '#D4AF37'
const MAGENTA    = '#C2185B'
const WARM_WHITE = '#FAFAF8'

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'landing' | 'manage' | 'contact' | 'protocols'

interface BillingData {
  id:                   string
  status:               string
  cancel_at_period_end: boolean
  current_period_end:   number
  customer_id:          string
  card_last4:           string | null
  card_brand:           string | null
  card_exp_month:       number | null
  card_exp_year:        number | null
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  minHeight: '100%',
  background: WARM_WHITE,
  fontFamily: 'Montserrat, sans-serif',
}

const backBtn: React.CSSProperties = {
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
  background:   'rgba(255,255,255,0.12)',
  border:       'none',
  borderRadius: 20,
  padding:      '5px 14px',
  color:        'rgba(255,255,255,0.75)',
  fontFamily:   'Montserrat, sans-serif',
  fontSize:     12,
  cursor:       'pointer',
  marginBottom: 12,
}

// ─── UpdatePaymentForm sub-component ─────────────────────────────────────────
// Must live inside <Elements> provider — rendered only when user clicks Update

interface UpdatePaymentFormProps {
  customerId:     string
  subscriptionId: string
  onSuccess:      () => void
  onCancel:       () => void
  isMobile:       boolean
}

function UpdatePaymentForm({
  customerId,
  subscriptionId,
  onSuccess,
  onCancel,
  isMobile,
}: UpdatePaymentFormProps) {
  const stripe   = useStripe()
  const elements = useElements()
  const [saving, setSaving]   = useState(false)
  const [pmError, setPmError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!stripe || !elements) return
    setSaving(true)
    setPmError('')

    try {
      // Step 1 — get a SetupIntent client_secret from our API
      const siRes = await fetch('/api/stripe-billing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'setup_intent', customer_id: customerId }),
      })
      const { client_secret, error: siErr } = await siRes.json()
      if (siErr) throw new Error(siErr)

      // Step 2 — confirm the card setup with Stripe.js
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card field not ready.')

      const { setupIntent, error: confirmErr } = await stripe.confirmCardSetup(client_secret, {
        payment_method: { card: cardElement },
      })
      if (confirmErr) throw new Error(confirmErr.message)
      if (!setupIntent?.payment_method) throw new Error('No payment method returned.')

      // Step 3 — tell our API to set it as default on the subscription
      const updateRes = await fetch('/api/stripe-billing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          action:             'update_payment',
          subscription_id:    subscriptionId,
          payment_method_id:  setupIntent.payment_method,
          customer_id:        customerId,
        }),
      })
      const { error: updateErr } = await updateRes.json()
      if (updateErr) throw new Error(updateErr)

      setSuccess(true)
      setTimeout(() => onSuccess(), 1200)
    } catch (err: any) {
      setPmError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div style={{
        background:   'rgba(27,77,142,0.06)',
        border:       `1px solid rgba(27,77,142,0.2)`,
        borderRadius: 10,
        padding:      '14px 18px',
        textAlign:    'center',
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 20 }}>✓ </span>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: NAVY, fontWeight: 600 }}>
          Card updated successfully!
        </span>
      </div>
    )
  }

  return (
    <div style={{
      background:   '#fff',
      border:       `1.5px solid rgba(27,77,142,0.25)`,
      borderRadius: 12,
      padding:      '18px 20px',
      marginBottom: 20,
    }}>
      <p style={{
        fontFamily:   'Montserrat, sans-serif',
        fontWeight:   600,
        fontSize:     13,
        color:        NAVY,
        margin:       '0 0 12px',
      }}>
        New card details
      </p>

      <div style={{
        background:   '#f8f8f8',
        border:       '1px solid rgba(0,0,0,0.1)',
        borderRadius: 8,
        padding:      '11px 14px',
        marginBottom: 14,
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontFamily:     'Montserrat, sans-serif',
                fontSize:       '14px',
                color:          '#1a1a1a',
                '::placeholder': { color: '#aaa' },
              },
              invalid: { color: '#C2185B' },
            },
            hidePostalCode: false,
          }}
        />
      </div>

      {pmError && (
        <p style={{
          fontFamily:   'Montserrat, sans-serif',
          fontSize:     12,
          color:        MAGENTA,
          margin:       '0 0 12px',
          background:   'rgba(194,24,91,0.06)',
          borderRadius: 8,
          padding:      '8px 12px',
        }}>
          {pmError}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
        <button
          onClick={handleSave}
          disabled={saving || !stripe}
          style={{
            flex:         1,
            background:   saving ? '#ccc' : NAVY,
            color:        '#fff',
            border:       'none',
            borderRadius: 32,
            padding:      '11px 20px',
            fontFamily:   'Montserrat, sans-serif',
            fontSize:     13,
            fontWeight:   600,
            cursor:       saving ? 'not-allowed' : 'pointer',
            transition:   'background 0.2s',
          }}
        >
          {saving ? 'Saving…' : 'Save New Card'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            flex:         1,
            background:   'transparent',
            color:        '#666',
            border:       '1px solid rgba(0,0,0,0.15)',
            borderRadius: 32,
            padding:      '11px 20px',
            fontFamily:   'Montserrat, sans-serif',
            fontSize:     13,
            cursor:       'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Card icons (line-art, matches banner icon style) ────────────────────────

function CardIcon({ id, color, size }: { id: View; color: string; size: number }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 1.6,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  if (id === 'manage') {
    // Lock icon — Account & Security
    return (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
        <circle cx="12" cy="15.5" r="1.3" fill={color} stroke="none" />
      </svg>
    )
  }
  if (id === 'contact') {
    // Headset icon — Support
    return (
      <svg {...common}>
        <path d="M4 13.5V12a8 8 0 0 1 16 0v1.5" />
        <rect x="3.2" y="13" width="4" height="6.5" rx="1.6" />
        <rect x="16.8" y="13" width="4" height="6.5" rx="1.6" />
        <path d="M18.8 19.5v.8a2.7 2.7 0 0 1-2.7 2.7h-2.4" />
      </svg>
    )
  }
  // Shield icon — Community
  return (
    <svg {...common}>
      <path d="M12 3.5l7 3v5.2c0 4.6-3 7.7-7 8.8-4-1.1-7-4.2-7-8.8V6.5l7-3z" />
      <path d="M8.7 12.2l2.3 2.3 4.3-4.6" />
    </svg>
  )
}



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

  // Billing state
  const [billing,           setBilling]           = useState<BillingData | null>(null)
  const [billingLoading,    setBillingLoading]    = useState(false)
  const [billingError,      setBillingError]      = useState('')
  const [showUpdatePayment, setShowUpdatePayment] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelLoading,     setCancelLoading]     = useState(false)
  const [cancelError,       setCancelError]       = useState('')
  const [reactivateLoading, setReactivateLoading] = useState(false)

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
  const tier      = profile?.tier || 'navigator'
  const isAcc     = tier === 'accelerator'
  const planLabel = isAcc ? 'Accelerator' : 'Navigator'
  const planPrice = isAcc ? '$197' : '$97'

  // ─── Fetch billing data when manage view opens ──────────────────────────

  const fetchBilling = async () => {
    if (!email) return
    setBillingLoading(true)
    setBillingError('')
    try {
      const res  = await fetch(`/api/stripe-billing?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setBilling(data.subscription ?? null)
    } catch {
      setBillingError('Could not load billing information. Please try again.')
    } finally {
      setBillingLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'manage') {
      setShowUpdatePayment(false)
      setShowCancelConfirm(false)
      fetchBilling()
    }
  }, [view])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handlePasswordReset = async () => {
    if (!email) return
    setPwError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`,
    })
    if (error) setPwError(error.message)
    else setPwSent(true)
  }

  const handleCancel = async () => {
    if (!billing) return
    setCancelLoading(true)
    setCancelError('')
    try {
      const res  = await fetch('/api/stripe-billing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'cancel', subscription_id: billing.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBilling(prev => prev ? { ...prev, cancel_at_period_end: true } : prev)
      setShowCancelConfirm(false)
    } catch (err: any) {
      setCancelError(err.message || 'Could not cancel. Please contact support.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!billing) return
    setReactivateLoading(true)
    try {
      const res  = await fetch('/api/stripe-billing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'reactivate', subscription_id: billing.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBilling(prev => prev ? { ...prev, cancel_at_period_end: false } : prev)
    } catch {
      // silent — refresh billing to get true state
      fetchBilling()
    } finally {
      setReactivateLoading(false)
    }
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
        accent: GOLD,
      },
      {
        id:    'contact'   as View,
        icon:  '🎧',
        label: 'Support',
        title: 'Contact Our Team',
        sub:   'Reply within one business day',
        ring:  'rgba(194,24,91,0.15)',
        rbdr:  'rgba(194,24,91,0.35)',
        accent: MAGENTA,
      },
      {
        id:    'protocols' as View,
        icon:  '👥',
        label: 'Community',
        title: 'Community Protocols',
        sub:   'Standards & guidelines',
        ring:  'rgba(212,175,55,0.12)',
        rbdr:  'rgba(212,175,55,0.25)',
        accent: GOLD,
      },
    ]

    return (
      <div style={pageWrap}>

        {/* ── Header (banner image) ── */}
        <div style={{
          padding:   isMobile ? '16px 16px 0' : '24px 40px 0',
          maxWidth:  isMobile ? undefined : 1100,
          margin:    '0 auto',
          boxSizing: 'border-box',
          width:     '100%',
        }}>
          <div style={{ borderRadius: 14, overflow: 'hidden' }}>
            <img
              src={HERO_BANNER_URL}
              alt="Support Hub — How can we help you?"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>

        {/* ── Cards ── */}
        <div style={{
          padding:       isMobile ? '20px 16px' : '20px 40px',
          display:       'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap:           isMobile ? 12 : 16,
          maxWidth:      isMobile ? undefined : 1100,
          margin:        '0 auto',
          boxSizing:     'border-box',
          width:         '100%',
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
              <div style={{
                background:     NAVY,
                padding:        isMobile ? '24px 20px 20px' : '20px 16px 16px',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                minHeight:      isMobile ? 140 : 120,
              }}>
                <div style={{ marginBottom: 12 }}>
                  {<CardIcon id={card.id} color={card.accent} size={isMobile ? 40 : 32} />}
                </div>
                <div style={{
                  fontFamily:    'Montserrat, sans-serif', fontSize: 9,
                  color:         'rgba(255,255,255,0.5)', textTransform: 'uppercase',
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
    const pageContent: React.CSSProperties = {
      padding:   isMobile ? '24px 20px' : '32px 40px',
      maxWidth:  760,
      margin:    '0 auto',
      boxSizing: 'border-box',
      width:     '100%',
    }

    const periodEndDate = billing
      ? new Date(billing.current_period_end * 1000).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })
      : null

    const brandName = (brand: string | null) => {
      if (!brand) return ''
      return brand.charAt(0).toUpperCase() + brand.slice(1)
    }

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
        a: 'Anytime. Use the Cancel Subscription button above — your access stays active until the end of your current billing period.',
      },
      {
        q: 'How do I update my payment method?',
        a: 'Click Update Payment Method above. Your new card details are entered and saved right here — no redirect needed.',
      },
      {
        q: "My payment didn't go through. What now?",
        a: "Almost always an expired card or billing address mismatch. Update your payment method above — our system retries automatically.",
      },
    ]

    return (
      <div style={pageWrap}>
        <div style={{ background: NAVY, position: 'relative', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          <img
            src="/images/support-hub/manage-account-banner.png"
            alt="Manage Your Account"
            style={{ width: '100%', display: 'block' }}
          />
          <button
            onClick={() => setView('landing')}
            style={{ ...backBtn, position: 'absolute', top: 14, left: isMobile ? 16 : 32, marginBottom: 0 }}
          >
            ← Support Hub
          </button>
        </div>

        <div style={pageContent}>

          {/* ── Subscription card ── */}
          <div style={{
            background:     NAVY,
            borderRadius:   12,
            padding:        '18px 20px',
            marginBottom:   20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
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
                background:   billing?.cancel_at_period_end
                  ? 'rgba(255,160,0,0.15)'
                  : 'rgba(100,220,100,0.12)',
                border:       billing?.cancel_at_period_end
                  ? '1px solid rgba(255,160,0,0.3)'
                  : '1px solid rgba(100,220,100,0.25)',
                borderRadius: 20,
                padding:      '5px 12px',
              }}>
                <div style={{
                  width:        6,
                  height:       6,
                  borderRadius: '50%',
                  background:   billing?.cancel_at_period_end ? '#FFA000' : '#66BB6A',
                }} />
                <span style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize:   11,
                  color:      billing?.cancel_at_period_end ? '#FFB300' : '#81C784',
                }}>
                  {billing?.cancel_at_period_end ? 'Cancelling' : 'Active'}
                </span>
              </div>
            </div>

            {/* Billing details from Stripe */}
            {billingLoading && (
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Loading billing details…
              </p>
            )}
            {!billingLoading && billingError && (
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#FF8A80', margin: 0 }}>
                {billingError}
              </p>
            )}
            {!billingLoading && billing && (
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 6 : 24 }}>
                {billing.card_last4 && (
                  <div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 2 }}>
                      PAYMENT METHOD
                    </div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                      {brandName(billing.card_brand)} ···· {billing.card_last4}
                      {billing.card_exp_month && billing.card_exp_year && (
                        <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 8, fontSize: 12 }}>
                          {billing.card_exp_month.toString().padStart(2, '0')}/{billing.card_exp_year.toString().slice(-2)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {periodEndDate && (
                  <div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 2 }}>
                      {billing.cancel_at_period_end ? 'ACCESS ENDS' : 'NEXT BILLING'}
                    </div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                      {periodEndDate}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cancellation notice */}
            {!billingLoading && billing?.cancel_at_period_end && (
              <div style={{
                marginTop:    12,
                background:   'rgba(255,160,0,0.12)',
                border:       '1px solid rgba(255,160,0,0.25)',
                borderRadius: 8,
                padding:      '10px 14px',
                display:      'flex',
                justifyContent: 'space-between',
                alignItems:   'center',
                gap:          12,
                flexWrap:     'wrap',
              }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#FFD54F', margin: 0, lineHeight: 1.5 }}>
                  Your subscription ends on <strong>{periodEndDate}</strong>. You keep full access until then.
                </p>
                <button
                  onClick={handleReactivate}
                  disabled={reactivateLoading}
                  style={{
                    background:   'rgba(255,255,255,0.12)',
                    border:       '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 20,
                    padding:      '5px 14px',
                    fontFamily:   'Montserrat, sans-serif',
                    fontSize:     12,
                    color:        '#fff',
                    cursor:       'pointer',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {reactivateLoading ? 'Reactivating…' : 'Keep My Subscription'}
                </button>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 20 }}>

            {/* Update Payment Method */}
            {!showCancelConfirm && (
              <button
                onClick={() => setShowUpdatePayment(v => !v)}
                style={{
                  flex:         1,
                  background:   showUpdatePayment ? 'rgba(27,77,142,0.08)' : NAVY,
                  color:        showUpdatePayment ? NAVY : '#fff',
                  border:       showUpdatePayment ? `1.5px solid ${NAVY}` : 'none',
                  borderRadius: 32,
                  padding:      '13px 24px',
                  fontFamily:   'Montserrat, sans-serif',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       'pointer',
                  transition:   'all 0.2s',
                }}
              >
                {showUpdatePayment ? 'Hide Payment Form' : 'Update Payment Method'}
              </button>
            )}

            {/* Cancel / Reactivate */}
            {!showUpdatePayment && !billing?.cancel_at_period_end && (
              <button
                onClick={() => setShowCancelConfirm(v => !v)}
                style={{
                  flex:         1,
                  background:   'transparent',
                  color:        showCancelConfirm ? MAGENTA : '#888',
                  border:       showCancelConfirm ? `1.5px solid ${MAGENTA}` : '1.5px solid rgba(0,0,0,0.15)',
                  borderRadius: 32,
                  padding:      '13px 24px',
                  fontFamily:   'Montserrat, sans-serif',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       'pointer',
                  transition:   'all 0.2s',
                }}
              >
                {showCancelConfirm ? 'Never Mind' : 'Cancel Subscription'}
              </button>
            )}

            {/* Password reset */}
            {!showUpdatePayment && !showCancelConfirm && (
              pwSent ? (
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
              )
            )}
          </div>

          {pwError && (
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: MAGENTA, margin: '0 0 16px' }}>
              {pwError}
            </p>
          )}

          {/* ── Stripe Elements: Update Payment Form ── */}
          {showUpdatePayment && !billing && !billingLoading && (
            <div style={{
              background:   'rgba(27,77,142,0.05)',
              border:       '1px solid rgba(27,77,142,0.15)',
              borderRadius: 12,
              padding:      '18px 20px',
              marginBottom: 20,
            }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>
                We couldn't locate your billing record
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.6 }}>
                This can happen if your payment was processed under a different email. Our team can update your payment method directly.
              </p>
              <button
                onClick={() => { setShowUpdatePayment(false); setView('contact') }}
                style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 32, padding: '10px 22px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Contact Our Team →
              </button>
            </div>
          )}

          {showUpdatePayment && billing && (
            <Elements stripe={stripePromise}>
              <UpdatePaymentForm
                customerId={billing.customer_id}
                subscriptionId={billing.id}
                isMobile={isMobile}
                onSuccess={() => {
                  setShowUpdatePayment(false)
                  fetchBilling()
                }}
                onCancel={() => setShowUpdatePayment(false)}
              />
            </Elements>
          )}

          {/* ── Cancel confirmation ── */}
          {showCancelConfirm && !billing && (
            <div style={{
              background:   'rgba(194,24,91,0.05)',
              border:       '1.5px solid rgba(194,24,91,0.2)',
              borderRadius: 12,
              padding:      '18px 20px',
              marginBottom: 20,
            }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: MAGENTA, margin: '0 0 6px' }}>
                We couldn't locate your billing record
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.6 }}>
                Please contact our team to cancel your subscription and we'll take care of it right away.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setShowCancelConfirm(false); setView('contact') }}
                  style={{ background: MAGENTA, color: '#fff', border: 'none', borderRadius: 32, padding: '10px 22px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Contact Our Team →
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  style={{ background: 'transparent', color: '#666', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 32, padding: '10px 22px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, cursor: 'pointer' }}
                >
                  Never Mind
                </button>
              </div>
            </div>
          )}

          {showCancelConfirm && billing && (
            <div style={{
              background:   'rgba(194,24,91,0.05)',
              border:       `1.5px solid rgba(194,24,91,0.2)`,
              borderRadius: 12,
              padding:      '18px 20px',
              marginBottom: 20,
            }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: MAGENTA, margin: '0 0 8px' }}>
                Cancel your subscription?
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#555', margin: '0 0 16px', lineHeight: 1.6 }}>
                You'll keep full access to everything until <strong>{periodEndDate}</strong>. After that, your account will be downgraded and you won't be charged again.
              </p>
              {cancelError && (
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: MAGENTA, margin: '0 0 12px' }}>
                  {cancelError}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  style={{
                    flex:         1,
                    background:   cancelLoading ? '#ccc' : MAGENTA,
                    color:        '#fff',
                    border:       'none',
                    borderRadius: 32,
                    padding:      '11px 20px',
                    fontFamily:   'Montserrat, sans-serif',
                    fontSize:     13,
                    fontWeight:   600,
                    cursor:       cancelLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {cancelLoading ? 'Cancelling…' : 'Yes, Cancel My Subscription'}
                </button>
                <button
                  onClick={() => { setShowCancelConfirm(false); setCancelError('') }}
                  style={{
                    flex:         1,
                    background:   'transparent',
                    color:        '#666',
                    border:       '1px solid rgba(0,0,0,0.15)',
                    borderRadius: 32,
                    padding:      '11px 20px',
                    fontFamily:   'Montserrat, sans-serif',
                    fontSize:     13,
                    cursor:       'pointer',
                  }}
                >
                  Keep My Subscription
                </button>
              </div>
            </div>
          )}

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
            <button
              onClick={() => setView('contact')}
              style={{ background: 'none', border: 'none', color: MAGENTA, fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
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
            <button
              onClick={() => { setView('landing'); resetContact() }}
              style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 32, padding: '12px 28px', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Back to Support Hub
            </button>
          </div>
        </div>
      )
    }

    const canSubmit = !!category && question.trim().length > 0 && !submitting

    return (
      <div style={pageWrap}>
        <div style={{ background: NAVY, position: 'relative', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          <img
            src="/images/support-hub/contact-team-banner.png"
            alt="Contact the Team"
            style={{ width: '100%', display: 'block' }}
          />
          <button
            onClick={() => setView('landing')}
            style={{ ...backBtn, position: 'absolute', top: 14, left: isMobile ? 16 : 32, marginBottom: 0 }}
          >
            ← Support Hub
          </button>
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
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Tell us what's going on in detail..."
            style={{ width: '100%', minHeight: 90, borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', padding: '10px 12px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#333', background: '#fff', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20, outline: 'none', lineHeight: 1.6 }}
          />

          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#333', margin: '0 0 8px' }}>
            Screenshots or documents? <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span>
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: '1.5px dashed rgba(0,0,0,0.15)', borderRadius: 10, padding: '16px', textAlign: 'center', background: '#f7f7f5', cursor: 'pointer', marginBottom: 20 }}
          >
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

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ width: '100%', background: canSubmit ? MAGENTA : '#ccc', color: '#fff', border: 'none', borderRadius: 32, padding: '13px 24px', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
          >
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
        <div style={{ background: NAVY, position: 'relative', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          <img
            src="/images/support-hub/community-protocols-banner.png"
            alt="Community Protocols"
            style={{ width: '100%', display: 'block' }}
          />
          <button
            onClick={() => setView('landing')}
            style={{ ...backBtn, position: 'absolute', top: 14, left: isMobile ? 16 : 32, marginBottom: 0 }}
          >
            ← Support Hub
          </button>
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
              {['DMing members to pitch a product, service, or offer', 'Posting partial insights to push people toward outside content', '"DM me to learn more" or any similar invite to transact', 'Promoting outside tools or programs'].map((item, i) => (
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
            {[
              ['First, a private conversation.', 'Most issues are confusion and resolve here.'],
              ['A clear warning.', 'A repeat offense results in a formal warning and a chance to realign.'],
              ['Removal from the Community.', "Repeated violations result in loss of membership. You'll receive a full explanation."],
            ].map(([step, desc], i) => (
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
