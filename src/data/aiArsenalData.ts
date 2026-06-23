import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AI_ARSENAL_CATEGORIES } from '../src/data/aiArsenalData'

// Read-only catalog feed for the AI Arsenal directory.
// druaiconsulting-members remains the single source of truth — the data
// itself lives only in src/data/aiArsenalData.ts and is edited there.
// This endpoint exists so the admin app (app.druaiconsulting.com) can
// display the same catalog without duplicating the data into that repo.
// No write path is exposed on purpose — edits to the catalog happen by
// editing aiArsenalData.ts directly, not through this endpoint.

const ALLOWED_ORIGINS = [
  'https://app.druaiconsulting.com',
  'https://members.druaiconsulting.com',
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')

  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    return res.status(200).json({ categories: AI_ARSENAL_CATEGORIES })
  } catch (err) {
    console.error('[ai-arsenal] error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
