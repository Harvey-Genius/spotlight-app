import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  renameSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'fs'

function copyExtensionAssets(): Plugin {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist-extension')

      // Copy manifest.json
      copyFileSync(
        path.resolve(__dirname, 'extension/manifest.json'),
        path.resolve(dist, 'manifest.json')
      )

      // Move popup.html from extension/popup/ to popup/
      const srcHtml = path.resolve(dist, 'extension/popup/popup.html')
      const destDir = path.resolve(dist, 'popup')
      if (existsSync(srcHtml)) {
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
        // Read and fix paths in HTML (Vite generates paths relative to the HTML location)
        let html = readFileSync(srcHtml, 'utf-8')
        // Fix script/CSS paths: from ../../popup.js to ../popup.js etc
        html = html.replace(/\.\.\/\.\.\/popup\.js/g, '../popup.js')
        html = html.replace(/\.\.\/\.\.\/assets\//g, '../assets/')
        writeFileSync(path.resolve(destDir, 'popup.html'), html)
        // Clean up the old directory
        rmSync(path.resolve(dist, 'extension'), { recursive: true })
      }

      // Copy icons
      const iconsDir = path.resolve(dist, 'icons')
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })
      for (const size of ['16', '48', '128']) {
        const src = path.resolve(
          __dirname,
          `extension/icons/icon-${size}.png`
        )
        if (existsSync(src)) {
          copyFileSync(src, path.resolve(iconsDir, `icon-${size}.png`))
        }
      }

      // Copy sidebar icon for content script
      const sidebarIcon = path.resolve(
        __dirname,
        'extension/icons/sidebar-icon.png'
      )
      if (existsSync(sidebarIcon)) {
        copyFileSync(sidebarIcon, path.resolve(iconsDir, 'sidebar-icon.png'))
      }

      // Remove vite.svg if present
      const viteSvg = path.resolve(dist, 'vite.svg')
      if (existsSync(viteSvg)) rmSync(viteSvg)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyExtensionAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'extension/popup/popup.html'),
        background: path.resolve(__dirname, 'extension/background.ts'),
        content: path.resolve(__dirname, 'extension/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
