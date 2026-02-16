import { useChatStore } from '@/stores/chatStore'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { getRandomGreeting } from '@/constants'
import { useState } from 'react'

export function ChatView() {
  const messages = useChatStore((s) => s.messages)
  const [greeting] = useState(getRandomGreeting)

  const isWelcomeState =
    messages.length === 1 && messages[0]?.role === 'assistant'

  return (
    <div className="flex-1 flex flex-col relative z-10 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-fade">
        {isWelcomeState ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-2xl font-semibold text-center bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {greeting}
            </p>
          </div>
        ) : (
          <MessageList />
        )}
      </div>
      <ChatInput />
    </div>
  )
}
