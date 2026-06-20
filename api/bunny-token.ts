import { createHash } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Allowed cross-origin callers. This endpoint's secrets (BUNNY_TOKEN_AUTH_KEY,
// VITE_BUNNY_LIBRARY_ID) live only in this repo's Vercel project — the admin
// app (app.druaiconsulting.com) calls out to this endpoint rather than
// keeping its own copy of the Bunny credentials.
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
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL as string,
      process.env.VITE_SUPABASE_ANON_KEY as string
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const tokenKey  = process.env.BUNNY_TOKEN_AUTH_KEY
    const libraryId = process.env.VITE_BUNNY_LIBRARY_ID

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
      `&autoplay=true&loop=false&muted=true&preload=true&responsive=true`

    return res.status(200).json({ url, expires: expiration })

  } catch (err) {
    console.error('[bunny-token] error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
