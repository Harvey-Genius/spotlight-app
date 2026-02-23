import { useState } from 'react'
import { NotificationRulesSection } from '@/components/settings/NotificationRulesSection'
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
  LogOutIcon,
  SparkleIcon,
  PhoneIcon,
  CrownIcon,
} from '@/icons'
import { api } from '@/api/client'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

const PERSONALITY_PRESETS = [
  { label: 'Default', value: '', desc: 'Balanced and helpful' },
  {
    label: 'Concise',
    value: 'Be extremely concise. Use bullet points. No fluff. Get straight to the point.',
    desc: 'Short & to the point',
  },
  {
    label: 'Detailed',
    value: 'Be thorough and detailed in your responses. Provide full context, explanations, and relevant background information.',
    desc: 'In-depth responses',
  },
  {
    label: 'Casual',
    value: 'Be casual and friendly. Use a relaxed, conversational tone like texting a friend. Keep it chill.',
    desc: 'Relaxed & friendly',
  },
  {
    label: 'Professional',
    value: 'Be formal and professional. Use proper grammar, structured responses, and a business-appropriate tone.',
    desc: 'Formal & polished',
  },
]

export function SettingsView() {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled)
  const aiPersonality = useSettingsStore((s) => s.aiPersonality)
  const setDarkMode = useSettingsStore((s) => s.setDarkMode)
  const setNotifications = useSettingsStore((s) => s.setNotifications)
  const setAiPersonality = useSettingsStore((s) => s.setAiPersonality)
  const navigateTo = useUiStore((s) => s.navigateTo)
  const goBack = useUiStore((s) => s.goBack)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const reset = useUiStore((s) => s.reset)
  const subscriptionTier = useSettingsStore((s) => s.subscriptionTier)
  const smsPhoneNumber = useSettingsStore((s) => s.smsPhoneNumber)
  const setSmsPhoneNumber = useSettingsStore((s) => s.setSmsPhoneNumber)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [phoneInput, setPhoneInput] = useState(smsPhoneNumber || '')
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [showCustom, setShowCustom] = useState(
    !PERSONALITY_PRESETS.some((p) => p.value === aiPersonality) && aiPersonality !== ''
  )
  const [customText, setCustomText] = useState(aiPersonality)
  const [saved, setSaved] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    reset()
  }

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

        {/* Subscription */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            Subscription
          </p>
          {subscriptionTier === 'pro' ? (
            <div
              className={`px-3 py-3 rounded-xl ${
                darkMode ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CrownIcon />
                <p className={`text-sm font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  Spotlight Pro
                </p>
              </div>
              <p className={`text-xs ${theme.textMuted} mb-2`}>
                50 messages/day &middot; $5/month
              </p>
              <button
                onClick={async () => {
                  try {
                    const { url } = await api.manageSubscription()
                    chrome.tabs.create({ url })
                  } catch {}
                }}
                className={`text-xs font-medium ${
                  darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
                } underline`}
              >
                Manage subscription
              </button>
            </div>
          ) : (
            <div
              className={`px-3 py-3 rounded-xl ${
                darkMode ? 'bg-violet-900/20 border border-violet-500/30' : 'bg-violet-50 border border-violet-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CrownIcon />
                <p className={`text-sm font-semibold ${darkMode ? 'text-violet-300' : 'text-violet-600'}`}>
                  Upgrade to Pro
                </p>
              </div>
              <p className={`text-xs ${theme.textMuted} mb-2.5`}>
                Get 50 messages/day (5x more) for just $5/month.
              </p>
              <button
                disabled={upgradeLoading}
                onClick={async () => {
                  setUpgradeLoading(true)
                  try {
                    const { url } = await api.createCheckout()
                    chrome.tabs.create({ url })
                  } catch {
                    // Handle error silently
                  } finally {
                    setUpgradeLoading(false)
                  }
                }}
                className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                  darkMode
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500'
                    : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600'
                } ${upgradeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {upgradeLoading ? 'Loading...' : 'Upgrade — $5/mo'}
              </button>
            </div>
          )}
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
          {notificationsEnabled && <NotificationRulesSection />}
          {notificationsEnabled && (
            <div className="mt-3 px-1">
              <div className={`flex items-center gap-2 mb-2`}>
                <div
                  className={`h-7 w-7 rounded-full ${
                    darkMode ? 'bg-teal-900/50' : 'bg-teal-100'
                  } flex items-center justify-center text-teal-500`}
                >
                  <PhoneIcon />
                </div>
                <p className={`text-sm font-medium ${theme.text}`}>
                  SMS Alerts
                </p>
              </div>
              <p className={`text-xs ${theme.textMuted} mb-2 px-1`}>
                Get text messages when notification rules match. Leave empty to disable SMS.
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={`flex-1 px-3 py-2 rounded-xl text-sm border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                  } outline-none transition-colors`}
                />
                <button
                  onClick={() => {
                    // Format: strip non-digits, ensure +1 prefix for US numbers
                    let formatted = phoneInput.replace(/[^\d+]/g, '')
                    if (formatted && !formatted.startsWith('+')) {
                      formatted = '+1' + formatted
                    }
                    setSmsPhoneNumber(formatted)
                    setPhoneInput(formatted)
                    setPhoneSaved(true)
                    setTimeout(() => setPhoneSaved(false), 1500)
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    darkMode
                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                      : 'bg-violet-500 text-white hover:bg-violet-600'
                  }`}
                >
                  {phoneSaved ? 'Saved!' : 'Save'}
                </button>
              </div>
              {smsPhoneNumber && (
                <p className={`text-xs ${theme.textMuted} mt-1.5 px-1`}>
                  SMS alerts will be sent to {smsPhoneNumber}
                </p>
              )}
            </div>
          )}
        </div>

        {/* AI Personality */}
        <div>
          <p
            className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}
          >
            AI Personality
          </p>
          <div className="space-y-2">
            {/* Preset chips */}
            <div className="flex flex-wrap gap-2 px-2">
              {PERSONALITY_PRESETS.map((preset) => {
                const isActive = !showCustom && aiPersonality === preset.value
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setShowCustom(false)
                      setAiPersonality(preset.value)
                      setSaved(true)
                      setTimeout(() => setSaved(false), 1500)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? darkMode
                          ? 'bg-violet-600 text-white'
                          : 'bg-violet-500 text-white'
                        : darkMode
                          ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
              <button
                onClick={() => {
                  setShowCustom(true)
                  setCustomText(aiPersonality)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showCustom
                    ? darkMode
                      ? 'bg-violet-600 text-white'
                      : 'bg-violet-500 text-white'
                    : darkMode
                      ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Active preset description */}
            {!showCustom && (
              <p className={`text-xs ${theme.textMuted} px-2`}>
                {PERSONALITY_PRESETS.find((p) => p.value === aiPersonality)?.desc || 'Balanced and helpful'}
              </p>
            )}

            {/* Custom textarea */}
            {showCustom && (
              <div className="px-2 space-y-2">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Tell Spotlight how to behave... e.g., 'Always respond in bullet points and keep it under 3 sentences'"
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl text-sm resize-none border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                  } outline-none transition-colors`}
                />
                <button
                  onClick={() => {
                    setAiPersonality(customText)
                    setSaved(true)
                    setTimeout(() => setSaved(false), 1500)
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    darkMode
                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                      : 'bg-violet-500 text-white hover:bg-violet-600'
                  }`}
                >
                  {saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            )}

            {/* Saved confirmation for presets */}
            {saved && !showCustom && (
              <p className="text-xs text-violet-500 px-2 font-medium">Saved!</p>
            )}
          </div>
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

        {/* Sign Out */}
        <div className="pb-4">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${
              darkMode
                ? 'bg-rose-900/30 text-rose-400 hover:bg-rose-900/50'
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
            } transition-colors text-sm font-medium`}
          >
            <LogOutIcon />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
