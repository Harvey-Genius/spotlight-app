import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/api/client'

interface SettingsState {
  darkMode: boolean
  notificationsEnabled: boolean
  aiPersonality: string
  subscriptionTier: string
  loaded: boolean
  loadSettings: () => Promise<void>
  setDarkMode: (value: boolean) => void
  setNotifications: (value: boolean) => void
  setAiPersonality: (value: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      notificationsEnabled: true,
      aiPersonality: '',
      subscriptionTier: 'free',
      loaded: false,

      loadSettings: async () => {
        try {
          const settings = await api.getSettings()
          set({
            darkMode: settings.dark_mode,
            notificationsEnabled: settings.notifications_enabled,
            aiPersonality: settings.ai_personality || '',
            subscriptionTier: settings.subscription_tier || 'free',
            loaded: true,
          })
        } catch {
          // Use cached values from localStorage (persist middleware)
          set({ loaded: true })
        }
      },

      setDarkMode: (value) => {
        set({ darkMode: value })
        api.updateSettings({ dark_mode: value }).catch(console.error)
      },

      setNotifications: (value) => {
        set({ notificationsEnabled: value })
        api
          .updateSettings({ notifications_enabled: value })
          .catch(console.error)
      },

      setAiPersonality: (value) => {
        set({ aiPersonality: value })
        api
          .updateSettings({ ai_personality: value })
          .catch(console.error)
      },

    }),
    {
      name: 'spotlight-settings',
      partialize: (state) => ({
        darkMode: state.darkMode,
        notificationsEnabled: state.notificationsEnabled,
        aiPersonality: state.aiPersonality,
      }),
    }
  )
)
