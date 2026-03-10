import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChatStore } from '@/stores/chatStore'
import { api } from '@/api/client'
import { SendIcon } from '@/icons'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Important: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'bg-red-500/20', darkText: 'text-red-400' },
  'Work/School': { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'bg-blue-500/20', darkText: 'text-blue-400' },
  Social: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'bg-green-500/20', darkText: 'text-green-400' },
  Promotions: { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'bg-yellow-500/20', darkText: 'text-yellow-400' },
  Updates: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'bg-purple-500/20', darkText: 'text-purple-400' },
  Finance: { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'bg-orange-500/20', darkText: 'text-orange-400' },
  Personal: { bg: 'bg-pink-100', text: 'text-pink-700', darkBg: 'bg-pink-500/20', darkText: 'text-pink-400' },
}

function CategoryTag({ category, darkMode }: { category: string; darkMode: boolean }) {
  const colors = CATEGORY_COLORS[category]
  if (!colors) return <strong>[{category}]</strong>

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        darkMode ? `${colors.darkBg} ${colors.darkText}` : `${colors.bg} ${colors.text}`
      }`}
    >
      {category}
    </span>
  )
}

interface EmailAction {
  action: 'send' | 'draft'
  to: string
  subject: string
  body: string
  reply_to_message_id?: string
}

function parseEmailActions(content: string): {
  textParts: string[]
  actions: EmailAction[]
} {
  const regex = /```email-action\s*\n([\s\S]*?)```/g
  const textParts: string[] = []
  const actions: EmailAction[] = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    textParts.push(content.slice(lastIndex, match.index))
    try {
      const parsed = JSON.parse(match[1]!)
      if (parsed.to && parsed.subject && parsed.body) {
        actions.push(parsed)
      }
    } catch {
      // If JSON parse fails, keep the raw text
      textParts.push(match[0])
    }
    lastIndex = match.index + match[0].length
  }

  textParts.push(content.slice(lastIndex))
  return { textParts, actions }
}

/** Extract sender first names from an assistant message that references emails */
function extractSenderNames(content: string): string[] {
  const names: string[] = []
  // Match "From: Name" or "**From:** Name" patterns
  const fromPattern = /\*?\*?From:?\*?\*?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/g
  let match
  while ((match = fromPattern.exec(content)) !== null) {
    const name = match[1]!.split(/\s/)[0]! // First name only
    if (name.length > 1 && !names.includes(name)) {
      names.push(name)
    }
  }
  return names.slice(0, 3) // Max 3 names
}

/** Check if a message discusses emails */
function isEmailRelated(content: string): boolean {
  const indicators = ['**From:**', '**Subject:**', '**Date:**', 'Email ', 'email from', 'sent you', 'inbox']
  return indicators.some((i) => content.includes(i))
}

/** Generate contextual suggestion chips based on message content */
function getContextualChips(content: string): { label: string; message: string }[] {
  const chips: { label: string; message: string }[] = []
  const senders = extractSenderNames(content)

  // Add reply chips for each sender
  for (const name of senders.slice(0, 2)) {
    chips.push({
      label: `Reply to ${name}`,
      message: `Draft a reply to ${name}'s email`,
    })
  }

  // Add contextual chips based on content
  if (content.includes('thread') || content.includes('conversation')) {
    chips.push({ label: 'Summarize thread', message: 'Summarize this entire email thread' })
  }

  if (senders.length > 0 && chips.length < 3) {
    chips.push({ label: 'Draft follow-up', message: `Draft a follow-up email to ${senders[0]}` })
  }

  // Add category-based chip if multiple categories detected
  const categoryPattern = /\*\*\[(\w+(?:\/\w+)?)\]\*\*/g
  const foundCategories = new Set<string>()
  let catMatch
  while ((catMatch = categoryPattern.exec(content)) !== null) {
    foundCategories.add(catMatch[1]!)
  }
  if (foundCategories.size > 1 && chips.length < 3) {
    const firstCat = [...foundCategories][0]!
    chips.push({
      label: `Show ${firstCat} only`,
      message: `Show me only my ${firstCat.toLowerCase()} emails`,
    })
  }

  if (chips.length < 3) {
    chips.push({ label: 'Tell me more', message: 'Give me more details about these emails' })
  }

  return chips.slice(0, 3)
}

function EmailActionCard({ emailAction }: { emailAction: EmailAction }) {
  const darkMode = useSettingsStore((s) => s.darkMode)
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'drafted' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleDraft = async () => {
    setStatus('loading')
    try {
      await api.createDraft(
        emailAction.to,
        emailAction.subject,
        emailAction.body,
        emailAction.reply_to_message_id
      )
      setStatus('drafted')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create draft')
    }
  }

  const handleSend = async () => {
    setStatus('loading')
    try {
      await api.sendEmail(
        emailAction.to,
        emailAction.subject,
        emailAction.body,
        emailAction.reply_to_message_id
      )
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send')
    }
  }

  return (
    <div
      className={`my-3 rounded-xl border overflow-hidden ${
        darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Email preview */}
      <div className="px-3 py-2.5 space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-semibold tracking-wider ${
            darkMode ? 'text-violet-400' : 'text-violet-500'
          }`}>
            {emailAction.reply_to_message_id ? 'Reply' : 'New Email'}
          </span>
        </div>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="font-medium">To:</span> {emailAction.to}
        </p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="font-medium">Subject:</span> {emailAction.subject}
        </p>
        <div className={`text-xs mt-1.5 pt-1.5 border-t whitespace-pre-wrap ${
          darkMode ? 'border-white/10 text-gray-300' : 'border-gray-100 text-gray-700'
        }`}>
          {emailAction.body.length > 200
            ? emailAction.body.substring(0, 200) + '...'
            : emailAction.body}
        </div>
      </div>

      {/* Action buttons */}
      <div className={`px-3 py-2 flex gap-2 border-t ${
        darkMode ? 'border-white/10' : 'border-gray-100'
      }`}>
        {status === 'idle' && (
          <>
            <button
              onClick={handleDraft}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                darkMode
                  ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Save as Draft
            </button>
            <button
              onClick={handleSend}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <SendIcon />
              Send Now
            </button>
          </>
        )}
        {status === 'loading' && (
          <div className={`flex-1 py-1.5 text-center text-xs ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span className="animate-pulse">Processing...</span>
          </div>
        )}
        {status === 'drafted' && (
          <div className="flex-1 py-1.5 text-center text-xs text-green-500 font-medium">
            ✓ Saved to Drafts
          </div>
        )}
        {status === 'sent' && (
          <div className="flex-1 py-1.5 text-center text-xs text-green-500 font-medium">
            ✓ Email Sent
          </div>
        )}
        {status === 'error' && (
          <div className="flex-1 space-y-1">
            <p className="text-xs text-red-500 text-center">{errorMsg}</p>
            <button
              onClick={() => setStatus('idle')}
              className={`w-full py-1 rounded-lg text-xs ${
                darkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  showSuggestions?: boolean
}

export function MessageBubble({ role, content, showSuggestions = false }: MessageBubbleProps) {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const isStreaming = useChatStore((s) => s.isStreaming)

  // Parse email actions from assistant messages
  const hasEmailAction = role === 'assistant' && content.includes('```email-action')
  const { textParts, actions } = hasEmailAction
    ? parseEmailActions(content)
    : { textParts: [content], actions: [] }

  // Generate contextual chips for email-related responses
  const showChips = showSuggestions && role === 'assistant' && !isStreaming && isEmailRelated(content)
  const chips = showChips ? getContextualChips(content) : []

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
    >
      <div className={`max-w-[85%] ${role === 'user' ? '' : 'w-full'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            role === 'user'
              ? `bg-gradient-to-br ${theme.gradient} text-white shadow-md`
              : `${darkMode ? 'bg-gray-800' : 'bg-gray-100'} ${theme.text}`
          }`}
        >
          {role === 'user' ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          ) : (
            <div
              className={`text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2.5 prose-ul:my-3 prose-ol:my-3 prose-li:my-2 prose-headings:my-3 prose-strong:font-semibold prose-hr:my-4 prose-hr:border-gray-200 ${
                darkMode ? 'prose-invert prose-hr:border-gray-600' : ''
              }`}
            >
              {textParts.map((part, i) => (
                <span key={i}>
                  {part.trim() && (
                    <ReactMarkdown
                      components={{
                        strong: ({ children }) => {
                          const text = typeof children === 'string'
                            ? children
                            : Array.isArray(children)
                              ? children.map(c => (typeof c === 'string' ? c : '')).join('')
                              : String(children || '')
                          const categoryMatch = text.match(/^\[(\w+(?:\/\w+)?)\]$/)
                          if (categoryMatch && CATEGORY_COLORS[categoryMatch[1]!]) {
                            return <CategoryTag category={categoryMatch[1]!} darkMode={darkMode} />
                          }
                          return <strong>{children}</strong>
                        },
                      }}
                    >
                      {part}
                    </ReactMarkdown>
                  )}
                  {actions[i] && <EmailActionCard emailAction={actions[i]} />}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Contextual suggestion chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
            {chips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => sendMessage(chip.message)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  darkMode
                    ? 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border border-violet-500/20'
                    : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
