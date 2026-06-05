import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: string | null
  picture: string | null
  photo_url: string | null
  tier: 'navigator' | 'accelerator' | null
  pathway_stage: string | null
  clarity_points: number | null
  community_level: string | null
  points_updated_at: string | null
}

export type PathwayStage = 'discover' | 'diagnose' | 'deploy'

// ─── Profile utility exports (used by TopNav, Feed) ──────────────────────────

export function profileDisplayName(p: Profile | null): string {
  if (!p) return 'Member'
  if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name}`
  if (p.first_name) return p.first_name
  if (p.email) return p.email.split('@')[0]
  return 'Member'
}

export function profileAvatar(p: Profile | null): string | null {
  return p?.photo_url || p?.picture || null
}

export function profileInitials(p: Profile | null): string {
  const name = profileDisplayName(p)
  return name.split(' ').map((n) => n[0] || '').join('').slice(0, 2).toUpperCase()
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextType {
  // Core auth
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  // Tier flags
  isAccelerator: boolean
  isNavigator: boolean
  isPaid: boolean
  hasStrategicEdge: boolean
  // Pathway
  pathwayStage: PathwayStage
  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as Profile)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        else setProfile(null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  // ── Derived tier flags ────────────────────────────────────────────────────
  const isAccelerator    = profile?.tier === 'accelerator'
  const isNavigator      = profile?.tier === 'navigator'
  const isPaid           = isNavigator || isAccelerator
  const hasStrategicEdge = isNavigator || isAccelerator

  // ── Derived pathway stage ─────────────────────────────────────────────────
  const pathwayStage: PathwayStage =
    profile?.pathway_stage === 'deploy'   ? 'deploy'   :
    profile?.pathway_stage === 'diagnose' ? 'diagnose' :
    'discover'

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      isAccelerator, isNavigator, isPaid, hasStrategicEdge,
      pathwayStage,
      signInWithEmail, signInWithGoogle, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
