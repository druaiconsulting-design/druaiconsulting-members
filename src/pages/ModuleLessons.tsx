import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { navigate } from '../lib/router'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: string
  module_number: number
  title: string
  description: string
}

interface Lesson {
  id: string
  lesson_number: number
  title: string
  description: string
  duration_minutes: number | null
  is_preview: boolean
  completed: boolean
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function Loader() {
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

// ─── Lesson row ───────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  enrolled,
}: {
  lesson: Lesson
  enrolled: boolean
}) {
  const accessible = enrolled || lesson.is_preview

  return (
    <button
      onClick={() => {
        if (!accessible) return
        navigate(`/courses/lesson/${lesson.id}`)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: lesson.completed ? 'rgba(212,175,55,0.05)' : '#fff',
        border: lesson.completed
          ? '1px solid rgba(212,175,55,0.2)'
          : '1px solid rgba(10,35,66,0.08)',
        borderRadius: 12,
        padding: '16px 20px',
        textAlign: 'left',
        cursor: accessible ? 'pointer' : 'default',
        transition: 'transform 0.12s, box-shadow 0.12s',
        width: '100%',
        opacity: accessible ? 1 : 0.45,
      }}
      onMouseEnter={e => {
        if (!accessible) return
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateX(2px)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
      }}
    >
      {/* Status circle */}
      <div style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: lesson.completed
          ? 'linear-gradient(135deg, #D4AF37, #e8c44a)'
          : accessible
            ? 'rgba(10,35,66,0.06)'
            : 'rgba(10,35,66,0.04)',
        border: lesson.completed
          ? 'none'
          : '1px solid rgba(10,35,66,0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: lesson.completed ? 14 : 12,
        color: lesson.completed ? '#fff' : 'rgba(10,35,66,0.4)',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 700,
      }}>
        {lesson.completed ? '✓' : !accessible ? '🔒' : lesson.lesson_number}
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: lesson.description ? 3 : 0,
        }}>
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#0A2342',
          }}>
            {lesson.title}
          </span>

          {lesson.is_preview && !enrolled && (
            <span style={{
              fontSize: 9,
              background: 'rgba(194,24,91,0.1)',
              color: '#C2185B',
              padding: '2px 8px',
              borderRadius: 10,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              Preview
            </span>
          )}
        </div>

        {lesson.description && (
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: 'rgba(10,35,66,0.45)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {lesson.description}
          </div>
        )}
      </div>

      {/* Duration */}
      {lesson.duration_minutes != null && (
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 11,
          color: 'rgba(10,35,66,0.35)',
          flexShrink: 0,
        }}>
          {lesson.duration_minutes} min
        </div>
      )}

      {/* Arrow */}
      {accessible && (
        <div style={{
          color: 'rgba(10,35,66,0.25)',
          fontSize: 20,
          flexShrink: 0,
          lineHeight: 1,
        }}>
          ›
        </div>
      )}
    </button>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ModuleLessons() {
  const { session }               = useAuth()
  const [loading, setLoading]     = useState(true)
  const [mod, setMod]             = useState<Module | null>(null)
  const [lessons, setLessons]     = useState<Lesson[]>([])
  const [enrolled, setEnrolled]   = useState(false)

  // Extract module UUID: /courses/module/{uuid}
  const moduleId = window.location.pathname.split('/')[3]

  useEffect(() => {
    if (!session?.user || !moduleId) return
    loadData()
  }, [session, moduleId])

  async function loadData() {
    setLoading(true)
    try {
      // Verify enrollment
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', session!.user.id)
        .eq('payment_status', 'paid')

      const isEnrolled = !!(enrollments && enrollments.length > 0)
      setEnrolled(isEnrolled)

      // Fetch module
      const { data: modData, error: modErr } = await supabase
        .from('course_modules')
        .select('id, module_number, title, description')
        .eq('id', moduleId)
        .single()

      if (modErr || !modData) {
        navigate('/courses')
        return
      }
      setMod(modData)

      // Fetch active lessons ordered by lesson_number
      const { data: rawLessons } = await supabase
        .from('course_lessons')
        .select('id, lesson_number, title, description, duration_minutes, is_preview')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('lesson_number')

      if (!rawLessons || rawLessons.length === 0) {
        setLessons([])
        setLoading(false)
        return
      }

      // Fetch completion progress if enrolled
      let completedSet = new Set<string>()
      if (isEnrolled) {
        const lessonIds = rawLessons.map(l => l.id)
        const { data: progress } = await supabase
          .from('course_progress')
          .select('lesson_id')
          .eq('user_id', session!.user.id)
          .eq('completed', true)
          .in('lesson_id', lessonIds)

        completedSet = new Set((progress || []).map(p => p.lesson_id))
      }

      setLessons(
        rawLessons.map(l => ({
          ...l,
          completed: completedSet.has(l.id),
        }))
      )
    } catch (err) {
      console.error('ModuleLessons load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !moduleId) return <Loader />
  if (!mod) return null

  const completedCount = lessons.filter(l => l.completed).length
  const totalCount     = lessons.length
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div style={{ padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '16px 12px' : '32px 24px', maxWidth: 740, margin: '0 auto' }}>

      {/* Back nav */}
      <button
        onClick={() => navigate('/courses')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(10,35,66,0.45)',
          padding: 0,
          marginBottom: 28,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        ← Back to Courses
      </button>

      {/* Module header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(10,35,66,0.06)',
          borderRadius: 20,
          padding: '4px 12px',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          color: '#0A2342',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          Week {mod.module_number}
        </div>

        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 24,
          fontWeight: 700,
          color: '#0A2342',
          margin: '0 0 10px',
          lineHeight: 1.3,
        }}>
          {mod.title}
        </h1>

        {mod.description && (
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: '#556',
            lineHeight: 1.6,
            margin: '0 0 18px',
          }}>
            {mod.description}
          </p>
        )}

        {/* Progress row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 340 }}>
          <div style={{
            flex: 1,
            height: 4,
            background: 'rgba(10,35,66,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #D4AF37, #e8c44a)',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: pct > 0 ? '#D4AF37' : 'rgba(10,35,66,0.35)',
            whiteSpace: 'nowrap',
          }}>
            {completedCount} / {totalCount} lessons
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'rgba(10,35,66,0.08)',
        marginBottom: 20,
      }} />

      {/* Lesson list */}
      {lessons.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: 'rgba(10,35,66,0.35)',
        }}>
          Lessons for this module are coming soon.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lessons.map(lesson => (
            <LessonRow key={lesson.id} lesson={lesson} enrolled={enrolled} />
          ))}
        </div>
      )}
    </div>
  )
}
