import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUiStore } from '@/stores/uiStore'
import { SpotlightWidget } from '@/components/SpotlightWidget'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const open = useUiStore((s) => s.open)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  useEffect(() => {
    if (!loading && user) {
      loadSettings()
      // Auto-open panel when user is authenticated
      open()
    }
  }, [user, loading, loadSettings, open])

  return <SpotlightWidget />
}
