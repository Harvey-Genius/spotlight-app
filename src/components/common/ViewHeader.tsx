import { BackIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'

interface ViewHeaderProps {
  title: string
  onBack: () => void
}

export function ViewHeader({ title, onBack }: ViewHeaderProps) {
  const theme = useTheme()

  return (
    <div
      className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b ${theme.border}`}
    >
      <button
        onClick={onBack}
        className={`h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover} transition-colors`}
      >
        <BackIcon />
      </button>
      <h2 className={`text-base font-semibold ${theme.text}`}>{title}</h2>
    </div>
  )
}
