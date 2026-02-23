import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/stores/settingsStore'
import { api } from '@/api/client'
import { SendIcon } from '@/icons'

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
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)

  // Parse email actions from assistant messages
  const hasEmailAction = role === 'assistant' && content.includes('```email-action')
  const { textParts, actions } = hasEmailAction
    ? parseEmailActions(content)
    : { textParts: [content], actions: [] }

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
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
                {part.trim() && <ReactMarkdown>{part}</ReactMarkdown>}
                {actions[i] && <EmailActionCard emailAction={actions[i]} />}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
