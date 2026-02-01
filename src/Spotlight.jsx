import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from './contexts/AuthContext'
import { getRecentEmails, searchEmails } from './lib/gmail'
import { supabase } from './lib/supabase'

const SparkleIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
    <path d="M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" opacity="0.7"/>
    <path d="M5 17l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" opacity="0.5"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const EnvelopeSparkleIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="6" y="12" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M6 15l18 12 18-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M38 6l1 3.5 3.5 1-3.5 1-1 3.5-1-3.5-3.5-1 3.5-1 1-3.5z" fill="currentColor" opacity="0.9"/>
    <path d="M44 12l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" fill="currentColor" opacity="0.6"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const CrownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    <path d="M3 20h18"/>
  </svg>
)

const UserXIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="18" y1="8" x2="23" y2="13"/>
    <line x1="23" y1="8" x2="18" y2="13"/>
  </svg>
)

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const features = [
  "Ask questions in plain English",
  "Summaries + action items",
  "Private by design"
]

const greetings = [
  "Hey, what do you need?",
  "I'm here to help",
  "What can I do for you?",
  "Ready when you are",
  "Just ask away",
]

const onboardingSlides = [
  {
    icon: '💬',
    title: 'Ask in plain English',
    description: 'Just type what you\'re looking for. "Show me emails about the project deadline" or "What did Sarah say about the budget?"'
  },
  {
    icon: '📋',
    title: 'Summaries & action items',
    description: 'Get instant summaries of long email threads and automatically extract action items so nothing falls through the cracks.'
  },
  {
    icon: '🔒',
    title: 'Private by design',
    description: 'Your emails stay yours. We only access what you ask for, and we never store or sell your data.'
  },
  {
    icon: '✨',
    title: 'You\'re all set!',
    description: 'Start by asking Spotlight anything about your inbox. We\'ll help you find what matters.'
  }
]

const TermsContent = ({ darkMode }) => (
  <div className={`space-y-6 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last updated: January 2026</p>
    <section>
      <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>1. Acceptance of Terms</h3>
      <p>By accessing or using Spotlight ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
    </section>
    <section>
      <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>2. Description of Service</h3>
      <p>Spotlight is an AI-powered email assistant that helps you search, summarize, and manage your Gmail inbox.</p>
    </section>
    <section>
      <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>3. Privacy</h3>
      <p>Your emails stay private. We only access what you request and never store or sell your data.</p>
    </section>
  </div>
)

const PrivacyContent = ({ darkMode }) => (
  <div className={`space-y-6 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last updated: January 2026</p>
    <section>
      <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>1. Data Collection</h3>
      <p>We collect only the data necessary to provide our service: your email address and OAuth tokens for Gmail access.</p>
    </section>
    <section>
      <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>2. Data Usage</h3>
      <p>Email content is processed in real-time to answer your queries. We do not permanently store your email content.</p>
    </section>
    <section>
      <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>3. Third Parties</h3>
      <p>We use Google OAuth, Supabase, and OpenAI to provide our service. Your data is handled according to their respective privacy policies.</p>
    </section>
  </div>
)

export default function Spotlight() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState('welcome')
  const [legalView, setLegalView] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "How can I help?" }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [emailsLoaded, setEmailsLoaded] = useState(false)
  const [cachedEmails, setCachedEmails] = useState([])
  const [greeting, setGreeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)])
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [legalFromSettings, setLegalFromSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const messagesEndRef = useRef(null)

  const { user, signIn, signUp, signInWithGoogle, signOut, getProviderToken } = useAuth()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setGreeting(greetings[Math.floor(Math.random() * greetings.length)])
    }
  }, [isOpen])

  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setCurrentView('welcome')
    setEmail('')
    setPassword('')
    setMessages([
      { role: 'assistant', content: "How can I help?" }
    ])
  }

  const handleExportData = () => {
    const exportData = {
      account: {
        email: user?.email,
        name: user?.user_metadata?.full_name,
        created_at: user?.created_at,
        last_sign_in: user?.last_sign_in_at,
      },
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spotlight-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = async () => {
    try {
      await signOut()
      setCurrentView('welcome')
      setShowSettings(false)
      setSettingsView(null)
      setShowDeleteConfirm(false)
      setMessages([{ role: 'assistant', content: "How can I help?" }])
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const providerToken = getProviderToken()

      if (!providerToken) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I don't have access to your emails yet. Please sign out and sign back in with Google to grant Gmail permissions."
        }])
        setChatLoading(false)
        return
      }

      let emails = []
      const fromMatch = userMessage.match(/from\s+([a-zA-Z0-9@._-]+)/i)
      const aboutMatch = userMessage.match(/about\s+["']?([^"'?]+)["']?/i)

      try {
        if (fromMatch) {
          const searchQuery = `from:${fromMatch[1]}`
          emails = await searchEmails(providerToken, searchQuery, 20)
        } else if (aboutMatch) {
          emails = await searchEmails(providerToken, aboutMatch[1].trim(), 20)
        } else {
          if (!emailsLoaded) {
            emails = await getRecentEmails(providerToken, 50)
            setCachedEmails(emails)
            setEmailsLoaded(true)
          } else {
            emails = cachedEmails
          }
        }
      } catch (err) {
        console.error('Failed to fetch emails:', err)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I had trouble accessing your emails. The Gmail permission might have expired. Try signing out and back in with Google."
        }])
        setChatLoading(false)
        return
      }

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          emails: emails.slice(0, 25),
        },
      })

      if (error) throw error

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || "Sorry, I couldn't process that request."
      }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again."
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const effectiveView = currentView === 'onboarding'
    ? 'onboarding'
    : user && isOpen
      ? 'authenticated'
      : currentView

  const theme = {
    bg: darkMode ? 'bg-gray-900/95' : 'bg-white',
    border: darkMode ? 'border-gray-700/50' : 'border-black/[0.06]',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    gradient: 'from-violet-500 to-blue-500',
    hover: darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
  }

  return (
    <div className={`w-full h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-100'} relative`}>
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)'} 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Launch button */}
      <div className="group fixed bottom-6 left-6 z-50">
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            if (isOpen) setCurrentView('welcome')
          }}
          className={`bubble-glow h-12 w-12 rounded-full bg-gradient-to-br ${theme.gradient} text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center`}
        >
          <SparkleIcon size={22} />
        </button>
        <span className={`absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'} shadow-lg`}>
          Open Spotlight
        </span>
      </div>

      {isOpen && (
        <div className={`fixed right-5 top-5 bottom-5 w-[400px] ${theme.bg} rounded-[26px] shadow-[0_8px_60px_rgba(0,0,0,0.12),0_0_0_1px_rgba(139,92,246,0.05)] border ${theme.border} flex flex-col overflow-hidden animate-slide-in backdrop-blur-xl`}>
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
          />

          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.border} animate-fade-up relative z-50`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-sm`}>
                <SparkleIcon size={20} className="animate-shimmer" />
              </div>
              <div>
                <h1 className={`text-[15px] font-semibold ${theme.text}`}>Spotlight</h1>
                <p className={`text-[10px] ${theme.textMuted} uppercase tracking-[0.12em]`}>Email Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {effectiveView === 'authenticated' && !showSettings && !legalView && (
                <>
                  <button
                    onClick={() => {
                      setMessages([{ role: 'assistant', content: "How can I help?" }])
                      setCachedEmails([])
                      setEmailsLoaded(false)
                      setGreeting(greetings[Math.floor(Math.random() * greetings.length)])
                    }}
                    className={`icon-btn h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover}`}
                    title="New chat"
                  >
                    <PlusIcon />
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className={`icon-btn h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover}`}
                  >
                    <SettingsIcon />
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setCurrentView('welcome')
                  setShowSettings(false)
                }}
                className={`icon-btn h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover}`}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Welcome View */}
          {effectiveView === 'welcome' && (
            <>
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white mb-6 shadow-lg animate-fade-up`}>
                  <SparkleIcon size={26} className="animate-shimmer" />
                </div>
                <h2 className={`text-xl font-semibold ${theme.text} text-center mb-2 animate-fade-up`}>
                  Find what matters in your inbox.
                </h2>
                <p className={`text-sm ${theme.textMuted} text-center mb-6 animate-fade-up`}>
                  Due dates, updates, and reminders—fast.
                </p>
                <div className="space-y-2.5 mb-8 animate-fade-up">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                        <CheckIcon />
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full max-w-[280px] animate-fade-up">
                  <button
                    onClick={() => setCurrentView('main')}
                    className={`w-full py-3.5 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white font-medium text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]`}
                  >
                    Get Started
                  </button>
                </div>
              </div>
              <div className={`px-6 py-4 border-t ${theme.border} animate-fade-up relative z-10`}>
                <p className={`text-[11px] ${theme.textMuted} text-center`}>
                  Spotlight only accesses what you request. We never sell your data.
                </p>
              </div>
            </>
          )}

          {/* Main View - Auth */}
          {effectiveView === 'main' && !legalView && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 relative z-10">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white mb-6 shadow-lg animate-fade-up`}>
                <EnvelopeSparkleIcon size={36} />
              </div>
              <div className="text-center mb-8 animate-fade-up">
                <h2 className={`text-xl font-semibold ${theme.text} mb-2`}>Connect your inbox</h2>
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
                <span className="text-sm font-medium text-gray-700">Continue with Google</span>
              </button>
              <p className={`text-[11px] ${theme.textMuted} text-center mt-6 animate-fade-up`}>
                By continuing, you agree to our{' '}
                <button onClick={() => setLegalView('terms')} className="underline hover:text-violet-500">Terms</button>
                {' '}and{' '}
                <button onClick={() => setLegalView('privacy')} className="underline hover:text-violet-500">Privacy Policy</button>
              </p>
            </div>
          )}

          {/* Terms View */}
          {legalView === 'terms' && (
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
              <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b ${theme.border}`}>
                <button
                  onClick={() => {
                    setLegalView(null)
                    if (legalFromSettings) {
                      setShowSettings(true)
                      setLegalFromSettings(false)
                    }
                  }}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover} transition-colors`}
                >
                  <BackIcon />
                </button>
                <h2 className={`text-base font-semibold ${theme.text}`}>Terms of Service</h2>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
                <TermsContent darkMode={darkMode} />
              </div>
            </div>
          )}

          {/* Privacy View */}
          {legalView === 'privacy' && (
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
              <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b ${theme.border}`}>
                <button
                  onClick={() => {
                    setLegalView(null)
                    if (legalFromSettings) {
                      setShowSettings(true)
                      setLegalFromSettings(false)
                    }
                  }}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover} transition-colors`}
                >
                  <BackIcon />
                </button>
                <h2 className={`text-base font-semibold ${theme.text}`}>Privacy Policy</h2>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
                <PrivacyContent darkMode={darkMode} />
              </div>
            </div>
          )}

          {/* Onboarding View */}
          {effectiveView === 'onboarding' && (
            <div className="flex-1 flex flex-col px-6 py-6 relative z-10">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div key={onboardingStep} className="animate-fade-up">
                  <div className="text-5xl mb-6">{onboardingSlides[onboardingStep].icon}</div>
                  <h2 className={`text-xl font-semibold ${theme.text} mb-3`}>
                    {onboardingSlides[onboardingStep].title}
                  </h2>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed max-w-[280px] mx-auto`}>
                    {onboardingSlides[onboardingStep].description}
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
                        : darkMode ? 'bg-gray-600' : 'bg-gray-300'
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
                      setCurrentView('authenticated')
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl bg-gradient-to-br ${theme.gradient} text-white font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]`}
                >
                  {onboardingStep < onboardingSlides.length - 1 ? 'Next' : 'Get Started'}
                </button>
              </div>
            </div>
          )}

          {/* Settings View */}
          {effectiveView === 'authenticated' && showSettings && (
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
              <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b ${theme.border}`}>
                <button
                  onClick={() => {
                    if (settingsView) {
                      setSettingsView(null)
                    } else {
                      setShowSettings(false)
                    }
                  }}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${theme.textMuted} ${theme.hover} transition-colors`}
                >
                  <BackIcon />
                </button>
                <h2 className={`text-base font-semibold ${theme.text}`}>
                  {settingsView === 'account' ? 'Account' : 'Settings'}
                </h2>
              </div>

              {/* Account Sub-View */}
              {settingsView === 'account' && (
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                  <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bg}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-xl font-semibold`}>
                        {(user?.user_metadata?.full_name || user?.email)?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-semibold ${theme.text} truncate`}>
                          {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className={`text-sm ${theme.textMuted} truncate`}>{user?.email}</p>
                      </div>
                    </div>
                    <div className={`pt-4 border-t ${theme.border} space-y-3`}>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textMuted}`}>Sign-in method</span>
                        <span className={`text-sm ${theme.text} font-medium`}>Google</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textMuted}`}>Account status</span>
                        <span className="text-sm text-green-500 font-medium">Active</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>Subscription</p>
                    <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bg}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'} flex items-center justify-center text-amber-500`}>
                          <CrownIcon />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text}`}>Free Plan</p>
                          <p className={`text-xs ${theme.textMuted}`}>Basic features included</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Pro upgrade coming soon!')}
                        className={`w-full py-2.5 rounded-xl bg-gradient-to-br ${theme.gradient} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
                      >
                        Upgrade to Pro
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>Data Management</p>
                    <div className="space-y-1">
                      <button
                        onClick={handleExportData}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-cyan-900/50' : 'bg-cyan-100'} flex items-center justify-center text-cyan-500`}>
                          <DownloadIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${theme.text}`}>Export Data</p>
                          <p className={`text-xs ${theme.textMuted}`}>Download a copy of your data</p>
                        </div>
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>Danger Zone</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          handleSignOut()
                          setShowSettings(false)
                          setSettingsView(null)
                        }}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-red-900/50' : 'bg-red-100'} flex items-center justify-center text-red-500`}>
                          <LogOutIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-red-500">Sign Out</p>
                          <p className={`text-xs ${theme.textMuted}`}>You'll need to sign in again</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-red-900/50' : 'bg-red-100'} flex items-center justify-center text-red-500`}>
                          <UserXIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-red-500">Delete Account</p>
                          <p className={`text-xs ${theme.textMuted}`}>Permanently delete your account and data</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-[26px]">
                  <div className={`${theme.bg} rounded-2xl p-6 mx-4 max-w-[320px] shadow-2xl`}>
                    <div className="flex items-center justify-center mb-4">
                      <div className={`h-12 w-12 rounded-full ${darkMode ? 'bg-red-900/50' : 'bg-red-100'} flex items-center justify-center text-red-500`}>
                        <UserXIcon />
                      </div>
                    </div>
                    <h3 className={`text-lg font-semibold ${theme.text} text-center mb-2`}>Delete Account?</h3>
                    <p className={`text-sm ${theme.textMuted} text-center mb-6`}>
                      This action cannot be undone. All your data will be permanently removed.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className={`flex-1 py-2.5 rounded-xl border ${theme.border} ${theme.text} text-sm font-medium ${theme.hover} transition-colors`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Content */}
              {!settingsView && (
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>Account</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsView('account')}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-sm font-semibold`}>
                          {(user?.user_metadata?.full_name || user?.email)?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${theme.text}`}>
                            {user?.user_metadata?.full_name || 'User'}
                          </p>
                          <p className={`text-xs ${theme.textMuted}`}>{user?.email}</p>
                        </div>
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>Appearance</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'} flex items-center justify-center ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`}>
                          <MoonIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${theme.text}`}>Dark Mode</p>
                          <p className={`text-xs ${theme.textMuted}`}>{darkMode ? 'On' : 'Off'}</p>
                        </div>
                        <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-violet-500' : 'bg-gray-300'} relative`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${darkMode ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>Notifications</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'} flex items-center justify-center text-amber-500`}>
                          <BellIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${theme.text}`}>Push Notifications</p>
                          <p className={`text-xs ${theme.textMuted}`}>{notificationsEnabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                        <div className={`w-10 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-violet-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'} relative`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>Privacy & Data</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsView('account')}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-green-900/50' : 'bg-green-100'} flex items-center justify-center text-green-500`}>
                          <ShieldIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${theme.text}`}>Connected Accounts</p>
                          <p className={`text-xs ${theme.textMuted}`}>Gmail</p>
                        </div>
                        <ChevronRightIcon />
                      </button>
                      <button
                        onClick={() => {
                          setMessages([{ role: 'assistant', content: "How can I help?" }])
                          setCachedEmails([])
                          setEmailsLoaded(false)
                        }}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-rose-900/50' : 'bg-rose-100'} flex items-center justify-center text-rose-500`}>
                          <TrashIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${theme.text}`}>Clear Chat History</p>
                          <p className={`text-xs ${theme.textMuted}`}>Delete all conversations</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider px-2 mb-2`}>About</p>
                    <div className="space-y-1">
                      <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl`}>
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-violet-900/50' : 'bg-violet-100'} flex items-center justify-center text-violet-500`}>
                          <InfoIcon />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${theme.text}`}>Version</p>
                          <p className={`text-xs ${theme.textMuted}`}>1.0.0</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowSettings(false)
                          setLegalFromSettings(true)
                          setLegalView('terms')
                        }}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'} flex items-center justify-center text-blue-500`}>
                          <FileTextIcon />
                        </div>
                        <p className={`text-sm font-medium ${theme.text}`}>Terms of Service</p>
                        <ChevronRightIcon />
                      </button>
                      <button
                        onClick={() => {
                          setShowSettings(false)
                          setLegalFromSettings(true)
                          setLegalView('privacy')
                        }}
                        className={`settings-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme.hover}`}
                      >
                        <div className={`h-9 w-9 rounded-full ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'} flex items-center justify-center text-blue-500`}>
                          <ShieldIcon />
                        </div>
                        <p className={`text-sm font-medium ${theme.text}`}>Privacy Policy</p>
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          {effectiveView === 'authenticated' && !showSettings && !legalView && (
            <div className="flex-1 flex flex-col relative z-10 min-h-0">
              <div className="flex-1 overflow-y-auto px-4 py-4 scroll-fade">
                {messages.length === 1 && messages[0].role === 'assistant' ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-2xl font-semibold text-center bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                      {greeting}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? `bg-gradient-to-br ${theme.gradient} text-white shadow-md`
                              : `${darkMode ? 'bg-gray-800' : 'bg-gray-100'} ${theme.text}`
                          }`}
                        >
                          {message.role === 'user' ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <div className={`text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2.5 prose-ul:my-3 prose-ol:my-3 prose-li:my-2 prose-headings:my-3 prose-strong:font-semibold prose-hr:my-4 prose-hr:border-gray-200 ${darkMode ? 'prose-invert prose-hr:border-gray-600' : ''}`}>
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start animate-message-in">
                        <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className="typing-dot w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                            <div className="typing-dot w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                            <div className="typing-dot w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className={`flex-shrink-0 px-4 py-3 border-t ${theme.border}`}>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your emails..."
                    className={`input-glow flex-1 py-2.5 px-4 rounded-xl border ${theme.border} ${theme.bg} ${theme.text} text-sm focus:outline-none focus:border-violet-500 transition-all ${darkMode ? 'placeholder:text-gray-500' : 'placeholder:text-gray-400'}`}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className={`send-btn h-10 w-10 rounded-xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <SendIcon />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
