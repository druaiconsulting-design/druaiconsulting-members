import { createHash } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Kept separate from api/bunny-token.ts (community/feed video, library 681486)
// so this file stays focused on one thing: signed playback for the paid
// course, library 687850 (DRU_Courses).
//
// Callers: this repo's own LessonPlayer.tsx, and the admin app's
// CourseDashboard.tsx (cross-origin, admin-preview only).
const ALLOWED_ORIGINS = [
  'https://app.druaiconsulting.com',
  'https://members.druaiconsulting.com',
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const videoId = req.query.videoId as string
  if (!videoId) {
    return res.status(400).json({ error: 'videoId required' })
  }

  // Verify Supabase session
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const accessToken = authHeader.slice(7)

  try {
    const supabaseUrl     = process.env.VITE_SUPABASE_URL as string
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string

    // Plain client just to validate the token and resolve the user.
    const authClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken)
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Request-scoped client so the enrollment check runs as this user
    // and respects RLS, rather than trusting a client-asserted user id.
    const scopedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })

    // Gate: the course is always paid — no free/preview tier. Anyone who
    // has bought it has a paid row in course_enrollments, full stop.
    // Exception: the admin account previews course content without a
    // real purchase (same convention as the admin-email checks elsewhere
    // in this codebase, e.g. AcceleratorCircle.tsx).
    const ADMIN_EMAIL = 'deanna@druaiconsulting.com'
    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

    if (!isAdmin) {
      const { data: enrollment } = await scopedClient
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .limit(1)
        .maybeSingle()

      if (!enrollment) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const tokenKey  = process.env.BUNNY_COURSES_TOKEN_AUTH_KEY
    const libraryId = process.env.VITE_BUNNY_COURSES_LIBRARY_ID

    if (!tokenKey || !libraryId) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Token expires in 2 hours
    const expiration = Math.floor(Date.now() / 1000) + 7200

    // Bunny Stream token: SHA256(tokenAuthKey + videoId + expirationTime)
    const token = createHash('sha256')
      .update(tokenKey + videoId + expiration)
      .digest('hex')

    const url =
      `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}` +
      `?token=${token}&expires=${expiration}` +
      `&autoplay=false&loop=false&muted=false&preload=true&responsive=true`

    return res.status(200).json({ url, expires: expiration })

  } catch (err) {
    console.error('[bunny-course-token] error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
