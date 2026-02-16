import type { ReactNode } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface ConfirmModalProps {
  icon: ReactNode
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  icon,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const theme = useTheme()

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-[26px]">
      <div className={`${theme.bg} rounded-2xl p-6 mx-4 max-w-[320px] shadow-2xl`}>
        <div className="flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className={`text-lg font-semibold ${theme.text} text-center mb-2`}>
          {title}
        </h3>
        <p className={`text-sm ${theme.textMuted} text-center mb-6`}>
          {description}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl border ${theme.border} ${theme.text} text-sm font-medium ${theme.hover} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
