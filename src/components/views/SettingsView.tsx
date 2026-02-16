import { ViewHeader } from '@/components/common/ViewHeader'
import { SettingsItem } from '@/components/common/SettingsItem'
import { Toggle } from '@/components/common/Toggle'
import {
  MoonIcon,
  BellIcon,
  ShieldIcon,
  TrashIcon,
  InfoIcon,
  FileTextIcon,
} from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

export function SettingsView() {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled)
  const setDarkMode = useSettingsStore((s) => s.setDarkMode)
  const setNotifications = useSettingsStore((s) => s.setNotifications)
  const navigateTo = useUiStore((s) => s.navigateTo)
  const goBack = useUiStore((s) => s.goBack)
  const user = useAuthStore((s) => s.user)
  const clearMessages = useChatStore((s) => s.clearMessages)

  return (
    <div className="flex-1 flex flex-col min-h-0 relative z-10">
      <ViewHeader title="Settings" onBack={goBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
        {/* Account */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Account
          </p>
          <div className="space-y-1">
            <button
              onClick={() => navigateTo('account')}
              className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
            >
              <div
                className={`h-9 w-9 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-sm font-semibold`}
              >
                {(
                  user?.user_metadata?.full_name ||
                  user?.email ||
                  'U'
                )
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${theme.text}`}>
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className={`text-xs ${theme.textMuted}`}>{user?.email}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Appearance
          </p>
          <SettingsItem
            icon={
              <MoonIcon />
            }
            iconBg={
              darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-500'
            }
            label="Dark Mode"
            sublabel={darkMode ? 'On' : 'Off'}
            onClick={() => setDarkMode(!darkMode)}
            trailing={
              <Toggle
                enabled={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            }
          />
        </div>

        {/* Notifications */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Notifications
          </p>
          <SettingsItem
            icon={<BellIcon />}
            iconBg={
              darkMode
                ? 'bg-amber-900/50 text-amber-500'
                : 'bg-amber-100 text-amber-500'
            }
            label="Push Notifications"
            sublabel={notificationsEnabled ? 'Enabled' : 'Disabled'}
            onClick={() => setNotifications(!notificationsEnabled)}
            trailing={
              <Toggle
                enabled={notificationsEnabled}
                onChange={() => setNotifications(!notificationsEnabled)}
              />
            }
          />
        </div>

        {/* Privacy & Data */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Privacy & Data
          </p>
          <div className="space-y-1">
            <SettingsItem
              icon={<ShieldIcon />}
              iconBg={
                darkMode
                  ? 'bg-green-900/50 text-green-500'
                  : 'bg-green-100 text-green-500'
              }
              label="Connected Accounts"
              sublabel="Gmail"
              onClick={() => navigateTo('account')}
            />
            <SettingsItem
              icon={<TrashIcon />}
              iconBg={
                darkMode
                  ? 'bg-rose-900/50 text-rose-500'
                  : 'bg-rose-100 text-rose-500'
              }
              label="Clear Chat History"
              sublabel="Delete all conversations"
              onClick={clearMessages}
            />
          </div>
        </div>

        {/* About */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            About
          </p>
          <div className="space-y-1">
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div
                className={`h-9 w-9 rounded-full ${darkMode ? 'bg-violet-900/50' : 'bg-violet-100'} flex items-center justify-center text-violet-500`}
              >
                <InfoIcon />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${theme.text}`}>Version</p>
                <p className={`text-xs ${theme.textMuted}`}>1.0.0</p>
              </div>
            </div>
            <SettingsItem
              icon={<FileTextIcon />}
              iconBg={
                darkMode
                  ? 'bg-blue-900/50 text-blue-500'
                  : 'bg-blue-100 text-blue-500'
              }
              label="Terms of Service"
              onClick={() => navigateTo('legal', 'terms')}
            />
            <SettingsItem
              icon={<ShieldIcon />}
              iconBg={
                darkMode
                  ? 'bg-blue-900/50 text-blue-500'
                  : 'bg-blue-100 text-blue-500'
              }
              label="Privacy Policy"
              onClick={() => navigateTo('legal', 'privacy')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
