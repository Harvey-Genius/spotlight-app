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
      const errText = await response.text()
      try {
        const err = JSON.parse(errText)
        throw new Error(err.error || `HTTP ${response.status}`)
      } catch (e) {
        if (e instanceof SyntaxError) throw new Error(errText || `HTTP ${response.status}`)
        throw e
      }
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

  async getConversationMessages(conversationId: string): Promise<import('@/types').ChatMessage[]> {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${getFunctionsUrl('messages')}?conversation_id=${conversationId}`,
      { method: 'GET', headers }
    )
    if (!response.ok) throw new Error('Failed to load messages')
    return response.json()
  },

  async deleteConversation(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${getFunctionsUrl('conversations')}?id=${id}`,
      { method: 'DELETE', headers }
    )
    if (!response.ok) throw new Error('Failed to delete conversation')
  },

  // --- Email Actions ---
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    replyToMessageId?: string
  ): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('email-actions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'send',
        to,
        subject,
        body,
        reply_to_message_id: replyToMessageId,
      }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Send failed' }))
      throw new Error(err.error || 'Failed to send email')
    }
    return response.json()
  },

  async createDraft(
    to: string,
    subject: string,
    body: string,
    replyToMessageId?: string
  ): Promise<{ success: boolean; draft_id: string }> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('email-actions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'draft',
        to,
        subject,
        body,
        reply_to_message_id: replyToMessageId,
      }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Draft failed' }))
      throw new Error(err.error || 'Failed to create draft')
    }
    return response.json()
  },

  // --- Notification Rules ---
  async getNotificationRules(): Promise<import('@/types').NotificationRule[]> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('notification-rules'), {
      method: 'GET',
      headers,
    })
    if (!response.ok) throw new Error('Failed to fetch notification rules')
    return response.json()
  },

  async createNotificationRule(
    ruleType: 'from' | 'subject' | 'contains',
    value: string
  ): Promise<import('@/types').NotificationRule> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('notification-rules'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ rule_type: ruleType, value }),
    })
    if (!response.ok) throw new Error('Failed to create notification rule')
    return response.json()
  },

  async deleteNotificationRule(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${getFunctionsUrl('notification-rules')}?id=${id}`,
      { method: 'DELETE', headers }
    )
    if (!response.ok) throw new Error('Failed to delete notification rule')
  },

  // --- Usage ---
  async getUsageStatus(): Promise<import('@/types').UsageStatus> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('usage-status'), {
      method: 'GET',
      headers,
    })
    if (!response.ok) return { used: 0, limit: 25, remaining: 25 }
    return response.json()
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

  // --- Subscription ---
  async createCheckout(): Promise<{ url: string }> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('create-checkout'), {
      method: 'POST',
      headers,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Checkout failed' }))
      throw new Error(err.error || 'Failed to create checkout')
    }
    return response.json()
  },

  async manageSubscription(): Promise<{ url: string }> {
    const headers = await getAuthHeaders()
    const response = await fetch(getFunctionsUrl('manage-subscription'), {
      method: 'POST',
      headers,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed' }))
      throw new Error(err.error || 'Failed to open billing portal')
    }
    return response.json()
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
