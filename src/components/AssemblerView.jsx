// AssemblerView.jsx – Shows assembly layout preview and triggers build

import React from 'react'

function hex(n) { return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0') }
function kb(n)  { return n >= 1024 ? `${(n/1024).toFixed(1)} KB` : `${n} B` }

export function AssemblerView({ rom, modules, assemblyResult, onAssemble, error }) {
  if (!rom) return null

  const kept     = modules.filter(m => m.action !== 'remove')
  const removed  = modules.filter(m => m.action === 'remove')
  const replaced = modules.filter(m => m.action === 'replace')

  const estimatedSize = rom.prolog.length +
    kept.reduce((acc, m) => acc + (m.padTo ?? (m.replacement ? m.replacement.length : m.size)), 0)

  const pct    = (estimatedSize / rom.size * 100).toFixed(1)
  const oversize = estimatedSize > rom.size

  return (
    <div style={styles.card}>
      <div style={styles.title}>◈ ASSEMBLER</div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.sk}>Kept</span><span style={styles.sv}>{kept.length}</span></div>
        <div style={styles.stat}><span style={styles.sk}>Replaced</span><span style={{ ...styles.sv, color: '#4aaa66' }}>{replaced.length}</span></div>
        <div style={styles.stat}><span style={styles.sk}>Removed</span><span style={{ ...styles.sv, color: '#ff4444' }}>{removed.length}</span></div>
        <div style={styles.stat}><span style={styles.sk}>Est. size</span>
          <span style={{ ...styles.sv, color: oversize ? '#ff4444' : '#4aaa66' }}>
            {kb(estimatedSize)} / {kb(rom.size)} ({pct}%)
          </span>
        </div>
      </div>

      {oversize && (
        <div style={styles.overflow}>⚠ Estimated size exceeds ROM capacity. Use padding or remove modules.</div>
      )}

      {assemblyResult && (
        <div style={styles.layout}>
          <div style={styles.layoutTitle}>LAST ASSEMBLY LAYOUT</div>
          <table style={styles.table}>
            <thead>
              <tr>{['Module','New Offset','New Address','Delta','Size'].map(h =>
                <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {assemblyResult.layout.map((entry, i) => (
                <tr key={i} style={styles.row}>
                  <td style={styles.tdName}>{entry.name}</td>
                  <td style={styles.tdMono}>{hex(entry.newOffset)}</td>
                  <td style={styles.tdMono}>{hex(entry.newAddress)}</td>
                  <td style={{ ...styles.tdMono, color: entry.delta !== 0 ? '#ffaa00' : '#4aaa66' }}>
                    {entry.delta === 0 ? '±0' : (entry.delta > 0 ? '+' : '') + hex(entry.delta)}
                  </td>
                  <td style={styles.tdMono}>{kb(entry.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      <button
        style={{ ...styles.buildBtn, ...(oversize ? styles.buildDisabled : {}) }}
        onClick={oversize ? undefined : onAssemble}
        disabled={oversize}
      >
        ◈ ASSEMBLE ROM
      </button>
    </div>
  )
}

const styles = {
  card:         { background: '#0d1218', border: '1px solid #223344', borderRadius: 4, padding: 20, marginBottom: 16 },
  title:        { fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: '#ff6b00', letterSpacing: 3, marginBottom: 16 },
  stats:        { display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' },
  stat:         { display: 'flex', flexDirection: 'column', gap: 2 },
  sk:           { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#445566', letterSpacing: 1 },
  sv:           { fontFamily: "'Share Tech Mono', monospace", fontSize: 16, color: '#c8d8e8' },
  overflow:     { color: '#ff4444', fontFamily: "'Share Tech Mono', monospace", fontSize: 12, marginBottom: 12, background: '#1a0808', border: '1px solid #ff333344', borderRadius: 3, padding: 8 },
  layout:       { marginBottom: 16, overflowX: 'auto' },
  layoutTitle:  { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#445566', letterSpacing: 2, marginBottom: 8 },
  table:        { borderCollapse: 'collapse', width: '100%' },
  th:           { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#445566', padding: '4px 10px', textAlign: 'left', borderBottom: '1px solid #1a2530', letterSpacing: 1 },
  row:          { borderBottom: '1px solid #111a22' },
  tdName:       { fontFamily: "'Exo 2', sans-serif", fontSize: 12, color: '#c8d8e8', padding: '5px 10px' },
  tdMono:       { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#6a8090', padding: '5px 10px' },
  error:        { color: '#ff4444', fontFamily: "'Share Tech Mono', monospace", fontSize: 12, marginBottom: 12 },
  buildBtn:     { width: '100%', padding: 14, fontFamily: "'Orbitron', sans-serif", fontSize: 13, letterSpacing: 3, background: '#112233', color: '#ff6b00', border: '1px solid #ff6b00', borderRadius: 3, cursor: 'pointer', fontWeight: 700 },
  buildDisabled:{ opacity: 0.4, cursor: 'not-allowed' },
}
