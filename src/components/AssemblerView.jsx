// AssemblerView.jsx – Shows assembly layout preview and triggers build

import React from 'react'
import { useTheme }   from '../theme/ThemeContext.jsx'
import { beveledBox } from '../theme/workbenchPatterns.js'

function hex(n) { return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0') }
function kb(n)  { return n >= 1024 ? `${(n/1024).toFixed(1)} KB` : `${n} B` }

const SIZE_256K = 262144
const SIZE_512K = 524288

export function AssemblerView({ rom, modules, assemblyResult, onAssemble, error }) {
  const { theme } = useTheme()
  const s = getStyles(theme)

  if (!rom) return null

  const kept     = modules.filter(m => m.action !== 'remove')
  const removed  = modules.filter(m => m.action === 'remove')
  const replaced = modules.filter(m => m.action === 'replace')
  const inserted = modules.filter(m => m.inserted)

  const estimatedSize = rom.prolog.length +
    kept.reduce((acc, m) => acc + (m.padTo ?? (m.replacement ? m.replacement.length : m.size)), 0)

  const pct         = (estimatedSize / rom.size * 100).toFixed(1)
  const over512     = estimatedSize > SIZE_512K
  const over256     = estimatedSize > SIZE_256K && !over512
  const oversizeRom = estimatedSize > rom.size

  return (
    <div style={s.card}>
      <div style={s.title}>{'\u25C8'} ASSEMBLER</div>

      <div style={s.stats}>
        <div style={s.stat}><span style={s.sk}>Kept</span><span style={s.sv}>{kept.length - inserted.length}</span></div>
        <div style={s.stat}><span style={s.sk}>Replaced</span><span style={{ ...s.sv, color: theme.colors.success }}>{replaced.length}</span></div>
        <div style={s.stat}><span style={s.sk}>Inserted</span><span style={{ ...s.sv, color: theme.colors.info }}>{inserted.length}</span></div>
        <div style={s.stat}><span style={s.sk}>Removed</span><span style={{ ...s.sv, color: theme.colors.error }}>{removed.length}</span></div>
        <div style={s.stat}><span style={s.sk}>Est. size</span>
          <span style={{ ...s.sv, color: over512 || oversizeRom ? theme.colors.error : over256 ? theme.colors.warning : theme.colors.success }}>
            {kb(estimatedSize)} / {kb(rom.size)} ({pct}%)
          </span>
        </div>
      </div>

      {over512 && (
        <div style={s.overflow}>
          {'\u2718'} HARD LIMIT: Payload is {kb(estimatedSize)} – exceeds the absolute 512 KB maximum. Remove or shrink modules.
        </div>
      )}

      {oversizeRom && !over512 && (
        <div style={s.overflow}>
          {'\u26A0'} Estimated size exceeds target ROM capacity ({kb(rom.size)}). Remove modules or increase ROM size.
        </div>
      )}

      {over256 && !oversizeRom && (
        <div style={s.warn256}>
          {'\u26A0'} Payload exceeds 256 KB – this ROM will NOT fit in a 256 KB flash chip. A 512 KB flash is required.
        </div>
      )}

      {assemblyResult && (
        <div style={s.layout}>
          <div style={s.layoutTitle}>LAST ASSEMBLY LAYOUT</div>
          <table style={s.table}>
            <thead>
              <tr>{['Module','New Offset','New Address','Delta','Size'].map(h =>
                <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {assemblyResult.layout.map((entry, i) => (
                <tr key={i} style={{ ...s.row, ...(entry.inserted ? s.rowInserted : {}) }}>
                  <td style={s.tdName}>
                    {entry.name}
                    {entry.inserted && <span style={s.insertBadge}> [INSERTED]</span>}
                  </td>
                  <td style={s.tdMono}>{hex(entry.newOffset)}</td>
                  <td style={s.tdMono}>{hex(entry.newAddress)}</td>
                  <td style={{ ...s.tdMono, color: entry.delta !== 0 ? theme.colors.warning : theme.colors.success }}>
                    {entry.inserted ? '(new)' : entry.delta === 0 ? '\u00B10' : (entry.delta > 0 ? '+' : '') + hex(entry.delta)}
                  </td>
                  <td style={s.tdMono}>{kb(entry.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}

      <button
        style={{ ...s.buildBtn, ...((oversizeRom || over512) ? s.buildDisabled : {}) }}
        onClick={(oversizeRom || over512) ? undefined : onAssemble}
        disabled={oversizeRom || over512}
      >
        {'\u25C8'} ASSEMBLE ROM
      </button>
    </div>
  )
}

function getStyles(t) {
  const isWb = t.name !== 'cyber'
  return {
    card:         { background: t.colors.cardBg, ...beveledBox(t), borderRadius: t.borders.radius, padding: 20, marginBottom: 16 },
    title:        { fontFamily: t.fonts.display, fontSize: 12, color: t.colors.accent, letterSpacing: isWb ? 1 : 3, marginBottom: 16 },
    stats:        { display: 'flex', gap: isWb ? 12 : 24, marginBottom: 16, flexWrap: 'wrap' },
    stat:         { display: 'flex', flexDirection: 'column', gap: 2 },
    sk:           { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.textDim, letterSpacing: 1 },
    sv:           { fontFamily: t.fonts.mono, fontSize: 16, color: t.colors.textPrimary },
    overflow:     { color: t.colors.error, fontFamily: t.fonts.mono, fontSize: 12, marginBottom: 12, background: t.colors.errorBg, border: `1px solid ${t.colors.errorBorder}`, borderRadius: t.borders.radius, padding: 8 },
    warn256:      { color: t.colors.warning, fontFamily: t.fonts.mono, fontSize: 12, marginBottom: 12, background: t.colors.warningBg, border: `1px solid ${t.colors.warningBorder}`, borderRadius: t.borders.radius, padding: 8 },
    layout:       { marginBottom: 16, overflowX: 'auto' },
    layoutTitle:  { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.textDim, letterSpacing: 2, marginBottom: 8 },
    table:        { borderCollapse: 'collapse', width: '100%' },
    th:           { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.textDim, padding: '4px 10px', textAlign: 'left', borderBottom: `1px solid ${t.colors.borderSecondary}`, letterSpacing: 1 },
    row:          { borderBottom: `1px solid ${t.colors.borderRow}` },
    rowInserted:  { background: t.colors.rowInsertedBg },
    insertBadge:  { color: t.colors.insertLabel, fontSize: 10, fontFamily: t.fonts.mono },
    tdName:       { fontFamily: t.fonts.body, fontSize: 12, color: t.colors.textPrimary, padding: '5px 10px' },
    tdMono:       { fontFamily: t.fonts.mono, fontSize: 11, color: t.colors.textSecondary, padding: '5px 10px' },
    error:        { color: t.colors.error, fontFamily: t.fonts.mono, fontSize: 12, marginBottom: 12 },
    buildBtn:     { width: '100%', padding: 14, fontFamily: t.fonts.display, fontSize: 13, letterSpacing: isWb ? 1 : 3, background: t.colors.btnPrimaryBg, color: t.colors.btnPrimaryText, borderRadius: t.borders.radius, cursor: 'pointer', fontWeight: 700, ...beveledBox(t) },
    buildDisabled:{ opacity: 0.4, cursor: 'not-allowed' },
  }
}
