// Spotlight Content Script — Floating button in bottom-right of Gmail

const ICON_URL = chrome.runtime.getURL('icons/sidebar-icon.png')

function injectButton() {
  if (document.getElementById('spotlight-gmail-btn')) return

  const btn = document.createElement('button')
  btn.id = 'spotlight-gmail-btn'
  btn.title = 'Open Spotlight'

  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '28px',
    right: '28px',
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
    padding: '0',
    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35), 0 0 0 0 rgba(139, 92, 246, 0)',
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
    overflow: 'hidden',
  })

  // Inner glow overlay
  const glow = document.createElement('div')
  Object.assign(glow.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '16px',
    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
    pointerEvents: 'none',
  })
  btn.appendChild(glow)

  // Sparkle SVG icon (matches the app's SparkleIcon)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '24')
  svg.setAttribute('height', '24')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.style.position = 'relative'
  svg.style.zIndex = '1'
  svg.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))'

  // Main sparkle
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path1.setAttribute('d', 'M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z')
  path1.setAttribute('fill', 'white')
  path1.setAttribute('stroke', 'white')
  path1.setAttribute('stroke-width', '0.5')
  path1.setAttribute('stroke-linecap', 'round')
  path1.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(path1)

  // Small sparkle top-right
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path2.setAttribute('d', 'M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z')
  path2.setAttribute('fill', 'rgba(255,255,255,0.8)')
  svg.appendChild(path2)

  // Small sparkle bottom-left
  const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path3.setAttribute('d', 'M5 17l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z')
  path3.setAttribute('fill', 'rgba(255,255,255,0.6)')
  svg.appendChild(path3)

  btn.appendChild(svg)

  // Animate: gentle pulse ring on load
  const keyframes = `
    @keyframes spotlight-pulse {
      0% { box-shadow: 0 4px 20px rgba(124,58,237,0.35), 0 0 0 0 rgba(139,92,246,0.4); }
      70% { box-shadow: 0 4px 20px rgba(124,58,237,0.35), 0 0 0 12px rgba(139,92,246,0); }
      100% { box-shadow: 0 4px 20px rgba(124,58,237,0.35), 0 0 0 0 rgba(139,92,246,0); }
    }
  `
  const style = document.createElement('style')
  style.textContent = keyframes
  document.head.appendChild(style)

  // Pulse twice on first appear, then stop
  btn.style.animation = 'spotlight-pulse 1.5s ease-out 2'

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.1)'
    btn.style.boxShadow = '0 6px 28px rgba(124, 58, 237, 0.5), 0 0 0 0 rgba(139,92,246,0)'
    btn.style.animation = 'none'
  })

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)'
    btn.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.35), 0 0 0 0 rgba(139,92,246,0)'
  })

  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'scale(0.95)'
  })

  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'scale(1.1)'
  })

  btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
  })

  document.body.appendChild(btn)
}

function observe() {
  const observer = new MutationObserver(() => {
    if (!document.getElementById('spotlight-gmail-btn')) {
      injectButton()
    }
  })
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectButton()
    observe()
  })
} else {
  injectButton()
  observe()
}
