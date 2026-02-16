import { useSettingsStore } from '@/stores/settingsStore'

export interface Theme {
  bg: string
  border: string
  text: string
  textMuted: string
  gradient: string
  hover: string
}

export function useTheme(): Theme {
  const darkMode = useSettingsStore((s) => s.darkMode)

  return {
    bg: darkMode ? 'bg-gray-900/95' : 'bg-white',
    border: darkMode ? 'border-gray-700/50' : 'border-black/[0.06]',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    gradient: 'from-violet-500 to-blue-500',
    hover: darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
  }
}
