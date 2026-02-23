import { useState, useEffect } from 'react'
import { useNotificationRulesStore } from '@/stores/notificationRulesStore'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/stores/settingsStore'
import { PlusIcon, CloseIcon } from '@/icons'

const RULE_TYPE_LABELS = {
  from: 'From',
  subject: 'Subject contains',
  contains: 'Any field contains',
} as const

type RuleType = 'from' | 'subject' | 'contains'

export function NotificationRulesSection() {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const { rules, loading, loadRules, addRule, deleteRule } =
    useNotificationRulesStore()
  const [showForm, setShowForm] = useState(false)
  const [ruleType, setRuleType] = useState<RuleType>('from')
  const [value, setValue] = useState('')

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const handleAdd = async () => {
    if (!value.trim()) return
    await addRule(ruleType, value.trim())
    setValue('')
    setShowForm(false)
  }

  return (
    <div className="mt-3 px-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium ${theme.textMuted}`}>
          Notification Rules ({rules.length})
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
            darkMode
              ? 'text-violet-400 hover:bg-white/10'
              : 'text-violet-600 hover:bg-violet-50'
          }`}
        >
          <PlusIcon />
          Add Rule
        </button>
      </div>

      {/* Add rule form */}
      {showForm && (
        <div
          className={`p-3 rounded-xl space-y-2.5 ${
            darkMode
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          {/* Rule type selector chips */}
          <div className="flex gap-1.5">
            {(Object.keys(RULE_TYPE_LABELS) as RuleType[]).map((type) => (
              <button
                key={type}
                onClick={() => setRuleType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  ruleType === type
                    ? darkMode
                      ? 'bg-violet-600 text-white'
                      : 'bg-violet-500 text-white'
                    : darkMode
                      ? 'bg-white/10 text-gray-300'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {RULE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Value input */}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              ruleType === 'from'
                ? 'boss@company.com'
                : ruleType === 'subject'
                  ? 'urgent, invoice'
                  : 'meeting, deadline'
            }
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className={`w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors ${
              darkMode
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
            }`}
          />

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!value.trim()}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                darkMode
                  ? 'bg-violet-600 text-white hover:bg-violet-500'
                  : 'bg-violet-500 text-white hover:bg-violet-600'
              }`}
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setValue('')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                darkMode
                  ? 'bg-white/10 text-gray-300'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <p className={`text-xs ${theme.textMuted} py-2`}>Loading rules...</p>
      ) : rules.length === 0 && !showForm ? (
        <p className={`text-xs ${theme.textMuted} py-2`}>
          No rules yet. Add one to get notified about specific emails.
        </p>
      ) : (
        <div className="space-y-1">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl group ${
                darkMode ? 'bg-white/5' : 'bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-violet-400' : 'text-violet-500'
                  }`}
                >
                  {RULE_TYPE_LABELS[
                    rule.rule_type as keyof typeof RULE_TYPE_LABELS
                  ] || rule.rule_type}
                </p>
                <p className={`text-sm ${theme.text} truncate`}>
                  {rule.value}
                </p>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className={`ml-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                  darkMode
                    ? 'text-gray-500 hover:text-rose-400 hover:bg-white/10'
                    : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
