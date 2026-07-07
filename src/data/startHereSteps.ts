// ─── Start Here — Static Step Definitions ─────────────────────────────────────
// Content lives here in code, not Supabase (Supabase only tracks completion
// via member_onboarding_steps: id, user_id, step_number, completed, completed_at).
// Mirrors the pattern used in aiArsenalData.ts.

export interface StartHereStep {
  step_number: number
  title: string
  description: string
  ctaLabel?: string
  ctaPath?: string          // internal route, navigated via lib/router
  tierGated?: 'accelerator' // only render/require for this tier; omit = all members
}

export const startHereSteps: StartHereStep[] = [
  {
    step_number: 1,
    title: 'Watch this Video for the Overview of the Platform',
    description: 'A Deeper Dive',
  },
  {
    step_number: 2,
    title: 'Complete your profile + add your photo',
    description: 'Help the community recognize you — add a photo and finish your profile details.',
    ctaLabel: 'Go to Profile',
    ctaPath: '/profile',
  },
  {
    step_number: 3,
    title: 'Set your notification preferences',
    description: 'Choose how you want to be notified about community activity and updates.',
    ctaLabel: 'Open Settings',
    ctaPath: '/profile',
  },
  {
    step_number: 4,
    title: 'Explore your Home page',
    description: 'Get familiar with My Assessment, Daily Connection, Need Support, and setting up your passkey for faster login.',
    ctaLabel: 'Go to Home',
    ctaPath: '/',
  },
  {
    step_number: 5,
    title: 'Know your DRU AI Transformation Pathway™',
    description: 'See where you stand — Discover → Diagnose → Design → Deploy → Dominate — and how your stage advances as you invest in your growth.',
    ctaLabel: 'See the Pathway',
    ctaPath: '/frameworks',
  },
  {
    step_number: 6,
    title: 'Read the Community Connection Protocols',
    description: 'Know how we engage, support, and grow together in this space.',
    ctaLabel: 'Read Protocols',
    ctaPath: '/support?view=protocols',
  },
  {
    step_number: 7,
    title: 'Introduce yourself in the Community',
    description: 'Tell us who you are and what brought you here — it\'s the easiest way to start connecting.',
    ctaLabel: 'Go to Community',
    ctaPath: '/community',
  },
  {
    step_number: 8,
    title: 'Check the Leaderboard',
    description: 'See where you stand and learn how Clarity Points™ work.',
    ctaLabel: 'View Leaderboard',
    ctaPath: '/leaderboard',
  },
  {
    step_number: 9,
    title: 'Explore the AI Arsenal',
    description: 'Browse the tool catalog and try at least one tool firsthand.',
    ctaLabel: 'Open AI Arsenal',
    ctaPath: '/resources/ai-arsenal',
  },
  {
    step_number: 10,
    title: 'Download your first Framework resource',
    description: 'Grab a framework download to put into practice right away.',
    ctaLabel: 'Go to Resources',
    ctaPath: '/resources',
    tierGated: 'accelerator',
  },
]
