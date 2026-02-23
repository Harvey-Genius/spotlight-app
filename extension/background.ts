// Spotlight Extension Background Service Worker
// Handles authentication, side panel, notifications, and extension lifecycle

const GOOGLE_CLIENT_ID =
  '698235805836-fdiopq0e75d3j74df54rn5g2phrfv4el.apps.googleusercontent.com'

const SUPABASE_URL = 'https://ilvubumkfsbzbzinwiyt.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdnVidW1rZnNiemJ6aW53aXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjIyMjIsImV4cCI6MjA3OTMzODIyMn0.pkMg-1TfOSMdrt9i-UAgjkgdCMx3ienYzjK-soEe58A'

const CHECK_INTERVAL_MINUTES = 5

// Open side panel when toolbar icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

// Set up notification alarm on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Spotlight extension installed')
  chrome.alarms.create('check-notifications', {
    periodInMinutes: CHECK_INTERVAL_MINUTES,
  })
})

// Ensure alarm exists on service worker startup (can restart anytime)
chrome.alarms.create('check-notifications', {
  periodInMinutes: CHECK_INTERVAL_MINUTES,
})

// SHA-256 hash a string and return hex
async function sha256hex(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ===== NOTIFICATION CHECK =====

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'check-notifications') return

  try {
    const result = await chrome.storage.local.get(['supabase_access_token'])
    const token = result.supabase_access_token
    if (!token) return // Not logged in

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/check-notifications`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({}),
      }
    )

    if (!response.ok) return // Token expired or error — skip silently

    const data = await response.json()
    const matches = data.matches || []

    for (const match of matches) {
      const sender =
        match.from
          ?.replace(/<[^>]+>/g, '')
          .trim()
          .substring(0, 40) || 'Unknown'

      chrome.notifications.create(`spotlight-${match.gmail_message_id}`, {
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: `New email from ${sender}`,
        message: match.subject || '(no subject)',
        priority: 1,
      })
    }
  } catch (err) {
    console.error('[Spotlight] Notification check failed:', err)
  }
})

// Click notification → open side panel
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (!notificationId.startsWith('spotlight-')) return

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tabs[0]?.id) {
    chrome.sidePanel.open({ tabId: tabs[0].id })
  }

  chrome.notifications.clear(notificationId)
})

// ===== MESSAGE HANDLERS =====

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Content script asks to open the side panel
  if (message.type === 'OPEN_SIDE_PANEL') {
    const tabId = sender.tab?.id
    const windowId = sender.tab?.windowId
    if (tabId && windowId) {
      // Use windowId — more reliable for user-gesture propagation
      chrome.sidePanel
        .open({ windowId })
        .then(() => {
          sendResponse({ success: true })
        })
        .catch((err: Error) => {
          console.error('[Spotlight] Failed to open side panel:', err.message)
          sendResponse({ error: err.message })
        })
    } else {
      sendResponse({ error: 'No tab ID' })
    }
    return true
  }

  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message })
      } else {
        sendResponse({ token })
      }
    })
    return true
  }

  if (message.type === 'GET_GOOGLE_ID_TOKEN') {
    const rawNonce = crypto.randomUUID()
    const redirectUri = chrome.identity.getRedirectURL()
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ].join(' ')

    sha256hex(rawNonce).then((hashedNonce) => {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'id_token token')
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('nonce', hashedNonce)
      authUrl.searchParams.set('prompt', 'consent')

      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive: true },
        (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            sendResponse({
              error: chrome.runtime.lastError?.message || 'Auth failed',
            })
            return
          }

          const hashIndex = responseUrl.indexOf('#')
          if (hashIndex === -1) {
            sendResponse({ error: 'No tokens in response' })
            return
          }

          const params = new URLSearchParams(
            responseUrl.substring(hashIndex + 1)
          )
          const idToken = params.get('id_token')
          const accessToken = params.get('access_token')

          if (!idToken || !accessToken) {
            sendResponse({ error: 'Missing tokens in response' })
            return
          }

          sendResponse({ idToken, accessToken, nonce: rawNonce })
        }
      )
    })
    return true
  }

  // Store Supabase token for background notification checks
  if (message.type === 'STORE_SUPABASE_TOKEN') {
    chrome.storage.local.set({ supabase_access_token: message.token })
    sendResponse({ success: true })
    return true
  }

  // Clear Supabase token on sign out
  if (message.type === 'CLEAR_SUPABASE_TOKEN') {
    chrome.storage.local.remove('supabase_access_token')
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'SIGN_OUT') {
    chrome.storage.local.remove('supabase_access_token')
    chrome.identity.clearAllCachedAuthTokens(() => {
      sendResponse({ success: true })
    })
    return true
  }
})
