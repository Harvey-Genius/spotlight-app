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

export type SSEEvent = SSEChunkEvent | SSEDoneEvent

export interface StoreTokensRequest {
  provider_token: string
  provider_refresh_token: string
}

export interface SettingsResponse {
  dark_mode: boolean
  notifications_enabled: boolean
  ai_model: string
}

export interface ApiError {
  error: string
  status?: number
}
