// RomOverview.jsx – Displays ROM header metadata and component map

import React from 'react'

function hex(n, pad = 8) { return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(pad, '0') }
function kb(n)  { return n >= 1024 ? `${(n/1024).toFixed(1)} KB` : `${n} B` }

const KIND_COLORS = {
  prolog:   '#ff6b00',
  module:   '#88bbcc',
  gap:      '#666666',
  trailing: '#555555',
  checksum: '#ffaa00',
}

export function RomOverview({ rom, components, onSaveComponent, onSaveAll }) {
  if (!rom) return null

  const fields = [
    ['File',         rom.filename + (rom.wasSwapped ? '  [BYTE-SWAPPED → auto-corrected]' : '')],
    ['Size',         `${rom.size / 1024} KB (${rom.size.toLocaleString()} bytes)`],
    ['Base Address', hex(rom.base)],
    ['Entry Point',  rom.entryPoint != null ? `${hex(rom.entryPoint)} (JMP @+${rom.jmpOffset})` : '(no JMP found)'],
    ['KS Version',   rom.version ? `${rom.version}.${rom.revision}` : '(unknown)'],
  ]

  return (
    <div style={styles.card}>
      <div style={styles.title}>◈ ROM HEADER</div>
      <table style={styles.table}>
        <tbody>
          {fields.map(([k, v]) => (
            <tr key={k}>
              <td style={styles.key}>{k}</td>
              <td style={styles.val}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Hex dump of first 32 bytes */}
      <div style={styles.hexTitle}>First 32 bytes</div>
      <div style={styles.hex}>
        {Array.from(rom.raw.slice(0, 32)).map((b, i) => (
          <span key={i} style={{ ...(i < 8 ? styles.hexHi : styles.hexByte), marginRight: (i+1)%4===0?8:0 }}>
            {b.toString(16).toUpperCase().padStart(2,'0')}{' '}
          </span>
        ))}
      </div>

      {/* Component Map */}
      {components && components.length > 0 && (
        <div style={styles.compSection}>
          <div style={styles.compTitleRow}>
            <div style={styles.compTitle}>◈ COMPONENT MAP</div>
            <button style={styles.btnSaveAll} onClick={onSaveAll}>SAVE ALL</button>
          </div>
          <table style={styles.compTable}>
            <thead>
              <tr>
                {['Kind','Name','Offset','Address','Size',''].map(h => (
                  <th key={h} style={styles.compTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {components.map((comp, i) => (
                <tr key={i} style={styles.compRow}>
                  <td style={{ ...styles.compKind, color: KIND_COLORS[comp.kind] || '#888' }}>
                    {comp.kind.toUpperCase()}
                  </td>
                  <td style={styles.compName}>{comp.name}</td>
                  <td style={styles.compMono}>{hex(comp.offset)}</td>
                  <td style={styles.compMono}>{hex(comp.address)}</td>
                  <td style={styles.compMono}>{kb(comp.size)}</td>
                  <td style={styles.compAction}>
                    {comp.kind !== 'checksum' && (
                      <button style={styles.btnSave} onClick={() => onSaveComponent(comp)}>SAVE</button>
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

const styles = {
  card:     { background: '#0d1218', border: '1px solid #223344', borderRadius: 4, padding: 20, marginBottom: 16 },
  title:    { fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: '#ff6b00', letterSpacing: 3, marginBottom: 12 },
  table:    { borderCollapse: 'collapse', width: '100%' },
  key:      { fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#6a8090', padding: '3px 16px 3px 0', whiteSpace: 'nowrap' },
  val:      { fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#c8d8e8' },
  hexTitle: { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#445566', marginTop: 12, marginBottom: 6 },
  hex:      { fontFamily: "'Share Tech Mono', monospace", fontSize: 12, lineHeight: 2, color: '#8aaabb' },
  hexHi:    { color: '#ff6b00', fontFamily: "'Share Tech Mono', monospace" },
  hexByte:  { fontFamily: "'Share Tech Mono', monospace" },
  compSection:  { marginTop: 20, borderTop: '1px solid #1a2530', paddingTop: 16 },
  compTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  compTitle:    { fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: '#ff6b00', letterSpacing: 3 },
  compTable:    { borderCollapse: 'collapse', width: '100%' },
  compTh:       { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#445566', padding: '4px 10px', textAlign: 'left', borderBottom: '1px solid #1a2530', letterSpacing: 1 },
  compRow:      { borderBottom: '1px solid #111a22' },
  compKind:     { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, padding: '4px 10px', letterSpacing: 1, fontWeight: 700 },
  compName:     { fontFamily: "'Exo 2', sans-serif", fontSize: 12, color: '#c8d8e8', padding: '4px 10px' },
  compMono:     { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#6a8090', padding: '4px 10px' },
  compAction:   { padding: '4px 10px' },
  btnSave:      { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, background: '#0d1a1a', border: '1px solid #336666', color: '#88cccc', padding: '3px 8px', cursor: 'pointer', letterSpacing: 1 },
  btnSaveAll:   { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, background: '#0d1a1a', border: '1px solid #336666', color: '#88cccc', padding: '3px 8px', cursor: 'pointer', letterSpacing: 1 },
}
