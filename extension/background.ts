// Spotlight Extension Background Service Worker
// Handles authentication and manages extension lifecycle

chrome.runtime.onInstalled.addListener(() => {
  console.log('Spotlight extension installed')
})

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_AUTH_TOKEN') {
    // Use chrome.identity to get Google OAuth token
    chrome.identity.getAuthToken(
      { interactive: true },
      (token) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message })
        } else {
          sendResponse({ token })
        }
      }
    )
    return true // Keep message channel open for async response
  }

  if (message.type === 'SIGN_OUT') {
    chrome.identity.clearAllCachedAuthTokens(() => {
      sendResponse({ success: true })
    })
    return true
  }
})
