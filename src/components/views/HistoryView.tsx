import { useEffect, useState } from 'react'
import { ViewHeader } from '@/components/common/ViewHeader'
import { TrashIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useChatStore } from '@/stores/chatStore'
import { useSettingsStore } from '@/stores/settingsStore'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function HistoryView() {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const goBack = useUiStore((s) => s.goBack)
  const navigateTo = useUiStore((s) => s.navigateTo)
  const conversations = useChatStore((s) => s.conversations)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const selectConversation = useChatStore((s) => s.selectConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    loadConversations().finally(() => setLoading(false))
  }, [loadConversations])

  const handleSelect = async (id: string) => {
    await selectConversation(id)
    navigateTo('chat')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative z-10">
      <ViewHeader title="Conversations" onBack={goBack} />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div className={`h-8 w-8 rounded-full border-2 border-t-transparent animate-spin ${
              darkMode ? 'border-violet-400' : 'border-violet-500'
            }`} />
            <p className={`text-xs ${theme.textMuted} mt-3`}>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 ${
                darkMode ? 'bg-white/5' : 'bg-gray-100'
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={theme.textMuted}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className={`text-sm font-medium ${theme.text} mb-1`}>
              No conversations yet
            </p>
            <p className={`text-xs ${theme.textMuted} text-center`}>
              Start chatting and your conversations will show up here
            </p>
          </div>
        ) : (
          <div className="py-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${theme.hover}`}
                onClick={() => handleSelect(conv.id)}
              >
                <div
                  className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center mt-0.5 ${
                    darkMode
                      ? 'bg-violet-500/15 text-violet-400'
                      : 'bg-violet-50 text-violet-500'
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${theme.text} truncate`}
                    >
                      {conv.title || 'Untitled'}
                    </p>
                    <span
                      className={`text-[10px] ${theme.textMuted} flex-shrink-0`}
                    >
                      {timeAgo(conv.updated_at)}
                    </span>
                  </div>
                  {conv.last_message_preview && (
                    <p
                      className={`text-xs ${theme.textMuted} truncate mt-0.5`}
                    >
                      {conv.last_message_preview}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                  className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                    darkMode
                      ? 'text-gray-500 hover:text-red-400 hover:bg-white/5'
                      : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                  }`}
                  title="Delete conversation"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
