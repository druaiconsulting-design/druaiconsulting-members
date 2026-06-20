import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { navigate } from '../lib/router'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string
  module_id: string
  lesson_number: number
  title: string
  description: string | null
  bunny_video_id: string | null
  duration_minutes: number | null
  resources: { title: string; url: string }[] | null
  agent_insight: string | null
  agent_name: string | null
  is_preview: boolean
}

interface SiblingLesson {
  id: string
  lesson_number: number
  title: string
}

interface ModuleInfo {
  id: string
  module_number: number
  title: string
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

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LessonPlayer() {
  const { session } = useAuth()

  const [loading, setLoading]           = useState(true)
  const [lesson, setLesson]             = useState<Lesson | null>(null)
  const [mod, setMod]                   = useState<ModuleInfo | null>(null)
  const [prevLesson, setPrevLesson]     = useState<SiblingLesson | null>(null)
  const [nextLesson, setNextLesson]     = useState<SiblingLesson | null>(null)
  const [videoUrl, setVideoUrl]         = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [completed, setCompleted]       = useState(false)
  const [completing, setCompleting]     = useState(false)

  // /courses/lesson/{uuid} → index 3
  const lessonId = window.location.pathname.split('/')[3]

  useEffect(() => {
    if (!session?.user || !lessonId) return
    loadData()
  }, [session, lessonId])

  async function loadData() {
    setLoading(true)
    try {
      // 1. Fetch lesson
      const { data: lessonData, error: lessonErr } = await supabase
        .from('course_lessons')
        .select('id, module_id, lesson_number, title, description, bunny_video_id, duration_minutes, resources, agent_insight, agent_name, is_preview')
        .eq('id', lessonId)
        .single()

      if (lessonErr || !lessonData) {
        navigate('/courses')
        return
      }

      // 2. Check enrollment
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', session!.user.id)
        .eq('payment_status', 'paid')

      const isEnrolled = !!(enrollments && enrollments.length > 0)

      // Gate: unenrolled + non-preview → back to courses
      if (!isEnrolled && !lessonData.is_preview) {
        navigate('/courses')
        return
      }

      setLesson(lessonData)

      // 3. Fetch module info
      const { data: modData } = await supabase
        .from('course_modules')
        .select('id, module_number, title')
        .eq('id', lessonData.module_id)
        .single()

      if (modData) setMod(modData)

      // 4. Fetch all sibling lessons for prev/next navigation
      const { data: siblings } = await supabase
        .from('course_lessons')
        .select('id, lesson_number, title')
        .eq('module_id', lessonData.module_id)
        .eq('is_active', true)
        .order('lesson_number')

      if (siblings) {
        const idx = siblings.findIndex(l => l.id === lessonId)
        setPrevLesson(idx > 0 ? siblings[idx - 1] : null)
        setNextLesson(idx < siblings.length - 1 ? siblings[idx + 1] : null)
      }

      // 5. Check completion status
      if (isEnrolled) {
        const { data: progress } = await supabase
          .from('course_progress')
          .select('completed')
          .eq('user_id', session!.user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle()

        setCompleted(!!progress?.completed)
      }

      // 6. Fetch signed Bunny URL if video exists
      if (lessonData.bunny_video_id) {
        setVideoLoading(true)
        try {
          const resp = await fetch(
            `/api/bunny-course-token?videoId=${lessonData.bunny_video_id}`,
            { headers: { Authorization: `Bearer ${session!.access_token}` } }
          )
          if (resp.ok) {
            const { url } = await resp.json()
            setVideoUrl(url)
          }
        } catch (err) {
          console.error('[LessonPlayer] bunny token error:', err)
        } finally {
          setVideoLoading(false)
        }
      }

    } catch (err) {
      console.error('[LessonPlayer] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkComplete() {
    if (!session?.user || completing || completed) return
    setCompleting(true)
    try {
      await supabase
        .from('course_progress')
        .upsert({
          user_id: session.user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })

      setCompleted(true)

      // Auto-advance to next lesson after brief pause
      if (nextLesson) {
        setTimeout(() => navigate(`/courses/lesson/${nextLesson.id}`), 700)
      }
    } catch (err) {
      console.error('[LessonPlayer] mark complete error:', err)
    } finally {
      setCompleting(false)
    }
  }

  if (loading || !lessonId) return <Loader />
  if (!lesson) return null

  // ─── Derived initials for agent avatar ──────────────────────────────────────
  const agentInitials = lesson.agent_name
    ? lesson.agent_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AI'

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '16px 12px' : '28px 24px', maxWidth: 900, margin: '0 auto' }}>

      {/* Back nav + week/lesson badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <button
          onClick={() => navigate(`/courses/module/${lesson.module_id}`)}
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
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          ← {mod ? `Week ${mod.module_number}: ${mod.title}` : 'Back to Module'}
        </button>

        {mod && (
          <div style={{
            background: 'rgba(10,35,66,0.07)',
            borderRadius: 20,
            padding: '4px 14px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            color: '#0A2342',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Week {mod.module_number} · Lesson {lesson.lesson_number}
          </div>
        )}
      </div>

      {/* Lesson title */}
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 24,
        fontWeight: 700,
        color: '#0A2342',
        margin: '0 0 10px',
        lineHeight: 1.3,
      }}>
        {lesson.title}
      </h1>

      {/* Meta row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        {lesson.duration_minutes != null && (
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11,
            color: 'rgba(10,35,66,0.45)',
            fontWeight: 500,
          }}>
            ⏱ {lesson.duration_minutes} min
          </span>
        )}
        {lesson.is_preview && (
          <span style={{
            fontSize: 9,
            background: 'rgba(194,24,91,0.1)',
            color: '#C2185B',
            padding: '2px 10px',
            borderRadius: 10,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Free Preview
          </span>
        )}
        {completed && (
          <span style={{
            fontSize: 9,
            background: 'rgba(212,175,55,0.12)',
            color: '#B8941F',
            padding: '2px 10px',
            borderRadius: 10,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            ✓ Completed
          </span>
        )}
      </div>

      {/* Video player */}
      <div style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        background: '#0A2342',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        border: '1px solid rgba(10,35,66,0.15)',
      }}>
        {videoLoading ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 32,
              height: 32,
              border: '2px solid rgba(212,175,55,0.2)',
              borderTopColor: '#D4AF37',
              borderRadius: '50%',
              animation: 'dru-spin 0.8s linear infinite',
            }} />
          </div>
        ) : videoUrl ? (
          <iframe
            src={videoUrl}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              border: 'none',
            }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}>
            <div style={{ fontSize: 36, opacity: 0.25 }}>🎬</div>
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Video coming soon
            </p>
          </div>
        )}
      </div>

      {/* Lesson description */}
      {lesson.description && (
        <div style={{
          padding: '16px 20px',
          background: '#fff',
          border: '1px solid rgba(10,35,66,0.08)',
          borderRadius: 10,
          marginBottom: 18,
        }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: 'rgba(10,35,66,0.7)',
            lineHeight: 1.7,
            margin: 0,
          }}>
            {lesson.description}
          </p>
        </div>
      )}

      {/* Agent insight + Resources */}
      {(lesson.agent_insight || (lesson.resources && lesson.resources.length > 0)) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns:
            lesson.agent_insight && lesson.resources?.length
              ? 'repeat(auto-fit, minmax(280px, 1fr))'
              : '1fr',
          gap: 16,
          marginBottom: 24,
        }}>

          {/* Agent insight */}
          {lesson.agent_insight && (
            <div style={{
              background: '#fff',
              border: '1px solid rgba(212,175,55,0.25)',
              borderLeft: '3px solid #D4AF37',
              borderRadius: 10,
              padding: '18px 20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#0A2342',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#D4AF37',
                  flexShrink: 0,
                }}>
                  {agentInitials}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#D4AF37',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}>
                    Agent Insight
                  </div>
                  {lesson.agent_name && (
                    <div style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#0A2342',
                    }}>
                      {lesson.agent_name}
                    </div>
                  )}
                </div>
              </div>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: 'rgba(10,35,66,0.7)',
                lineHeight: 1.65,
                fontStyle: 'italic',
                margin: 0,
              }}>
                "{lesson.agent_insight}"
              </p>
            </div>
          )}

          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <div style={{
              background: '#fff',
              border: '1px solid rgba(10,35,66,0.08)',
              borderRadius: 10,
              padding: '18px 20px',
            }}>
              <div style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                color: '#0A2342',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.5,
                marginBottom: 12,
              }}>
                Lesson Resources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lesson.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'rgba(212,175,55,0.05)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: 8,
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      background: 'rgba(10,35,66,0.06)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      flexShrink: 0,
                    }}>
                      📄
                    </div>
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#0A2342',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {r.title}
                    </div>
                    <span style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#B8941F',
                      flexShrink: 0,
                    }}>
                      ↓
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: '#fff',
        border: '1px solid rgba(10,35,66,0.08)',
        borderRadius: 12,
      }}>

        {/* Prev */}
        <button
          onClick={() => prevLesson && navigate(`/courses/lesson/${prevLesson.id}`)}
          disabled={!prevLesson}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: prevLesson ? 'pointer' : 'default',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(10,35,66,0.4)',
            padding: '8px 14px',
            borderRadius: 8,
            opacity: prevLesson ? 1 : 0.3,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          ← Prev
        </button>

        {/* Complete / Completed */}
        {!completed ? (
          <button
            onClick={handleMarkComplete}
            disabled={completing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: completing ? 'rgba(10,35,66,0.1)' : '#0A2342',
              color: '#D4AF37',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 8,
              cursor: completing ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {completing ? 'Saving...' : '✓ Mark Complete'}
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 8,
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#B8941F',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            ✓ Completed
          </div>
        )}

        {/* Next */}
        <button
          onClick={() => nextLesson && navigate(`/courses/lesson/${nextLesson.id}`)}
          disabled={!nextLesson}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: nextLesson ? 'pointer' : 'default',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(10,35,66,0.4)',
            padding: '8px 14px',
            borderRadius: 8,
            opacity: nextLesson ? 1 : 0.3,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Next →
        </button>
      </div>

    </div>
  )
}
