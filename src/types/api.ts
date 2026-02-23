export interface SendMessageRequest {
  conversation_id?: string
  message: string
}

export interface SSEChunkEvent {
  type: 'chunk'
  content: string
}

export interface SSEDoneEvent {
  type: 'done'
  conversation_id: string
  message_id: string
}

export interface SSEErrorEvent {
  type: 'error'
  content: string
}

export type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent

export interface StoreTokensRequest {
  provider_token: string
  provider_refresh_token: string
}

export interface SettingsResponse {
  dark_mode: boolean
  notifications_enabled: boolean
  ai_model: string
  ai_personality: string
  sms_phone_number: string
  subscription_tier: string
}

export interface NotificationRule {
  id: string
  rule_type: 'from' | 'subject' | 'contains'
  value: string
  enabled: boolean
  created_at: string
}

export interface UsageStatus {
  used: number
  limit: number
  remaining: number
  tier?: string
}

export interface ApiError {
  error: string
  status?: number
}
