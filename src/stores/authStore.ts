import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { api } from '@/api/client'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface AuthState {
  user: SupabaseUser | null
  session: Session | null
  loading: boolean
  initialize: () => () => void
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, session, loading: false })

      // If we have provider tokens from a fresh OAuth redirect, store them server-side
      if (session?.provider_token) {
        api
          .storeGmailTokens(
            session.provider_token,
            session.provider_refresh_token ?? null
          )
          .catch(console.error)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session })

      if (session?.provider_token) {
        api
          .storeGmailTokens(
            session.provider_token,
            session.provider_refresh_token ?? null
          )
          .catch(console.error)
      }
    })

    return () => subscription.unsubscribe()
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    return { error: error ? new Error(error.message) : null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
