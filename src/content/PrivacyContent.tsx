interface PrivacyContentProps {
  darkMode: boolean
}

export function PrivacyContent({ darkMode }: PrivacyContentProps) {
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
          1. Data Collection
        </h3>
        <p>
          We collect only the data necessary to provide our service: your email
          address and OAuth tokens for Gmail access.
        </p>
      </section>
      <section>
        <h3
          className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}
        >
          2. Data Usage
        </h3>
        <p>
          Email content is processed in real-time to answer your queries. We do
          not permanently store your email content.
        </p>
      </section>
      <section>
        <h3
          className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}
        >
          3. Third Parties
        </h3>
        <p>
          We use Google OAuth, Supabase, and OpenAI to provide our service. Your
          data is handled according to their respective privacy policies.
        </p>
      </section>
    </div>
  )
}
