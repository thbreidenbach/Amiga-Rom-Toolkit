// RomOverview.jsx – Displays ROM header metadata and component map

import React from 'react'
import { useTheme }   from '../theme/ThemeContext.jsx'
import { beveledBox, wbButton } from '../theme/workbenchPatterns.js'

function hex(n, pad = 8) { return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(pad, '0') }
function kb(n)  { return n >= 1024 ? `${(n/1024).toFixed(1)} KB` : `${n} B` }

function kindColors(t) {
  return {
    prolog:   t.colors.kindProlog,
    module:   t.colors.kindModule,
    gap:      t.colors.kindGap,
    trailing: t.colors.kindTrailing,
    checksum: t.colors.kindChecksum,
  }
}

export function RomOverview({ rom, components, onSaveComponent, onSaveAll }) {
  const { theme } = useTheme()
  const s = getStyles(theme)
  const kc = kindColors(theme)

  if (!rom) return null

  const fields = [
    ['File',         rom.filename + (rom.wasSwapped ? '  [BYTE-SWAPPED \u2192 auto-corrected]' : '')],
    ['Size',         `${rom.size / 1024} KB (${rom.size.toLocaleString()} bytes)`],
    ['Base Address', hex(rom.base)],
    ['Entry Point',  rom.entryPoint != null ? `${hex(rom.entryPoint)} (JMP @+${rom.jmpOffset})` : '(no JMP found)'],
    ['KS Version',   rom.version ? `${rom.version}.${rom.revision}` : '(unknown)'],
  ]

  return (
    <div style={s.card}>
      <div style={s.title}>{'\u25C8'} ROM HEADER</div>
      <table style={s.table}>
        <tbody>
          {fields.map(([k, v]) => (
            <tr key={k}>
              <td style={s.key}>{k}</td>
              <td style={s.val}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={s.hexTitle}>First 32 bytes</div>
      <div style={s.hex}>
        {Array.from(rom.raw.slice(0, 32)).map((b, i) => (
          <span key={i} style={{ ...(i < 8 ? s.hexHi : s.hexByte), marginRight: (i+1)%4===0?8:0 }}>
            {b.toString(16).toUpperCase().padStart(2,'0')}{' '}
          </span>
        ))}
      </div>

      {components && components.length > 0 && (
        <div style={s.compSection}>
          <div style={s.compTitleRow}>
            <div style={s.compTitle}>{'\u25C8'} COMPONENT MAP</div>
            <button style={s.btnSaveAll} onClick={onSaveAll}>SAVE ALL</button>
          </div>
          <table style={s.compTable}>
            <thead>
              <tr>
                {['Kind','Name','Offset','Address','Size',''].map(h => (
                  <th key={h} style={s.compTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {components.map((comp, i) => (
                <tr key={i} style={s.compRow}>
                  <td style={{ ...s.compKind, color: kc[comp.kind] || theme.colors.textSecondary }}>
                    {comp.kind.toUpperCase()}
                  </td>
                  <td style={s.compName}>{comp.name}</td>
                  <td style={s.compMono}>{hex(comp.offset)}</td>
                  <td style={s.compMono}>{hex(comp.address)}</td>
                  <td style={s.compMono}>{kb(comp.size)}</td>
                  <td style={s.compAction}>
                    {comp.kind !== 'checksum' && (
                      <button style={s.btnSave} onClick={() => onSaveComponent(comp)}>SAVE</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function getStyles(t) {
  const isWb = t.name !== 'cyber'
  return {
    card:         { background: t.colors.cardBg, ...beveledBox(t), borderRadius: t.borders.radius, padding: 20, marginBottom: 16 },
    title:        { fontFamily: t.fonts.display, fontSize: 12, color: t.colors.accent, letterSpacing: isWb ? 1 : 3, marginBottom: 12 },
    table:        { borderCollapse: 'collapse', width: '100%' },
    key:          { fontFamily: t.fonts.mono, fontSize: 12, color: t.colors.textSecondary, padding: '3px 16px 3px 0', whiteSpace: 'nowrap' },
    val:          { fontFamily: t.fonts.mono, fontSize: 12, color: t.colors.textPrimary },
    hexTitle:     { fontFamily: t.fonts.mono, fontSize: 11, color: t.colors.textDim, marginTop: 12, marginBottom: 6 },
    hex:          { fontFamily: t.fonts.mono, fontSize: 12, lineHeight: 2, color: t.colors.hexByte },
    hexHi:        { color: t.colors.hexOffset, fontFamily: t.fonts.mono },
    hexByte:      { fontFamily: t.fonts.mono },
    compSection:  { marginTop: 20, borderTop: `1px solid ${t.colors.borderSecondary}`, paddingTop: 16 },
    compTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    compTitle:    { fontFamily: t.fonts.display, fontSize: 12, color: t.colors.accent, letterSpacing: isWb ? 1 : 3 },
    compTable:    { borderCollapse: 'collapse', width: '100%' },
    compTh:       { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.textDim, padding: '4px 10px', textAlign: 'left', borderBottom: `1px solid ${t.colors.borderSecondary}`, letterSpacing: 1 },
    compRow:      { borderBottom: `1px solid ${t.colors.borderRow}` },
    compKind:     { fontFamily: t.fonts.mono, fontSize: 10, padding: '4px 10px', letterSpacing: 1, fontWeight: 700 },
    compName:     { fontFamily: t.fonts.body, fontSize: 12, color: t.colors.textPrimary, padding: '4px 10px' },
    compMono:     { fontFamily: t.fonts.mono, fontSize: 11, color: t.colors.textSecondary, padding: '4px 10px' },
    compAction:   { padding: '4px 10px' },
    btnSave:      wbButton(t, t.colors.btnSaveBg, t.colors.btnSaveBorder, t.colors.btnSaveText),
    btnSaveAll:   wbButton(t, t.colors.btnSaveBg, t.colors.btnSaveBorder, t.colors.btnSaveText),
  }
}
