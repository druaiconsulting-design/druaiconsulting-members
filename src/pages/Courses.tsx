import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { navigate } from '../lib/router'

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_TITLE = 'From Confusion to Confident with AI™'

// TODO: Update feature copy per tier before launch
const TIERS = [
  {
    id: 'self_paced',
    label: 'Self-Paced',
    price: '$1,497',
    badge: null,
    highlight: false,
    features: [
      'Full 4-week course',
      'Lifetime access',
      'AI agent insights per lesson',
      'Framework downloads',
      'Community access',
    ],
    link: 'https://link.druaiconsulting.com/payment-link/69f55d0cb615f70a8a33b5fd',
  },
  {
    id: 'live_cohort',
    label: 'Live Cohort',
    price: '$7,997',
    badge: 'MOST POPULAR',
    highlight: true,
    features: [
      'Everything in Self-Paced',
      'Live cohort coaching calls',
      'Peer accountability group',
      'Accelerator community access',
      'Bonus implementation content',
    ],
    link: 'https://link.druaiconsulting.com/payment-link/69f55e7bb18c99dd72d3c0e5',
  },
  {
    id: 'mastermind',
    label: 'Cohort Mastermind',
    price: '$12,997',
    badge: 'MOST VALUE',
    highlight: false,
    features: [
      'Everything in Live Cohort',
      'VIP Mastermind sessions',
      'Private strategy call',
      'Custom AI transformation roadmap',
      'Priority support + fast-track access',
    ],
    link: 'https://link.druaiconsulting.com/payment-link/69f55bf3b615f70a8a33b5fb',
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseModule {
  id: string
  module_number: number
  title: string
  description: string
  lessonCount: number
  completedCount: number
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function CoursesLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 32,
        height: 32,
        border: '2px solid rgba(212,175,55,0.2)',
        borderTopColor: '#D4AF37',
        borderRadius: '50%',
        animation: 'dru-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

// ─── Locked / unenrolled state ────────────────────────────────────────────────

function LockedState() {
  return (
    <div style={{ padding: '40px 24px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 20,
          padding: '4px 16px',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          color: '#D4AF37',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          DRU AI Flagship Course
        </div>

        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 30,
          fontWeight: 700,
          color: '#0A2342',
          margin: '0 0 14px',
          lineHeight: 1.25,
        }}>
          {COURSE_TITLE}
        </h1>

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          color: '#556',
          maxWidth: 540,
          margin: '0 auto',
          lineHeight: 1.65,
        }}>
          Four weeks. Four transformations. One complete AI readiness journey — built on your DRU CLEAR™ results and delivered by your personal AI leadership team.
        </p>
      </div>

      {/* Pricing cards */}
      <div style={{
        display: 'flex',
        gap: 20,
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            style={{
              flex: '1 1 260px',
              maxWidth: 300,
              background: '#fff',
              border: tier.highlight ? '2px solid #D4AF37' : '1px solid rgba(10,35,66,0.1)',
              borderRadius: 16,
              padding: '28px 24px 24px',
              position: 'relative',
              boxShadow: tier.highlight
                ? '0 12px 40px rgba(212,175,55,0.14)'
                : '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            {/* Badge */}
            {tier.badge && (
              <div style={{
                position: 'absolute',
                top: -13,
                left: '50%',
                transform: 'translateX(-50%)',
                background: tier.highlight ? '#D4AF37' : '#0A2342',
                color: tier.highlight ? '#0A2342' : '#D4AF37',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.12em',
                padding: '4px 14px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
              }}>
                {tier.badge}
              </div>
            )}

            {/* Tier name */}
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: '#0A2342',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 6,
            }}>
              {tier.label}
            </div>

            {/* Price */}
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 34,
              fontWeight: 700,
              color: tier.highlight ? '#D4AF37' : '#0A2342',
              marginBottom: 22,
              lineHeight: 1,
            }}>
              {tier.price}
            </div>

            {/* Features */}
            <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {tier.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <span style={{ color: '#D4AF37', fontSize: 13, lineHeight: '1.5', flexShrink: 0 }}>✓</span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                    color: '#4a4a5a',
                    lineHeight: 1.45,
                  }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href={tier.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                padding: '13px 0',
                borderRadius: 8,
                background: tier.highlight
                  ? 'linear-gradient(135deg, #D4AF37 0%, #e8c44a 100%)'
                  : '#0A2342',
                color: tier.highlight ? '#0A2342' : '#D4AF37',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                boxSizing: 'border-box',
                transition: 'opacity 0.15s',
              }}
            >
              Enroll Now
            </a>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        color: 'rgba(10,35,66,0.35)',
        marginTop: 36,
      }}>
        Questions about which tier is right for you?{' '}
        <a href="/support" style={{ color: '#D4AF37', textDecoration: 'none' }}>
          Contact support
        </a>
      </p>
    </div>
  )
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod }: { mod: CourseModule }) {
  const pct = mod.lessonCount > 0
    ? Math.round((mod.completedCount / mod.lessonCount) * 100)
    : 0
  const isComplete = mod.lessonCount > 0 && pct === 100

  return (
    <button
      onClick={() => navigate(`/courses/module/${mod.id}`)}
      style={{
        background: '#fff',
        border: isComplete
          ? '1px solid rgba(212,175,55,0.35)'
          : '1px solid rgba(10,35,66,0.08)',
        borderRadius: 16,
        padding: 24,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'
      }}
    >
      {/* Completion top stripe */}
      {isComplete && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #D4AF37, #e8c44a)',
        }} />
      )}

      {/* Week badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(10,35,66,0.06)',
        borderRadius: 20,
        padding: '3px 11px',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        color: '#0A2342',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        Week {mod.module_number}
        {isComplete && (
          <span style={{ color: '#D4AF37', fontSize: 11 }}>✓</span>
        )}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 18,
        fontWeight: 700,
        color: '#0A2342',
        marginBottom: 8,
        lineHeight: 1.3,
      }}>
        {mod.title}
      </div>

      {/* Description */}
      {mod.description && (
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: '#666',
          lineHeight: 1.55,
          marginBottom: 18,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {mod.description}
        </div>
      )}

      {/* Stats row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 11,
          color: 'rgba(10,35,66,0.45)',
        }}>
          {mod.lessonCount} {mod.lessonCount === 1 ? 'lesson' : 'lessons'}
        </span>
        <span style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: pct > 0 ? '#D4AF37' : 'rgba(10,35,66,0.35)',
        }}>
          {pct}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4,
        background: 'rgba(10,35,66,0.07)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #D4AF37, #e8c44a)',
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </button>
  )
}

// ─── Enrolled view ────────────────────────────────────────────────────────────

function EnrolledView({
  modules,
  overallProgress,
}: {
  modules: CourseModule[]
  overallProgress: number
}) {
  return (
    <div style={{ padding: '36px 24px', maxWidth: 960, margin: '0 auto' }}>

      {/* Course header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 20,
          padding: '4px 14px',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          color: '#D4AF37',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          DRU AI Flagship Course
        </div>

        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 26,
          fontWeight: 700,
          color: '#0A2342',
          margin: '0 0 18px',
          lineHeight: 1.3,
        }}>
          {COURSE_TITLE}
        </h1>

        {/* Overall progress bar */}
        <div style={{ maxWidth: 380 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 7,
          }}>
            <span style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 11,
              color: 'rgba(10,35,66,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              Overall Progress
            </span>
            <span style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: overallProgress > 0 ? '#D4AF37' : 'rgba(10,35,66,0.3)',
            }}>
              {overallProgress}%
            </span>
          </div>
          <div style={{
            height: 6,
            background: 'rgba(10,35,66,0.08)',
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${overallProgress}%`,
              background: 'linear-gradient(90deg, #D4AF37, #e8c44a)',
              borderRadius: 6,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Module grid */}
      {modules.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: 'rgba(10,35,66,0.35)',
        }}>
          Course content is being prepared — check back soon!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {modules.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Courses() {
  const { session } = useAuth()
  const [loading, setLoading]               = useState(true)
  const [enrolled, setEnrolled]             = useState(false)
  const [modules, setModules]               = useState<CourseModule[]>([])
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    if (!session?.user) return
    loadData()
  }, [session])

  async function loadData() {
    setLoading(true)
    try {
      // Check enrollment (payment_status = 'paid')
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', session!.user.id)
        .eq('payment_status', 'paid')

      if (!enrollments || enrollments.length === 0) {
        setEnrolled(false)
        setLoading(false)
        return
      }

      setEnrolled(true)

      // Fetch active modules ordered by module_number
      const { data: mods } = await supabase
        .from('course_modules')
        .select('id, module_number, title, description')
        .eq('is_active', true)
        .order('module_number')

      if (!mods || mods.length === 0) {
        setModules([])
        setLoading(false)
        return
      }

      const moduleIds = mods.map(m => m.id)

      // Fetch active lesson IDs per module
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, module_id')
        .in('module_id', moduleIds)
        .eq('is_active', true)

      // Fetch completed progress
      const lessonIds = (lessons || []).map(l => l.id)
      let completedSet = new Set<string>()

      if (lessonIds.length > 0) {
        const { data: progress } = await supabase
          .from('course_progress')
          .select('lesson_id')
          .eq('user_id', session!.user.id)
          .eq('completed', true)
          .in('lesson_id', lessonIds)

        completedSet = new Set((progress || []).map(p => p.lesson_id))
      }

      // Group lessons by module_id
      const lessonsByModule: Record<string, string[]> = {}
      for (const l of lessons || []) {
        if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
        lessonsByModule[l.module_id].push(l.id)
      }

      const modulesWithStats: CourseModule[] = mods.map(m => ({
        ...m,
        lessonCount: lessonsByModule[m.id]?.length || 0,
        completedCount: (lessonsByModule[m.id] || []).filter(id => completedSet.has(id)).length,
      }))

      setModules(modulesWithStats)

      const totalLessons  = (lessons || []).length
      const totalCompleted = completedSet.size
      setOverallProgress(
        totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0
      )
    } catch (err) {
      console.error('Courses load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading)    return <CoursesLoader />
  if (!enrolled)  return <LockedState />
  return <EnrolledView modules={modules} overallProgress={overallProgress} />
}
