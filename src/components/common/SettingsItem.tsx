import type { ReactNode } from 'react'
import { ChevronRightIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'

interface SettingsItemProps {
  icon: ReactNode
  iconBg: string
  label: string
  sublabel?: string
  onClick?: () => void
  trailing?: ReactNode
  danger?: boolean
}

export function SettingsItem({
  icon,
  iconBg,
  label,
  sublabel,
  onClick,
  trailing,
  danger,
}: SettingsItemProps) {
  const theme = useTheme()

  return (
    <button
      onClick={onClick}
      className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
    >
      <div
        className={`h-9 w-9 rounded-full ${iconBg} flex items-center justify-center`}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p
          className={`text-sm font-medium ${danger ? 'text-red-500' : theme.text}`}
        >
          {label}
        </p>
        {sublabel && (
          <p className={`text-xs ${theme.textMuted}`}>{sublabel}</p>
        )}
      </div>
      {trailing ?? <ChevronRightIcon />}
    </button>
  )
}
