import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { navigate } from '../lib/router'
import { startHereSteps } from '../data/startHereSteps'

const NAVY       = '#0A2342'
const GOLD       = '#D4AF37'
const MAGENTA    = '#C2185B'
const WARM_WHITE = '#FAFAF8'

const ACCELERATOR_PAYMENT_LINK = 'https://link.druaiconsulting.com/payment-link/69ead3d37dd3512d920794b1'

interface CompletionRow {
  step_number: number
  completed: boolean
  completed_at: string | null
}

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 32,
        height: 32,
        border: '2px solid rgba(212,175,55,0.2)',
        borderTopColor: GOLD,
        borderRadius: '50%',
        animation: 'dru-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

export default function StartHere() {
  const { user, isAccelerator } = useAuth()
  const [completions, setCompletions] = useState<Record<number, CompletionRow>>({})
  const [loading, setLoading] = useState(true)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    if (!user) return
    const userId = user.id
    let active = true

    async function load() {
      const { data, error } = await supabase
        .from('member_onboarding_steps')
        .select('step_number, completed, completed_at')
        .eq('user_id', userId)

      if (!active) return
      if (error) {
        console.error('Failed to load Start Here progress:', error)
        setLoading(false)
        return
      }

      const map: Record<number, CompletionRow> = {}
      ;(data || []).forEach((row) => {
        map[row.step_number] = row
      })
      setCompletions(map)
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [user])

  const visibleSteps = startHereSteps.filter(
    (s) => !s.tierGated || (s.tierGated === 'accelerator' && isAccelerator) || s.tierGated === 'accelerator'
  )
  // Accelerator-gated steps still render for Navigators, but as an upgrade prompt rather than a checkable item.

  const completedCount = startHereSteps.filter(
    (s) => completions[s.step_number]?.completed && (!s.tierGated || isAccelerator)
  ).length
  const totalCount = startHereSteps.filter((s) => !s.tierGated || isAccelerator).length

  async function toggleStep(stepNumber: number) {
    if (!user) return
    const userId = user.id
    const current = completions[stepNumber]
    const nextCompleted = !current?.completed

    // Optimistic update
    setCompletions((prev) => ({
      ...prev,
      [stepNumber]: {
        step_number: stepNumber,
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      },
    }))

    const { error } = await supabase
      .from('member_onboarding_steps')
      .upsert(
        {
          user_id: userId,
          step_number: stepNumber,
          completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,step_number' }
      )

    if (error) {
      console.error('Failed to update Start Here step:', error)
      // Revert optimistic update on failure
      setCompletions((prev) => ({ ...prev, [stepNumber]: current as CompletionRow }))
    }
  }

  if (loading) return <Loader />

  return (
    <div style={{ background: WARM_WHITE, minHeight: '100%', padding: isMobile ? '24px 16px 60px' : '40px 40px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Welcome hero + video */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 28 : 36,
            color: NAVY,
            margin: '0 0 16px',
          }}>
            Welcome
          </h1>

          <div style={{
            position: 'relative',
            paddingTop: '56.25%',
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: 20,
            boxShadow: '0 8px 24px rgba(10,35,66,0.12)',
          }}>
            <iframe
              src="https://player.mediadelivery.net/embed/677927/cb7b3b09-7e7f-4b8e-a103-95c8a927a04a?autoplay=true&loop=false&muted=true&preload=true&responsive=true"
              loading="lazy"
              style={{ border: 0, position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }}
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen;"
              allowFullScreen
            />
          </div>

          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: GOLD,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Start Here
          </div>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'rgba(10,35,66,0.6)',
            margin: 0,
          }}>
            A quick walkthrough to get you oriented and connected.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12,
            color: 'rgba(10,35,66,0.55)',
            marginBottom: 6,
          }}>
            <span>{completedCount} of {totalCount} complete</span>
            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(10,35,66,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(completedCount / totalCount) * 100}%`,
              background: `linear-gradient(90deg, ${GOLD}, ${MAGENTA})`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleSteps.map((step) => {
            const isLocked = step.tierGated === 'accelerator' && !isAccelerator
            const row = completions[step.step_number]
            const isComplete = !!row?.completed

            return (
              <div
                key={step.step_number}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  background: '#FFFFFF',
                  border: `1px solid ${isComplete ? 'rgba(212,175,55,0.35)' : 'rgba(10,35,66,0.10)'}`,
                  borderRadius: 14,
                  padding: isMobile ? '14px 16px' : '16px 20px',
                  opacity: isLocked ? 0.7 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => !isLocked && toggleStep(step.step_number)}
                  disabled={isLocked}
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: `2px solid ${isComplete ? GOLD : 'rgba(10,35,66,0.25)'}`,
                    background: isComplete ? GOLD : 'transparent',
                    cursor: isLocked ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                    padding: 0,
                  }}
                >
                  {isComplete && <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: NAVY,
                    marginBottom: 4,
                  }}>
                    {step.step_number}. {step.title}
                    {step.tierGated === 'accelerator' && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        color: MAGENTA,
                        textTransform: 'uppercase',
                        verticalAlign: 'middle',
                      }}>
                        Accelerator
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: 'rgba(10,35,66,0.6)',
                    lineHeight: 1.5,
                    marginBottom: step.ctaPath ? 10 : 0,
                  }}>
                    {step.description}
                  </div>

                  {isLocked ? (
                    <a
                      href={ACCELERATOR_PAYMENT_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: MAGENTA,
                        textDecoration: 'none',
                      }}
                    >
                      Upgrade to Accelerator →
                    </a>
                  ) : step.ctaPath && (
                    <button
                      onClick={() => navigate(step.ctaPath!)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: GOLD,
                      }}
                    >
                      {step.ctaLabel} →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
