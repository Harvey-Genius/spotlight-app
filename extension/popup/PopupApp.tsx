import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { PopupPanel } from './PopupPanel'

export default function PopupApp() {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const loadSettings = useSettingsStore((s) => s.loadSettings)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  useEffect(() => {
    if (!loading && user) {
      loadSettings()
    }
  }, [user, loading, loadSettings])

  return <PopupPanel />
}
