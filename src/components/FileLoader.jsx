// FileLoader.jsx – ROM file drop zone

import React, { useCallback, useState } from 'react'
import { useTheme }        from '../theme/ThemeContext.jsx'
import { themeLabels }     from '../theme/themes.js'
import { beveledBox }      from '../theme/workbenchPatterns.js'
import { KickstartHand }   from '../theme/KickstartHand.jsx'

export function FileLoader({ onLoad, error }) {
  const [dragging, setDragging] = useState(false)
  const { theme, themeName, cycleTheme } = useTheme()
  const s = getStyles(theme)

  const handleFile = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = e => onLoad(e.target.result, file.name)
    reader.readAsArrayBuffer(file)
  }, [onLoad])

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = e => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  return (
    <div style={s.wrapper}>
      {/* Theme toggle in top-right corner */}
      <button style={s.themeBtn} onClick={cycleTheme} title="Switch theme">
        {themeLabels[themeName]}
      </button>

      <div style={s.logo}>AMIGA ROM TOOLKIT</div>
      <div style={s.sub}>Analyse · Patch · Validate · Export</div>

      <div style={{ position: 'relative' }}>
        {/* Kickstart background (Workbench themes only) */}
        {theme.special.showKickstartHand && (
          <KickstartHand
            themeName={theme.name}
            width={theme.name === 'wb3' ? 480 : 300}
            height={theme.name === 'wb3' ? 384 : 400}
            style={{
              position: 'absolute',
              right: theme.name === 'wb3' ? -60 : -20,
              bottom: theme.name === 'wb3' ? -80 : -60,
              opacity: 0.15,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        <div
          style={{ ...s.dropzone, ...(dragging ? s.dropzoneDrag : {}), position: 'relative', zIndex: 1 }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('rom-file-input').click()}
        >
          <div style={s.dropIcon}>{theme.name === 'cyber' ? '\u25C8' : '\uD83D\uDCBE'}</div>
          <div style={s.dropText}>DROP ROM IMAGE HERE</div>
          <div style={s.dropSub}>or click to browse · any binary · 256 KB or 512 KB</div>
          <input id="rom-file-input" type="file" style={s.hidden} onChange={onInputChange} />
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.hint}>
        Supports Kickstart 1.x · 2.x · 3.x · 3.2 ROM images
      </div>
    </div>
  )
}

function getStyles(t) {
  const isWb = t.name !== 'cyber'
  return {
    wrapper:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 32 },
    logo:         { fontFamily: t.fonts.display, fontSize: isWb ? 28 : 42, fontWeight: 900, color: t.colors.accent, letterSpacing: isWb ? 2 : 8, textShadow: t.special.textShadow },
    sub:          { fontFamily: t.fonts.mono, color: t.colors.textSecondary, fontSize: 13, letterSpacing: isWb ? 1 : 4 },
    dropzone:     { ...beveledBox(t), borderRadius: t.borders.radius, padding: isWb ? '48px 64px' : '64px 96px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s', background: t.colors.inputBg, ...(isWb ? {} : { border: `2px dashed ${t.colors.textVeryDim}` }) },
    dropzoneDrag: isWb
      ? { background: t.colors.highlightBg }
      : { border: `2px dashed ${t.colors.accent}`, background: t.colors.highlightBg, boxShadow: `0 0 30px ${t.colors.accentDim}` },
    dropIcon:     { fontSize: isWb ? 48 : 56, color: t.colors.accent, lineHeight: 1 },
    dropText:     { fontFamily: t.fonts.display, fontSize: isWb ? 14 : 16, color: t.colors.textPrimary, letterSpacing: isWb ? 1 : 4 },
    dropSub:      { fontFamily: t.fonts.mono, fontSize: 12, color: t.colors.textDim },
    hidden:       { display: 'none' },
    error:        { color: t.colors.error, fontFamily: t.fonts.mono, fontSize: 13, background: t.colors.errorBg, border: `1px solid ${t.colors.error}`, borderRadius: t.borders.radius, padding: '8px 16px' },
    hint:         { fontFamily: t.fonts.mono, color: t.colors.textVeryDim, fontSize: 11, letterSpacing: isWb ? 0 : 2 },
    themeBtn:     { position: 'fixed', top: 12, right: 12, fontFamily: t.fonts.mono, fontSize: 10, background: isWb ? t.colors.accent : 'none', color: isWb ? t.colors.cardBgDeep : t.colors.textSecondary, padding: '4px 10px', cursor: 'pointer', letterSpacing: 1, borderRadius: t.borders.radius, ...beveledBox(t), fontWeight: 700, zIndex: 200 },
  }
}
