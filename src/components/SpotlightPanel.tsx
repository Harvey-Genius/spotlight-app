import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Header } from './header/Header'
import { WelcomeView } from './views/WelcomeView'
import { AuthView } from './views/AuthView'
import { OnboardingView } from './views/OnboardingView'
import { ChatView } from './views/ChatView'
import { SettingsView } from './views/SettingsView'
import { AccountView } from './views/AccountView'
import { LegalView } from './views/LegalView'

export function SpotlightPanel() {
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
    <div
      className={`fixed right-5 top-5 bottom-5 w-[400px] ${theme.bg} rounded-[26px] shadow-[0_8px_60px_rgba(0,0,0,0.12),0_0_0_1px_rgba(139,92,246,0.05)] border ${theme.border} flex flex-col overflow-hidden animate-slide-in backdrop-blur-xl`}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }}
      />
      <Header />
      {renderView()}
    </div>
  )
}
