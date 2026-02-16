import { useState } from 'react'
import { EnvelopeSparkleIcon, GoogleIcon } from '@/icons'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

export function AuthView() {
  const [error, setError] = useState('')
  const theme = useTheme()
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const navigateTo = useUiStore((s) => s.navigateTo)

  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 relative z-10">
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white mb-6 shadow-lg animate-fade-up`}
      >
        <EnvelopeSparkleIcon size={36} />
      </div>
      <div className="text-center mb-8 animate-fade-up">
        <h2 className={`text-xl font-semibold ${theme.text} mb-2`}>
          Connect your inbox
        </h2>
        <p className={`text-sm ${theme.textMuted} max-w-[260px]`}>
          Sign in with Google to let Spotlight help you manage your emails.
        </p>
      </div>
      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-fade-up w-full max-w-[280px]">
          {error}
        </div>
      )}
      <button
        onClick={handleGoogleSignIn}
        className="w-full max-w-[280px] py-3.5 px-4 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 animate-fade-up"
      >
        <GoogleIcon />
        <span className="text-sm font-medium text-gray-700">
          Continue with Google
        </span>
      </button>
      <p
        className={`text-[11px] ${theme.textMuted} text-center mt-6 animate-fade-up`}
      >
        By continuing, you agree to our{' '}
        <button
          onClick={() => navigateTo('legal', 'terms')}
          className="underline hover:text-violet-500"
        >
          Terms
        </button>{' '}
        and{' '}
        <button
          onClick={() => navigateTo('legal', 'privacy')}
          className="underline hover:text-violet-500"
        >
          Privacy Policy
        </button>
      </p>
    </div>
  )
}
