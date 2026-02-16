// Spotlight Extension Content Script
// Injects the Spotlight widget into web pages using Shadow DOM

function injectSpotlight() {
  // Prevent double injection
  if (document.getElementById('spotlight-extension-root')) return

  const host = document.createElement('div')
  host.id = 'spotlight-extension-root'
  host.style.position = 'fixed'
  host.style.zIndex = '2147483647'
  host.style.top = '0'
  host.style.left = '0'
  host.style.width = '0'
  host.style.height = '0'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'closed' })

  // Container for React app
  const container = document.createElement('div')
  container.id = 'spotlight-root'
  shadow.appendChild(container)

  // Styles will be injected by the build process
  // The Vite extension build inlines CSS into the content script bundle
}

// Inject when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSpotlight)
} else {
  injectSpotlight()
}
