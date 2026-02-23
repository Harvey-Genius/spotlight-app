import { PlusIcon, HistoryIcon, SettingsIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

export function HeaderActions() {
  const theme = useTheme()
  const currentView = useUiStore((s) => s.currentView)
  const navigateTo = useUiStore((s) => s.navigateTo)
  const newConversation = useChatStore((s) => s.newConversation)
  const user = useAuthStore((s) => s.user)

  // Show actions on chat view, or when user is authenticated and would be redirected to chat
  const showActions =
    currentView === 'chat' ||
    (user && (currentView === 'welcome' || currentView === 'auth'))

  if (!showActions) return null

  return (
    <>
      <button
        onClick={newConversation}
        className={`icon-btn h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover}`}
        title="New chat"
      >
        <PlusIcon />
      </button>
      <button
        onClick={() => navigateTo('history')}
        className={`icon-btn h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover}`}
        title="Conversation history"
      >
        <HistoryIcon />
      </button>
      <button
        onClick={() => navigateTo('settings')}
        className={`icon-btn h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover}`}
      >
        <SettingsIcon />
      </button>
    </>
  )
}
