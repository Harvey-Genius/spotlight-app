import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { api } from '@/api/client'
import { isExtension } from '@/lib/environment'
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

      // Store token for background notification checks
      if (session?.access_token && isExtension) {
        chrome.runtime
          .sendMessage({ type: 'STORE_SUPABASE_TOKEN', token: session.access_token })
          .catch(() => {})
      }

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

      // Keep background worker's token fresh
      if (session?.access_token && isExtension) {
        chrome.runtime
          .sendMessage({ type: 'STORE_SUPABASE_TOKEN', token: session.access_token })
          .catch(() => {})
      }

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
    if (isExtension) {
      // Extension: use chrome.identity to get Google tokens
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GET_GOOGLE_ID_TOKEN',
        })

        if (response.error) {
          return { error: new Error(response.error) }
        }

        // Sign into Supabase using the Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.idToken,
          nonce: response.nonce,
        })

        if (error) {
          return { error: new Error(error.message) }
        }

        // Store the Gmail access token server-side for email fetching
        if (response.accessToken) {
          api
            .storeGmailTokens(response.accessToken, null)
            .catch(console.error)
        }

        set({ user: data.user, session: data.session })

        // Store token for background notification checks
        if (data.session?.access_token) {
          chrome.runtime
            .sendMessage({ type: 'STORE_SUPABASE_TOKEN', token: data.session.access_token })
            .catch(() => {})
        }

        return { error: null }
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error('Extension auth failed'),
        }
      }
    }

    // Web: existing OAuth redirect flow
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
    if (isExtension) {
      // Clear Chrome's cached auth tokens
      await chrome.runtime.sendMessage({ type: 'SIGN_OUT' })
    }
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
