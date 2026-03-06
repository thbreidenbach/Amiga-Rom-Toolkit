// RomOverview.jsx – Displays ROM header metadata

import React from 'react'

function hex(n, pad = 8) { return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(pad, '0') }

export function RomOverview({ rom }) {
  if (!rom) return null

  const fields = [
    ['File',         rom.filename],
    ['Size',         `${rom.size / 1024} KB (${rom.size.toLocaleString()} bytes)`],
    ['Base Address', hex(rom.base)],
    ['Entry Point',  rom.entryPoint ? hex(rom.entryPoint) : '(no JMP found)'],
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
          <span key={i} style={{ ...(i < 6 ? styles.hexHi : styles.hexByte), marginRight: (i+1)%4===0?8:0 }}>
            {b.toString(16).toUpperCase().padStart(2,'0')}{' '}
          </span>
        ))}
      </div>
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
}
