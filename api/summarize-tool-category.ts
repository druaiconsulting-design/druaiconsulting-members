import { createHash } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { AI_ARSENAL_CATEGORIES } from '../src/data/aiArsenalData.js'

export const config = { maxDuration: 30 }

function hashCategory(category: unknown): string {
  return createHash('sha256').update(JSON.stringify(category)).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { categoryId } = req.body || {}
  if (!categoryId) {
    return res.status(400).json({ error: 'categoryId required' })
  }

  const category = AI_ARSENAL_CATEGORIES.find(c => c.id === categoryId)
  if (!category) {
    return res.status(404).json({ error: 'Unknown category' })
  }

  try {
    // ── Verify Supabase session (same pattern as bunny-token.ts) ──
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const accessToken = authHeader.slice(7)

    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      console.error('[summarize-tool-category] Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY env vars')
      return res.status(500).json({ error: 'Server configuration error (Supabase env vars missing)' })
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL as string,
      process.env.VITE_SUPABASE_ANON_KEY as string
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentHash = hashCategory(category)

    // ── Check cache ──
    const { data: cached } = await supabase
      .from('resource_category_summaries')
      .select('summary, content_hash')
      .eq('category_id', categoryId)
      .maybeSingle()

    if (cached && cached.content_hash === currentHash) {
      return res.status(200).json({ summary: JSON.parse(cached.summary), cached: true })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })
    }

    const systemPrompt = `You summarize an AI tool directory category for busy small-business owners. Respond ONLY with valid JSON, no markdown fences, no prose outside the JSON. Schema:
{
  "bullets": [ { "name": string, "meta": string, "body": string } ],
  "quickStart": string,
  "levelUp": string
}
"meta" is exactly "Difficulty | Pricing" (e.g. "Beginner | Free + Paid"). "body" is one tight sentence combining what it's best for plus its 1-2 standout features, in plain language. "quickStart" and "levelUp" are single sentences combining the category's quick-start/level-up guidance, or omit the key if none provided.`

    const userPrompt = `Category: ${category.title}
Description: ${category.description}

Tools:
${category.tools.map(t => `- ${t.name} | ${t.difficulty} | ${t.pricingModel} | Best for: ${t.bestFor} | Features: ${(t.features || []).join('; ')}`).join('\n')}

Quick start tips: ${category.quickStart?.join('; ') || 'none'}
Level up tips: ${category.levelUp?.join('; ') || 'none'}`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      console.error('[summarize-tool-category] Anthropic error:', err)
      return res.status(500).json({ error: `Anthropic error: ${anthropicRes.status}` })
    }

    const data = await anthropicRes.json()
    const raw = data.content?.[0]?.text ?? '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const summary = JSON.parse(cleaned)

    // ── Cache it (shared cache row, not user-specific — upsert as authenticated) ──
    await supabase
      .from('resource_category_summaries')
      .upsert({
        category_id: categoryId,
        summary: JSON.stringify(summary),
        content_hash: currentHash,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'category_id' })

    return res.status(200).json({ summary, cached: false })
  } catch (error) {
    console.error('[summarize-tool-category] Error:', error)
    return res.status(500).json({ error: 'Failed to generate summary' })
  }
}
