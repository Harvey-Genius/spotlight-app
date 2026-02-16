import { useSettingsStore } from '@/stores/settingsStore'
import { useUiStore } from '@/stores/uiStore'
import { SpotlightBubble } from './SpotlightBubble'
import { SpotlightPanel } from './SpotlightPanel'

export function SpotlightWidget() {
  const darkMode = useSettingsStore((s) => s.darkMode)
  const isOpen = useUiStore((s) => s.isOpen)

  return (
    <div
      className={`w-full h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-100'} relative`}
    >
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${
            darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)'
          } 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      <SpotlightBubble />
      {isOpen && <SpotlightPanel />}
    </div>
  )
}
