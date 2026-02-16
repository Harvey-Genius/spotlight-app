import { onboardingSlides } from '@/constants'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function OnboardingView() {
  const theme = useTheme()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const onboardingStep = useUiStore((s) => s.onboardingStep)
  const setOnboardingStep = useUiStore((s) => s.setOnboardingStep)
  const navigateTo = useUiStore((s) => s.navigateTo)

  const slide = onboardingSlides[onboardingStep]!

  return (
    <div className="flex-1 flex flex-col px-6 py-6 relative z-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div key={onboardingStep} className="animate-fade-up">
          <div className="text-5xl mb-6">{slide.icon}</div>
          <h2 className={`text-xl font-semibold ${theme.text} mb-3`}>
            {slide.title}
          </h2>
          <p
            className={`text-sm ${theme.textMuted} leading-relaxed max-w-[280px] mx-auto`}
          >
            {slide.description}
          </p>
        </div>
      </div>
      <div className="flex justify-center gap-2 mb-6">
        {onboardingSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setOnboardingStep(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === onboardingStep
                ? `bg-gradient-to-r ${theme.gradient} w-6`
                : darkMode
                  ? 'bg-gray-600'
                  : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {onboardingStep > 0 && (
          <button
            onClick={() => setOnboardingStep(onboardingStep - 1)}
            className={`flex-1 py-3 rounded-xl border ${theme.border} ${theme.text} text-sm font-medium ${theme.hover} transition-all duration-200`}
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            if (onboardingStep < onboardingSlides.length - 1) {
              setOnboardingStep(onboardingStep + 1)
            } else {
              navigateTo('chat')
            }
          }}
          className={`flex-1 py-3 rounded-xl bg-gradient-to-br ${theme.gradient} text-white font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]`}
        >
          {onboardingStep < onboardingSlides.length - 1
            ? 'Next'
            : 'Get Started'}
        </button>
      </div>
    </div>
  )
}
