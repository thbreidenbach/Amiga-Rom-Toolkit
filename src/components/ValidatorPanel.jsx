// ValidatorPanel.jsx – Displays multi-stage validation results

import React, { useState } from 'react'

const ICONS = { ok: '✓', error: '✗', warn: '⚠' }
const COLORS = { ok: '#4aaa66', error: '#ff4444', warn: '#ffaa00' }

function Stage({ stage }) {
  const [open, setOpen] = useState(false)
  const color = COLORS[stage.severity]

  return (
    <div style={styles.stage} onClick={() => setOpen(o => !o)}>
      <div style={styles.stageHead}>
        <span style={{ ...styles.icon, color }}>{ICONS[stage.severity]}</span>
        <span style={styles.stageName}>{stage.name}</span>
        <span style={{ ...styles.stageBadge, background: color + '22', color }}>
          {stage.severity.toUpperCase()}
        </span>
        {stage.detail && <span style={styles.arrow}>{open ? '▲' : '▼'}</span>}
      </div>
      {open && stage.detail && (
        <div style={styles.detail}>{stage.detail}</div>
      )}
    </div>
  )
}

export function ValidatorPanel({ validationResult, onExport, onExportByteSwapped, assemblyResult }) {
  if (!validationResult) return null

  const { stages, passed, target } = validationResult
  const errors = stages.filter(s => s.severity === 'error').length
  const warns  = stages.filter(s => s.severity === 'warn').length

  return (
    <div style={styles.card}>
      <div style={styles.title}>
        ◈ VALIDATOR
        <span style={styles.target}> {target === 'original' ? '[ ORIGINAL ROM ]' : '[ ASSEMBLED ROM ]'}</span>
      </div>

      <div style={styles.summary}>
        <span style={{ color: passed ? '#4aaa66' : '#ff4444', fontFamily: "'Orbitron', sans-serif", fontSize: 16 }}>
          {passed ? '✓ ALL CHECKS PASSED' : `✗ ${errors} ERROR${errors !== 1 ? 'S' : ''}`}
        </span>
        {warns > 0 && (
          <span style={styles.warnCount}> · {warns} WARNING{warns !== 1 ? 'S' : ''}</span>
        )}
      </div>

      <div style={styles.stages}>
        {stages.map(s => <Stage key={s.id} stage={s} />)}
      </div>

      {assemblyResult?.warnings?.length > 0 && (
        <div style={styles.asmWarnings}>
          <div style={styles.asmWarnTitle}>ASSEMBLER WARNINGS</div>
          {assemblyResult.warnings.map((w, i) => (
            <div key={i} style={styles.asmWarn}>⚠ {w}</div>
          ))}
        </div>
      )}

      {target === 'assembled' && (
        <div style={styles.exportRow}>
          <button
            style={{ ...styles.exportBtn, ...(passed ? {} : styles.exportDisabled) }}
            onClick={passed ? onExport : undefined}
            disabled={!passed}
          >
            {passed ? '◈ EXPORT ROM' : 'EXPORT BLOCKED – FIX ERRORS FIRST'}
          </button>
          {passed && onExportByteSwapped && (
            <button
              style={styles.exportSwapBtn}
              onClick={onExportByteSwapped}
            >
              ◈ EXPORT BYTE-SWAPPED
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  card:          { background: '#0d1218', border: '1px solid #223344', borderRadius: 4, padding: 20, marginBottom: 16 },
  title:         { fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: '#ff6b00', letterSpacing: 3, marginBottom: 16 },
  target:        { color: '#334455', fontSize: 10 },
  summary:       { fontFamily: "'Share Tech Mono', monospace", marginBottom: 16, fontSize: 14 },
  warnCount:     { color: '#ffaa00', fontFamily: "'Share Tech Mono', monospace" },
  stages:        { display: 'flex', flexDirection: 'column', gap: 4 },
  stage:         { background: '#0a0f14', border: '1px solid #1a2530', borderRadius: 3, padding: '8px 12px', cursor: 'pointer' },
  stageHead:     { display: 'flex', alignItems: 'center', gap: 10 },
  icon:          { fontFamily: 'monospace', fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 },
  stageName:     { fontFamily: "'Exo 2', sans-serif", fontSize: 13, color: '#c8d8e8', flex: 1 },
  stageBadge:    { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, padding: '2px 6px', borderRadius: 2, letterSpacing: 1 },
  arrow:         { color: '#334455', fontSize: 10, marginLeft: 4 },
  detail:        { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#6a8090', marginTop: 8, paddingTop: 8, borderTop: '1px solid #1a2530', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  asmWarnings:   { marginTop: 16, background: '#0f1408', border: '1px solid #333300', borderRadius: 3, padding: 12 },
  asmWarnTitle:  { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#666600', letterSpacing: 2, marginBottom: 8 },
  asmWarn:       { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#aaaa44', marginBottom: 4 },
  exportRow:     { marginTop: 20, display: 'flex', gap: 8 },
  exportBtn:     { flex: 1, padding: '14px', fontFamily: "'Orbitron', sans-serif", fontSize: 13, letterSpacing: 3, background: '#ff6b00', color: '#000', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 700 },
  exportSwapBtn: { flex: 1, padding: '14px', fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 2, background: '#112233', color: '#ff6b00', border: '1px solid #ff6b00', borderRadius: 3, cursor: 'pointer', fontWeight: 700 },
  exportDisabled:{ background: '#1a2530', color: '#334455', cursor: 'not-allowed' },
}
