import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { SpotlightWidget } from '@/components/SpotlightWidget'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const loadSettings = useSettingsStore((s) => s.loadSettings)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user, loadSettings])

  return <SpotlightWidget />
}
