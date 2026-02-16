import { ViewHeader } from '@/components/common/ViewHeader'
import { TermsContent } from '@/content/TermsContent'
import { PrivacyContent } from '@/content/PrivacyContent'
import { useUiStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function LegalView() {
  const legalType = useUiStore((s) => s.legalType)
  const goBack = useUiStore((s) => s.goBack)
  const darkMode = useSettingsStore((s) => s.darkMode)

  const title =
    legalType === 'terms' ? 'Terms of Service' : 'Privacy Policy'

  return (
    <div className="flex-1 flex flex-col min-h-0 relative z-10">
      <ViewHeader title={title} onBack={goBack} />
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
        {legalType === 'terms' ? (
          <TermsContent darkMode={darkMode} />
        ) : (
          <PrivacyContent darkMode={darkMode} />
        )}
      </div>
    </div>
  )
}
