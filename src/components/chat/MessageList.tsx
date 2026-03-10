import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

export function MessageList() {
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Find the index of the last assistant message
  let lastAssistantIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'assistant') {
      lastAssistantIdx = i
      break
    }
  }

  return (
    <div className="space-y-4">
      {messages.map((message, idx) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          showSuggestions={idx === lastAssistantIdx && !isStreaming}
        />
      ))}
      {isStreaming && streamingContent && (
        <MessageBubble role="assistant" content={streamingContent} />
      )}
      {isStreaming && !streamingContent && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  )
}
