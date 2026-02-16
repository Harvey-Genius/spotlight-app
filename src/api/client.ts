import { supabase } from '@/lib/supabase'
import { streamSSE } from './sse'
import type {
  ConversationSummary,
  SettingsResponse,
  SSEEvent,
} from '@/types'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  }
}

function getFunctionsUrl(fn: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string
  return `${base}/functions/v1/${fn}`
}

export const api = {
  // --- Chat (SSE streaming) ---
  async *sendMessage(
    conversationId: string | null,
    message: string
  ): AsyncGenerator<SSEEvent> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('chat'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(err.error || 'Chat request failed')
    }

    yield* streamSSE(response)
  },

  // --- Conversations ---
  async listConversations(): Promise<ConversationSummary[]> {
    const { data, error } = await supabase.functions.invoke('conversations', {
      method: 'GET',
    })
    if (error) throw error
    return data as ConversationSummary[]
  },

  async deleteConversation(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${getFunctionsUrl('conversations')}?id=${id}`,
      { method: 'DELETE', headers }
    )
    if (!response.ok) throw new Error('Failed to delete conversation')
  },

  // --- Settings ---
  async getSettings(): Promise<SettingsResponse> {
    const { data, error } = await supabase.functions.invoke('settings', {
      method: 'GET',
    })
    if (error) throw error
    return data as SettingsResponse
  },

  async updateSettings(
    settings: Partial<SettingsResponse>
  ): Promise<SettingsResponse> {
    const { data, error } = await supabase.functions.invoke('settings', {
      body: settings,
    })
    if (error) throw error
    return data as SettingsResponse
  },

  // --- Auth ---
  async storeGmailTokens(
    providerToken: string,
    providerRefreshToken: string | null
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('auth-callback', {
      body: {
        provider_token: providerToken,
        provider_refresh_token: providerRefreshToken,
      },
    })
    if (error) throw error
  },
}
