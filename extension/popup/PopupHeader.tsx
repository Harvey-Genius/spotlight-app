import { SparkleIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { HeaderActions } from '@/components/header/HeaderActions'

export function PopupHeader() {
  const theme = useTheme()

  return (
    <div
      className={`flex items-center justify-between px-6 py-4 border-b ${theme.border} relative z-50`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-sm`}
        >
          <SparkleIcon size={20} />
        </div>
        <div>
          <h1 className={`text-[15px] font-semibold ${theme.text}`}>
            Spotlight
          </h1>
          <p
            className={`text-[10px] ${theme.textMuted} uppercase tracking-[0.12em]`}
          >
            Email Assistant
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <HeaderActions />
      </div>
    </div>
  )
}
