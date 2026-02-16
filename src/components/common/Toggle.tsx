interface ToggleProps {
  enabled: boolean
  onChange: () => void
}

export function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-6 rounded-full transition-colors ${
        enabled ? 'bg-violet-500' : 'bg-gray-300'
      } relative`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  )
}
