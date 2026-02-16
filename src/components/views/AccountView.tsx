import { useState } from 'react'
import { ViewHeader } from '@/components/common/ViewHeader'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { SettingsItem } from '@/components/common/SettingsItem'
import {
  CrownIcon,
  DownloadIcon,
  LogOutIcon,
  UserXIcon,
} from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChatStore } from '@/stores/chatStore'

export function AccountView() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const goBack = useUiStore((s) => s.goBack)
  const reset = useUiStore((s) => s.reset)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const clearMessages = useChatStore((s) => s.clearMessages)

  const handleSignOut = async () => {
    await signOut()
    clearMessages()
    reset()
  }

  const handleDeleteAccount = async () => {
    await signOut()
    clearMessages()
    reset()
    setShowDeleteConfirm(false)
  }

  const handleExportData = () => {
    const exportData = {
      account: {
        email: user?.email,
        name: user?.user_metadata?.full_name,
        created_at: user?.created_at,
        last_sign_in: user?.last_sign_in_at,
      },
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spotlight-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative z-10">
      <ViewHeader title="Account" onBack={goBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {/* Profile */}
        <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bg}`}>
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`h-14 w-14 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-xl font-semibold`}
            >
              {(
                user?.user_metadata?.full_name ||
                user?.email ||
                'U'
              )
                ?.charAt(0)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-semibold ${theme.text} truncate`}>
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className={`text-sm ${theme.textMuted} truncate`}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className={`pt-4 border-t ${theme.border} space-y-3`}>
            <div className="flex justify-between">
              <span className={`text-sm ${theme.textMuted}`}>
                Sign-in method
              </span>
              <span className={`text-sm ${theme.text} font-medium`}>
                Google
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${theme.textMuted}`}>
                Account status
              </span>
              <span className="text-sm text-green-500 font-medium">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Subscription
          </p>
          <div
            className={`p-4 rounded-2xl border ${theme.border} ${theme.bg}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-10 w-10 rounded-full ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'} flex items-center justify-center text-amber-500`}
              >
                <CrownIcon />
              </div>
              <div>
                <p className={`text-sm font-semibold ${theme.text}`}>
                  Free Plan
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                  Basic features included
                </p>
              </div>
            </div>
            <button
              onClick={() => alert('Pro upgrade coming soon!')}
              className={`w-full py-2.5 rounded-xl bg-gradient-to-br ${theme.gradient} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Data Management
          </p>
          <SettingsItem
            icon={<DownloadIcon />}
            iconBg={
              darkMode
                ? 'bg-cyan-900/50 text-cyan-500'
                : 'bg-cyan-100 text-cyan-500'
            }
            label="Export Data"
            sublabel="Download a copy of your data"
            onClick={handleExportData}
          />
        </div>

        {/* Danger Zone */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Danger Zone
          </p>
          <div className="space-y-1">
            <SettingsItem
              icon={<LogOutIcon />}
              iconBg={
                darkMode
                  ? 'bg-red-900/50 text-red-500'
                  : 'bg-red-100 text-red-500'
              }
              label="Sign Out"
              sublabel="You'll need to sign in again"
              danger
              onClick={handleSignOut}
            />
            <SettingsItem
              icon={<UserXIcon />}
              iconBg={
                darkMode
                  ? 'bg-red-900/50 text-red-500'
                  : 'bg-red-100 text-red-500'
              }
              label="Delete Account"
              sublabel="Permanently delete your account and data"
              danger
              onClick={() => setShowDeleteConfirm(true)}
            />
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          icon={
            <div
              className={`h-12 w-12 rounded-full ${darkMode ? 'bg-red-900/50' : 'bg-red-100'} flex items-center justify-center text-red-500`}
            >
              <UserXIcon />
            </div>
          }
          title="Delete Account?"
          description="This action cannot be undone. All your data will be permanently removed."
          confirmLabel="Delete"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
