// ValidatorPanel.jsx – Displays multi-stage validation results

import React, { useState } from 'react'
import { useTheme }   from '../theme/ThemeContext.jsx'
import { beveledBox } from '../theme/workbenchPatterns.js'

const ICONS = { ok: '✓', error: '✗', warn: '⚠' }

function Stage({ stage, theme }) {
  const [open, setOpen] = useState(false)
  const s = getStyles(theme)

  const severityColor = {
    ok:    theme.colors.success,
    error: theme.colors.error,
    warn:  theme.colors.warning,
  }[stage.severity]

  return (
    <div style={s.stage} onClick={() => setOpen(o => !o)}>
      <div style={s.stageHead}>
        <span style={{ ...s.icon, color: severityColor }}>{ICONS[stage.severity]}</span>
        <span style={s.stageName}>{stage.name}</span>
        <span style={{ ...s.stageBadge, background: severityColor + '22', color: severityColor }}>
          {stage.severity.toUpperCase()}
        </span>
        {stage.detail && <span style={s.arrow}>{open ? '▲' : '▼'}</span>}
      </div>
      {open && stage.detail && (
        <div style={s.detail}>{stage.detail}</div>
      )}
    </div>
  )
}

export function ValidatorPanel({ validationResult, onExport, onExportByteSwapped, assemblyResult }) {
  const { theme } = useTheme()
  const s = getStyles(theme)

  if (!validationResult) return null

  const { stages, passed, target } = validationResult
  const errors = stages.filter(st => st.severity === 'error').length
  const warns  = stages.filter(st => st.severity === 'warn').length
  const isWb   = theme.name !== 'cyber'

  return (
    <div style={s.card}>
      <div style={s.title}>
        {isWb ? '' : '◈ '}VALIDATOR
        <span style={s.target}> {target === 'original' ? '[ ORIGINAL ROM ]' : '[ ASSEMBLED ROM ]'}</span>
      </div>

      <div style={s.summary}>
        <span style={{ color: passed ? theme.colors.success : theme.colors.error, fontFamily: theme.fonts.display, fontSize: 16 }}>
          {passed ? '✓ ALL CHECKS PASSED' : `✗ ${errors} ERROR${errors !== 1 ? 'S' : ''}`}
        </span>
        {warns > 0 && (
          <span style={s.warnCount}> · {warns} WARNING{warns !== 1 ? 'S' : ''}</span>
        )}
      </div>

      <div style={s.stages}>
        {stages.map(st => <Stage key={st.id} stage={st} theme={theme} />)}
      </div>

      {assemblyResult?.warnings?.length > 0 && (
        <div style={s.asmWarnings}>
          <div style={s.asmWarnTitle}>ASSEMBLER WARNINGS</div>
          {assemblyResult.warnings.map((w, i) => (
            <div key={i} style={s.asmWarn}>⚠ {w}</div>
          ))}
        </div>
      )}

      {target === 'assembled' && (
        <div style={s.exportRow}>
          <button
            style={{ ...s.exportBtn, ...(passed ? {} : s.exportDisabled) }}
            onClick={passed ? onExport : undefined}
            disabled={!passed}
          >
            {passed ? (isWb ? 'EXPORT ROM' : '◈ EXPORT ROM') : 'EXPORT BLOCKED – FIX ERRORS FIRST'}
          </button>
          {passed && onExportByteSwapped && (
            <button
              style={s.exportSwapBtn}
              onClick={onExportByteSwapped}
            >
              {isWb ? 'EXPORT BYTE-SWAPPED' : '◈ EXPORT BYTE-SWAPPED'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function getStyles(t) {
  const isWb = t.name !== 'cyber'
  return {
    card:          { background: t.colors.cardBg, ...beveledBox(t), borderRadius: t.borders.radius, padding: 20, marginBottom: 16 },
    title:         { fontFamily: t.fonts.display, fontSize: 12, color: t.colors.accent, letterSpacing: isWb ? 1 : 3, marginBottom: 16 },
    target:        { color: t.colors.textVeryDim, fontSize: 10 },
    summary:       { fontFamily: t.fonts.mono, marginBottom: 16, fontSize: 14 },
    warnCount:     { color: t.colors.warning, fontFamily: t.fonts.mono },
    stages:        { display: 'flex', flexDirection: 'column', gap: 4 },
    stage:         { background: t.colors.cardBgDeep, ...beveledBox(t, false), borderRadius: t.borders.radius, padding: '8px 12px', cursor: 'pointer' },
    stageHead:     { display: 'flex', alignItems: 'center', gap: 10 },
    icon:          { fontFamily: 'monospace', fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 },
    stageName:     { fontFamily: t.fonts.body, fontSize: 13, color: t.colors.textPrimary, flex: 1 },
    stageBadge:    { fontFamily: t.fonts.mono, fontSize: 9, padding: '2px 6px', borderRadius: t.borders.radius, letterSpacing: 1 },
    arrow:         { color: t.colors.textVeryDim, fontSize: 10, marginLeft: 4 },
    detail:        { fontFamily: t.fonts.mono, fontSize: 11, color: t.colors.textSecondary, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t.colors.borderSecondary}`, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
    asmWarnings:   { marginTop: 16, background: t.colors.warningBg, border: `1px solid ${t.colors.warningBorder}`, borderRadius: t.borders.radius, padding: 12 },
    asmWarnTitle:  { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.warningLabel, letterSpacing: 2, marginBottom: 8 },
    asmWarn:       { fontFamily: t.fonts.mono, fontSize: 11, color: t.colors.warningText, marginBottom: 4 },
    exportRow:     { marginTop: 20, display: 'flex', gap: 8 },
    exportBtn:     { flex: 1, padding: '14px', fontFamily: t.fonts.display, fontSize: 13, letterSpacing: isWb ? 1 : 3, background: t.colors.btnExportBg, color: t.colors.btnExportText, borderRadius: t.borders.radius, cursor: 'pointer', fontWeight: 700, ...beveledBox(t) },
    exportSwapBtn: { flex: 1, padding: '14px', fontFamily: t.fonts.display, fontSize: 11, letterSpacing: isWb ? 1 : 2, background: t.colors.btnPrimaryBg, color: t.colors.btnPrimaryText, borderRadius: t.borders.radius, cursor: 'pointer', fontWeight: 700, ...beveledBox(t) },
    exportDisabled:{ background: isWb ? t.colors.cardBgDeep : '#1a2530', color: t.colors.textVeryDim, cursor: 'not-allowed' },
  }
}
