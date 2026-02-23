import { create } from 'zustand'
import { api } from '@/api/client'
import type { NotificationRule } from '@/types'

interface NotificationRulesState {
  rules: NotificationRule[]
  loading: boolean
  error: string | null
  loadRules: () => Promise<void>
  addRule: (
    ruleType: 'from' | 'subject' | 'contains',
    value: string
  ) => Promise<void>
  deleteRule: (id: string) => Promise<void>
}

export const useNotificationRulesStore = create<NotificationRulesState>(
  (set, get) => ({
    rules: [],
    loading: false,
    error: null,

    loadRules: async () => {
      set({ loading: true, error: null })
      try {
        const rules = await api.getNotificationRules()
        set({ rules, loading: false })
      } catch (err) {
        set({
          error:
            err instanceof Error ? err.message : 'Failed to load rules',
          loading: false,
        })
      }
    },

    addRule: async (ruleType, value) => {
      try {
        const newRule = await api.createNotificationRule(ruleType, value)
        set({ rules: [newRule, ...get().rules], error: null })
      } catch (err) {
        set({
          error:
            err instanceof Error ? err.message : 'Failed to add rule',
        })
      }
    },

    deleteRule: async (id) => {
      try {
        await api.deleteNotificationRule(id)
        set({
          rules: get().rules.filter((r) => r.id !== id),
          error: null,
        })
      } catch (err) {
        set({
          error:
            err instanceof Error ? err.message : 'Failed to delete rule',
        })
      }
    },
  })
)
