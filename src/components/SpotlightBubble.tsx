import { SparkleIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function SpotlightBubble() {
  const theme = useTheme()
  const toggle = useUiStore((s) => s.toggle)
  const darkMode = useSettingsStore((s) => s.darkMode)

  return (
    <div className="group fixed bottom-6 left-6 z-50">
      <button
        onClick={toggle}
        className={`bubble-glow h-12 w-12 rounded-full bg-gradient-to-br ${theme.gradient} text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center`}
      >
        <SparkleIcon size={22} />
      </button>
      <span
        className={`absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
        } shadow-lg`}
      >
        Open Spotlight
      </span>
    </div>
  )
}
