import { SparkleIcon, CheckIcon } from '@/icons'
import { features } from '@/constants'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function WelcomeView() {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const navigateTo = useUiStore((s) => s.navigateTo)

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 relative z-10">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white mb-6 shadow-lg animate-fade-up`}
        >
          <SparkleIcon size={26} className="animate-shimmer" />
        </div>
        <h2
          className={`text-xl font-semibold ${theme.text} text-center mb-2 animate-fade-up`}
        >
          Find what matters in your inbox.
        </h2>
        <p
          className={`text-sm ${theme.textMuted} text-center mb-6 animate-fade-up`}
        >
          Due dates, updates, and reminders&mdash;fast.
        </p>
        <div className="space-y-2.5 mb-8 animate-fade-up">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                <CheckIcon />
              </div>
              <span
                className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full max-w-[280px] animate-fade-up">
          <button
            onClick={() => navigateTo('auth')}
            className={`w-full py-3.5 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white font-medium text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]`}
          >
            Get Started
          </button>
        </div>
      </div>
      <div
        className={`px-6 py-4 border-t ${theme.border} animate-fade-up relative z-10`}
      >
        <p className={`text-[11px] ${theme.textMuted} text-center`}>
          Spotlight only accesses what you request. We never sell your data.
        </p>
      </div>
    </>
  )
}
