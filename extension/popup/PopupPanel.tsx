import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { PopupHeader } from './PopupHeader'
import { WelcomeView } from '@/components/views/WelcomeView'
import { AuthView } from '@/components/views/AuthView'
import { OnboardingView } from '@/components/views/OnboardingView'
import { ChatView } from '@/components/views/ChatView'
import { HistoryView } from '@/components/views/HistoryView'
import { SettingsView } from '@/components/views/SettingsView'
import { AccountView } from '@/components/views/AccountView'
import { LegalView } from '@/components/views/LegalView'

export function PopupPanel() {
  const theme = useTheme()
  const currentView = useUiStore((s) => s.currentView)
  const user = useAuthStore((s) => s.user)

  // If user is authenticated and view is welcome/auth, redirect to chat
  const effectiveView =
    user && (currentView === 'welcome' || currentView === 'auth')
      ? 'chat'
      : currentView

  const renderView = () => {
    switch (effectiveView) {
      case 'welcome':
        return <WelcomeView />
      case 'auth':
        return <AuthView />
      case 'onboarding':
        return <OnboardingView />
      case 'chat':
        return <ChatView />
      case 'history':
        return <HistoryView />
      case 'settings':
        return <SettingsView />
      case 'account':
        return <AccountView />
      case 'legal':
        return <LegalView />
      default:
        return <WelcomeView />
    }
  }

  return (
    <div className={`w-full h-full ${theme.bg} flex flex-col overflow-hidden`}>
      <PopupHeader />
      {renderView()}
    </div>
  )
}
