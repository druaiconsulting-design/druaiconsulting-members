import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { navigate } from '../lib/router'

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_TITLE = 'From Confusion to Confidence with AI™'

const NAVY       = '#0A2342'
const GOLD       = '#D4AF37'
const WARM_WHITE = '#FAFAF8'

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
        borderTopColor: GOLD,
        borderRadius: '50%',
        animation: 'dru-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

// ─── Coming Soon state ────────────────────────────────────────────────────────

function ComingSoonState() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div style={{
      minHeight:      '70vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        isMobile ? '40px 24px' : '60px 40px',
      background:     WARM_WHITE,
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>

        {/* Coming Soon pill */}
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           8,
          background:    'rgba(10,35,66,0.06)',
          border:        '1px solid rgba(10,35,66,0.12)',
          borderRadius:  20,
          padding:       '5px 18px',
          marginBottom:  28,
        }}>
          <div style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   GOLD,
            animation:    'dru-pulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily:    'Cinzel, serif',
            fontSize:      10,
            fontWeight:    600,
            color:         NAVY,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            Coming Soon
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize:   isMobile ? 28 : 36,
          fontWeight: 700,
          color:      NAVY,
          margin:     '0 0 18px',
          lineHeight: 1.2,
        }}>
          {COURSE_TITLE}
        </h1>

        {/* Course banner image */}
        <img
          src="/from-confusion-to-confidence-banner.png"
          alt="From Confusion to Confidence with AI"
          style={{
            width:        '100%',
            maxWidth:     420,
            borderRadius: 14,
            boxShadow:    '0 10px 30px rgba(10,35,66,0.18)',
            margin:       '0 0 28px',
          }}
        />

        {/* Quote pill */}
        <div style={{
          display:       'inline-flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          background:    'rgba(10,35,66,0.04)',
          border:        '1px solid rgba(212,175,55,0.3)',
          borderRadius:  999,
          padding:       isMobile ? '22px 26px' : '26px 40px',
          maxWidth:      480,
        }}>
          <p style={{
            fontFamily: 'Playfair Display, serif',
            fontStyle:  'italic',
            fontSize:   isMobile ? 14 : 16,
            color:      NAVY,
            lineHeight: 1.55,
            margin:     0,
          }}>
            "The real bottleneck isn't the tools — it's the strategy they're bolted onto."
          </p>
          <span style={{
            fontFamily:    'Montserrat, sans-serif',
            fontSize:      11,
            fontWeight:    700,
            color:         GOLD,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            — DeAnna R Upshaw
          </span>
        </div>

      </div>
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
        background:   '#fff',
        border:       isComplete
          ? '1px solid rgba(212,175,55,0.35)'
          : '1px solid rgba(10,35,66,0.08)',
        borderRadius: 16,
        padding:      24,
        textAlign:    'left',
        cursor:       'pointer',
        transition:   'transform 0.15s, box-shadow 0.15s',
        boxShadow:    '0 2px 12px rgba(0,0,0,0.05)',
        width:        '100%',
        position:     'relative',
        overflow:     'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform  = 'translateY(-2px)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform  = 'translateY(0)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'
      }}
    >
      {/* Completion top stripe */}
      {isComplete && (
        <div style={{
          position:   'absolute',
          top: 0, left: 0, right: 0,
          height:     3,
          background: 'linear-gradient(90deg, #D4AF37, #e8c44a)',
        }} />
      )}

      {/* Module badge */}
      <div style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        background:    'rgba(10,35,66,0.06)',
        borderRadius:  20,
        padding:       '3px 11px',
        fontFamily:    'Montserrat, sans-serif',
        fontSize:      10,
        fontWeight:    700,
        color:         NAVY,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom:  12,
      }}>
        Module {mod.module_number}
        {isComplete && (
          <span style={{ color: GOLD, fontSize: 11 }}>✓</span>
        )}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize:   18,
        fontWeight: 700,
        color:      NAVY,
        marginBottom: 8,
        lineHeight: 1.3,
      }}>
        {mod.title}
      </div>

      {/* Description */}
      {mod.description && (
        <div style={{
          fontFamily:        'Inter, sans-serif',
          fontSize:          13,
          color:             '#666',
          lineHeight:        1.55,
          marginBottom:      18,
          display:           '-webkit-box',
          WebkitLineClamp:   2,
          WebkitBoxOrient:   'vertical',
          overflow:          'hidden',
        }}>
          {mod.description}
        </div>
      )}

      {/* Stats row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   8,
      }}>
        <span style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize:   11,
          color:      'rgba(10,35,66,0.45)',
        }}>
          {mod.lessonCount} {mod.lessonCount === 1 ? 'lesson' : 'lessons'}
        </span>
        <span style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize:   11,
          fontWeight: 700,
          color:      pct > 0 ? GOLD : 'rgba(10,35,66,0.35)',
        }}>
          {pct}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height:       4,
        background:   'rgba(10,35,66,0.07)',
        borderRadius: 4,
        overflow:     'hidden',
      }}>
        <div style={{
          height:     '100%',
          width:      `${pct}%`,
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
    <div style={{ padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '20px 12px' : '36px 24px', maxWidth: 960, margin: '0 auto' }}>

      {/* Course header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display:       'inline-block',
          background:    'rgba(212,175,55,0.1)',
          border:        '1px solid rgba(212,175,55,0.3)',
          borderRadius:  20,
          padding:       '4px 14px',
          fontFamily:    'Montserrat, sans-serif',
          fontSize:      10,
          fontWeight:    700,
          color:         GOLD,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom:  12,
        }}>
          DRU AI Flagship Course
        </div>

        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize:   26,
          fontWeight: 700,
          color:      NAVY,
          margin:     '0 0 18px',
          lineHeight: 1.3,
        }}>
          {COURSE_TITLE}
        </h1>

        {/* Overall progress bar */}
        <div style={{ maxWidth: 380 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{
              fontFamily:    'Montserrat, sans-serif',
              fontSize:      11,
              color:         'rgba(10,35,66,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight:    600,
            }}>
              Overall Progress
            </span>
            <span style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize:   11,
              fontWeight: 700,
              color:      overallProgress > 0 ? GOLD : 'rgba(10,35,66,0.3)',
            }}>
              {overallProgress}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(10,35,66,0.08)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height:       '100%',
              width:        `${overallProgress}%`,
              background:   'linear-gradient(90deg, #D4AF37, #e8c44a)',
              borderRadius: 6,
              transition:   'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Module grid */}
      {modules.length === 0 ? (
        <div style={{
          textAlign:  'center',
          padding:    '64px 24px',
          fontFamily: 'Inter, sans-serif',
          fontSize:   14,
          color:      'rgba(10,35,66,0.35)',
        }}>
          Course content is being prepared — check back soon!
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap:                 20,
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
  const [loading,          setLoading]          = useState(true)
  const [enrolled,         setEnrolled]         = useState(false)
  const [modules,          setModules]          = useState<CourseModule[]>([])
  const [overallProgress,  setOverallProgress]  = useState(0)

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
        lessonCount:    lessonsByModule[m.id]?.length || 0,
        completedCount: (lessonsByModule[m.id] || []).filter(id => completedSet.has(id)).length,
      }))

      setModules(modulesWithStats)

      const totalLessons    = (lessons || []).length
      const totalCompleted  = completedSet.size
      setOverallProgress(
        totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0
      )
    } catch (err) {
      console.error('Courses load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading)   return <CoursesLoader />
  if (!enrolled) return <ComingSoonState />
  return <EnrolledView modules={modules} overallProgress={overallProgress} />
}
