import { useChatStore } from '@/stores/chatStore'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { getRandomGreeting, smartSuggestions } from '@/constants'
import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/stores/settingsStore'

export function ChatView() {
  const messages = useChatStore((s) => s.messages)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [greeting] = useState(getRandomGreeting)
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)

  const isWelcomeState =
    messages.length === 1 && messages[0]?.role === 'assistant'

  return (
    <div className="flex-1 flex flex-col relative z-10 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-fade">
        {isWelcomeState ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <p className="text-2xl font-semibold text-center bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {greeting}
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-[320px]">
              {smartSuggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => sendMessage(suggestion.label)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    darkMode
                      ? 'bg-white/8 text-gray-300 hover:bg-white/15 border border-white/10'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{suggestion.icon}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <MessageList />
        )}
      </div>
      <ChatInput />
    </div>
  )
}
