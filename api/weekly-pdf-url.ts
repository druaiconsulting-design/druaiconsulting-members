import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Generates a short-lived signed URL for a file in the private
// `acc-weekly-pdfs` Supabase Storage bucket. Accelerator-tier only.
//
// Pattern mirrors bunny-course-token.ts: verify the caller's session
// with the anon key, re-check entitlement with a request-scoped client
// (so RLS applies to the real user, not a client-asserted id), then use
// the service role key ONLY to mint the signed URL — never to bypass
// the entitlement check itself.

const ALLOWED_ORIGINS = [
  'https://app.druaiconsulting.com',
  'https://members.druaiconsulting.com',
]

const SIGNED_URL_TTL_SECONDS = 15 * 60 // 15 minutes
const ADMIN_EMAIL = 'deanna@druaiconsulting.com'

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

  const path = req.query.path as string
  if (!path) {
    return res.status(400).json({ error: 'path required' })
  }

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

    // Request-scoped client so the tier check runs as this user and
    // respects RLS, rather than trusting a client-asserted user id.
    const scopedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })

    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

    if (!isAdmin) {
      const { data: profile } = await scopedClient
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.tier !== 'accelerator') {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Service role used ONLY here, after entitlement is already confirmed,
    // strictly to mint the signed URL against the private bucket.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data, error: signError } = await adminClient
      .storage
      .from('acc-weekly-pdfs')
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

    if (signError || !data?.signedUrl) {
      return res.status(404).json({ error: 'File not found' })
    }

    return res.status(200).json({
      url: data.signedUrl,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    })

  } catch (err) {
    console.error('[weekly-pdf-url] error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
