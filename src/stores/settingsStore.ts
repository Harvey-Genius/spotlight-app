import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/api/client'

const DEFAULT_CATEGORIES = ['important', 'work', 'social']

interface SettingsState {
  darkMode: boolean
  notificationsEnabled: boolean
  aiPersonality: string
  subscriptionTier: string
  selectedCategories: string[]
  loaded: boolean
  loadSettings: () => Promise<void>
  setDarkMode: (value: boolean) => void
  setNotifications: (value: boolean) => void
  setAiPersonality: (value: string) => void
  setSelectedCategories: (value: string[]) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      notificationsEnabled: true,
      aiPersonality: '',
      subscriptionTier: 'free',
      selectedCategories: DEFAULT_CATEGORIES,
      loaded: false,

      loadSettings: async () => {
        try {
          const settings = await api.getSettings()
          set({
            darkMode: settings.dark_mode,
            notificationsEnabled: settings.notifications_enabled,
            aiPersonality: settings.ai_personality || '',
            subscriptionTier: settings.subscription_tier || 'free',
            selectedCategories: settings.selected_categories || DEFAULT_CATEGORIES,
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

      setSelectedCategories: (value) => {
        set({ selectedCategories: value })
        api
          .updateSettings({ selected_categories: value })
          .catch(console.error)
      },

    }),
    {
      name: 'spotlight-settings',
      partialize: (state) => ({
        darkMode: state.darkMode,
        notificationsEnabled: state.notificationsEnabled,
        aiPersonality: state.aiPersonality,
        selectedCategories: state.selectedCategories,
      }),
    }
  )
)
