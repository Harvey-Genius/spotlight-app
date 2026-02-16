import ReactMarkdown from 'react-markdown'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/stores/settingsStore'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)

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
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
