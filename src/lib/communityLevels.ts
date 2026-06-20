// =============================================================================
// COMMUNITY LEVELS — single source of truth for tier names, point thresholds,
// and badge colors. Backed by the `community_level_tiers` table in Supabase
// (also read by compute_community_level() there, and by the dru-clear-app
// admin repo's own copy of this file) — so the tier ladder only needs to be
// edited in ONE place: that table.
//
// This module fetches the table once, caches it in memory, and shares that
// single fetch across every component that calls useCommunityLevels() —
// a leaderboard page with 10 rows + badges does not trigger 10 fetches.
// If the fetch fails for any reason, FALLBACK_LEVELS (last-known-good,
// hardcoded) is used so badges never render blank.
// =============================================================================

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export interface LevelTier {
  name:  string
  min:   number
  bg:    string
  color: string
}

// ── Fallback — last known-good values, used only if the Supabase fetch fails ──
const FALLBACK_LEVELS: LevelTier[] = [
  { name: 'Connected',    min: 0,    bg: '#FAFAF8', color: '#0A2342' },
  { name: 'Communicated', min: 10,   bg: '#DFE5EB', color: '#1B4D8E' },
  { name: 'Contributor',  min: 20,   bg: '#C2CFDE', color: '#1B4D8E' },
  { name: 'Encourager',   min: 40,   bg: '#F4EFDB', color: '#947B27' },
  { name: 'Leader',       min: 80,   bg: '#EFE4BE', color: '#947B27' },
  { name: 'Influencer',   min: 160,  bg: '#D4AF37', color: '#0A2342' },
  { name: 'Cultivator',   min: 320,  bg: '#F2D8E0', color: '#881140' },
  { name: 'Cornerstone',  min: 640,  bg: '#E9B6C9', color: '#881140' },
  { name: 'Changemaker',  min: 1280, bg: '#0A2342', color: '#D4AF37' },
]

// ── Module-level cache + subscriber set ───────────────────────────────────────
let cachedLevels: LevelTier[] = FALLBACK_LEVELS
let hasFetched   = false
let inflight: Promise<LevelTier[]> | null = null
const subscribers = new Set<() => void>()

async function fetchLevels(): Promise<LevelTier[]> {
  const { data, error } = await supabase
    .from('community_level_tiers')
    .select('level_name, min_points, bg_color, text_color')
    .order('sort_order', { ascending: true })

  if (error || !data || data.length === 0) return FALLBACK_LEVELS

  return data.map(r => ({
    name:  r.level_name,
    min:   r.min_points,
    bg:    r.bg_color,
    color: r.text_color,
  }))
}

function ensureLoaded() {
  if (hasFetched || inflight) return
  inflight = fetchLevels().then(levels => {
    cachedLevels = levels
    hasFetched   = true
    inflight     = null
    subscribers.forEach(fn => fn())
    return levels
  })
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Synchronous best-effort read — returns cached/fallback levels immediately. */
export function getCommunityLevels(): LevelTier[] {
  ensureLoaded()
  return cachedLevels
}

/** React hook — components re-render once the real data arrives. */
export function useCommunityLevels(): LevelTier[] {
  const [levels, setLevels] = useState<LevelTier[]>(cachedLevels)

  useEffect(() => {
    ensureLoaded()
    const onUpdate = () => setLevels(cachedLevels)
    subscribers.add(onUpdate)
    if (hasFetched) setLevels(cachedLevels)
    return () => { subscribers.delete(onUpdate) }
  }, [])

  return levels
}

/** 1-based rank of a tier name within the ladder (0 if not found). */
export function levelRank(name: string, levels: LevelTier[] = getCommunityLevels()): number {
  const idx = levels.findIndex(l => l.name === name)
  return idx < 0 ? 0 : idx + 1
}

/** Badge bg/color for a tier name, falling back to the first (lowest) tier. */
export function levelStyle(name: string, levels: LevelTier[] = getCommunityLevels()): { bg: string; color: string } {
  const found = levels.find(l => l.name === name)
  return found ?? levels[0]
}

export interface LevelInfo {
  level:     string
  nextName:  string | null
  pct:       number
  ptsToNext: number
}

/** Current tier, next tier name, and progress-bar percentage for a raw points value. */
export function getLevelInfo(points: number, levels: LevelTier[] = getCommunityLevels()): LevelInfo {
  let currentIdx = 0
  for (let i = 0; i < levels.length; i++) {
    if (points >= levels[i].min) currentIdx = i
    else break
  }
  const current = levels[currentIdx]
  const next     = levels[currentIdx + 1] ?? null
  const pct = next
    ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100))
    : 100
  const ptsToNext = next ? next.min - points : 0
  return { level: current.name, nextName: next?.name ?? null, pct, ptsToNext }
}

/** The default/floor tier name — used as the fallback when a profile has no level yet. */
export const DEFAULT_LEVEL_NAME = 'Connected'

// ── DRU AI Transformation Pathway™ stages — standalone, paid progression ──────
// (Gap Signal itself only ever renders in the admin app, but MemberProfile.tsx
// is bundled identically into both repos, so these exports live here too.)
export const PATHWAY_STAGES = ['Discover', 'Diagnose', 'Design', 'Deploy', 'Dominate'] as const

const GAP_THRESHOLD_PCT = 15 // percentage points of separation before it tips out of "Aligned"

export interface GapSignal {
  label: string
  bg:    string
  color: string
}

/**
 * Compares a member's Community Level position against their Transformation
 * Pathway stage as two independent percentages — NOT by pairing specific
 * tiers to specific stages. Returns null if either value is unrecognized.
 */
export function getGapSignal(
  levelName: string,
  pathwayStage: string,
  levels: LevelTier[] = getCommunityLevels()
): GapSignal | null {
  const li = levels.findIndex(l => l.name === levelName)
  const pi = PATHWAY_STAGES.indexOf(pathwayStage as typeof PATHWAY_STAGES[number])
  if (li < 0 || pi < 0) return null

  const engagementPct = (li / (levels.length - 1)) * 100
  const pathwayPct    = (pi / (PATHWAY_STAGES.length - 1)) * 100
  const diff          = engagementPct - pathwayPct

  if (diff > GAP_THRESHOLD_PCT)  return { label: 'Hot Lead',       bg: '#ECC2D1', color: '#C2185B' }
  if (diff < -GAP_THRESHOLD_PCT) return { label: 'Retention Risk', bg: '#F2EACE', color: '#947B27' }
  return                              { label: 'Aligned',        bg: '#D2DBE5', color: '#1B4D8E' }
}
