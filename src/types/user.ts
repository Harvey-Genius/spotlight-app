export interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  dark_mode: boolean
  notifications_enabled: boolean
  ai_model: string
}
