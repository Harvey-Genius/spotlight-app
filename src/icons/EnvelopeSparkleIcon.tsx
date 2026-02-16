interface EnvelopeSparkleIconProps {
  size?: number
}

export function EnvelopeSparkleIcon({ size = 48 }: EnvelopeSparkleIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="12" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M6 15l18 12 18-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 6l1 3.5 3.5 1-3.5 1-1 3.5-1-3.5-3.5-1 3.5-1 1-3.5z" fill="currentColor" opacity="0.9"/>
      <path d="M44 12l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" fill="currentColor" opacity="0.6"/>
    </svg>
  )
}
