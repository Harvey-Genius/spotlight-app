import { useSettingsStore } from '@/stores/settingsStore'

export function TypingIndicator() {
  const darkMode = useSettingsStore((s) => s.darkMode)

  return (
    <div className="flex justify-start animate-message-in">
      <div
        className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
      >
        <div className="flex items-center gap-1.5">
          <div className="typing-dot w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
          <div className="typing-dot w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
          <div className="typing-dot w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
        </div>
      </div>
    </div>
  )
}
