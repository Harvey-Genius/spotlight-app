import { useState } from 'react'
import { SendIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChatStore } from '@/stores/chatStore'

export function ChatInput() {
  const [input, setInput] = useState('')
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const sendMessage = useChatStore((s) => s.sendMessage)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    setInput('')
    sendMessage(trimmed)
  }

  return (
    <div className={`flex-shrink-0 px-4 py-3 border-t ${theme.border}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your emails..."
          className={`input-glow flex-1 py-2.5 px-4 rounded-xl border ${theme.border} ${theme.bg} ${theme.text} text-sm focus:outline-none focus:border-violet-500 transition-all ${
            darkMode ? 'placeholder:text-gray-500' : 'placeholder:text-gray-400'
          }`}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className={`send-btn h-10 w-10 rounded-xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  )
}
