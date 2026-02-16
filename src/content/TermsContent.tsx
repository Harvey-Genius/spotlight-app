interface TermsContentProps {
  darkMode: boolean
}

export function TermsContent({ darkMode }: TermsContentProps) {
  return (
    <div
      className={`space-y-6 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}
    >
      <p
        className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
      >
        Last updated: January 2026
      </p>
      <section>
        <h3
          className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}
        >
          1. Acceptance of Terms
        </h3>
        <p>
          By accessing or using Spotlight (&quot;the Service&quot;), you agree
          to be bound by these Terms of Service. If you do not agree to these
          terms, please do not use the Service.
        </p>
      </section>
      <section>
        <h3
          className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}
        >
          2. Description of Service
        </h3>
        <p>
          Spotlight is an AI-powered email assistant that helps you search,
          summarize, and manage your Gmail inbox.
        </p>
      </section>
      <section>
        <h3
          className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}
        >
          3. Privacy
        </h3>
        <p>
          Your emails stay private. We only access what you request and never
          store or sell your data.
        </p>
      </section>
    </div>
  )
}
