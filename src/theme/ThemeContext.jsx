// ThemeContext.jsx – React Context for theme switching
//
// Provides { theme, themeName, cycleTheme } via useTheme() hook.
// Persists selection to localStorage.  Applies body-level styles
// (background, font, CSS class) that cannot be done inline.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { themes, themeOrder } from './themes.js'

const ThemeContext = createContext(null)

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('art-theme')
    if (saved && themes[saved]) return saved
  } catch (_) { /* ignore */ }
  return 'cyber'
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(getInitialTheme)
  const theme = themes[themeName]

  const cycleTheme = useCallback(() => {
    setThemeName(prev => {
      const idx = themeOrder.indexOf(prev)
      const next = themeOrder[(idx + 1) % themeOrder.length]
      try { localStorage.setItem('art-theme', next) } catch (_) { /* ignore */ }
      return next
    })
  }, [])

  // Apply body-level styles that cannot be set via React inline styles
  useEffect(() => {
    const body = document.body

    // Background
    body.style.background = theme.colors.pageBg
    if (theme.special.bgPattern) {
      body.style.backgroundImage = theme.special.bgPattern
    } else {
      body.style.backgroundImage = 'none'
    }

    // Text defaults
    body.style.color      = theme.colors.textPrimary
    body.style.fontFamily = theme.fonts.body

    // CSS class for pseudo-element styles (scrollbars, etc.)
    body.className = theme.special.bodyClass || ''
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, themeName, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
