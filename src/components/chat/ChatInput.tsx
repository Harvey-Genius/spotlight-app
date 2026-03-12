import { useState, useEffect, useCallback } from 'react'
import { SendIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChatStore } from '@/stores/chatStore'
import { api } from '@/api/client'

export function ChatInput() {
  const [input, setInput] = useState('')
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const messages = useChatStore((s) => s.messages)

  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(25)
  const [tier, setTier] = useState('free')
  const isPro = tier === 'pro'
  const remaining = isPro ? Infinity : limit - used
  const isLimitReached = !isPro && remaining <= 0

  const fetchUsage = useCallback(async () => {
    try {
      const status = await api.getUsageStatus()
      setUsed(status.used)
      setLimit(status.limit)
      setTier(status.tier || 'free')
    } catch {
      // Silently fail — don't block chat
    }
  }, [])

  // Fetch usage on mount and after each message completes
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage, messages.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming || isLimitReached) return
    setInput('')
    setUsed((prev) => prev + 1) // Optimistic update
    sendMessage(trimmed)
  }

  return (
    <div className={`flex-shrink-0 px-4 py-3 border-t ${theme.border}`}>
      {isLimitReached && (
        <div
          className={`mb-2 px-3 py-2 rounded-xl text-xs text-center ${
            darkMode
              ? 'bg-red-500/10 text-red-400'
              : 'bg-red-50 text-red-500'
          }`}
        >
          Daily limit reached ({limit} messages). Resets at midnight UTC.
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isLimitReached
              ? 'Daily limit reached...'
              : 'Ask about your emails...'
          }
          disabled={isLimitReached}
          className={`input-glow flex-1 py-2.5 px-4 rounded-xl border ${theme.border} ${theme.bg} ${theme.text} text-sm focus:outline-none focus:border-violet-500 transition-all ${
            darkMode ? 'placeholder:text-gray-500' : 'placeholder:text-gray-400'
          } ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || isLimitReached}
          className={`send-btn h-10 w-10 rounded-xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <SendIcon />
        </button>
      </form>
      <div className="flex justify-end mt-1.5">
        <span
          className={`text-[10px] ${
            isPro
              ? theme.textMuted
              : remaining <= 5
                ? remaining <= 0
                  ? 'text-red-400'
                  : 'text-amber-400'
                : theme.textMuted
          }`}
        >
          {isPro ? `${used} messages today` : `${used}/${limit} messages today`}
        </span>
      </div>
    </div>
  )
}
