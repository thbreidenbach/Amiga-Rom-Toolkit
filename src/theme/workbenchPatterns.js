// workbenchPatterns.js – Visual helpers for Workbench themes
//
// Provides beveled borders, card styling, and Workbench window chrome
// that are no-ops for the Cyber theme (returns flat styling instead).

/**
 * Returns a border style object.
 * - Cyber theme: simple 1px solid border
 * - Workbench themes: 3D beveled border (raised or sunken)
 */
export function beveledBox(theme, raised = true) {
  if (!theme.borders.bevelLight) {
    return { border: `1px solid ${theme.colors.borderPrimary}` }
  }
  const w = theme.borders.bevelWidth
  const light = raised ? theme.borders.bevelLight : theme.borders.bevelDark
  const dark  = raised ? theme.borders.bevelDark  : theme.borders.bevelLight
  return {
    borderTop:    `${w}px solid ${light}`,
    borderLeft:   `${w}px solid ${light}`,
    borderBottom: `${w}px solid ${dark}`,
    borderRight:  `${w}px solid ${dark}`,
  }
}

/**
 * Returns a complete card container style for the active theme.
 */
export function cardStyle(theme) {
  return {
    background:   theme.colors.cardBg,
    ...beveledBox(theme),
    borderRadius: theme.borders.radius,
    padding:      theme.name === 'cyber' ? 20 : 0,  // WB cards have content inside window body
    marginBottom: 16,
  }
}

/**
 * Returns a style object for a Workbench-style button (beveled, flat colors).
 * Falls back to the existing cyber-style button if no bevel is configured.
 */
export function wbButton(theme, bg, border, text) {
  const base = {
    fontFamily:    theme.fonts.mono,
    fontSize:      theme.name === 'cyber' ? 10 : 12,
    letterSpacing: theme.name === 'cyber' ? 1 : 0,
    background:    bg,
    color:         text,
    padding:       theme.name === 'cyber' ? '3px 8px' : '4px 10px',
    cursor:        'pointer',
  }
  if (theme.borders.bevelLight) {
    return { ...base, ...beveledBox(theme) }
  }
  return { ...base, border: `1px solid ${border}` }
}
