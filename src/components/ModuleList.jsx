// ModuleList.jsx – Table of all RomTag modules with edit actions

import React, { useRef } from 'react'

function hex(n) { return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0') }
function kb(n)  { return n >= 1024 ? `${(n/1024).toFixed(1)} KB` : `${n} B` }

export function ModuleList({ modules, onAction, onReplace, onClear, onPadToggle }) {
  const fileInputRefs = useRef({})

  const handleReplace = (index, file) => {
    const reader = new FileReader()
    reader.onload = e => {
      const padToOriginal = document.getElementById(`pad-${index}`)?.checked ?? true
      onReplace(index, e.target.result, file.name, padToOriginal)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div style={styles.card}>
      <div style={styles.title}>◈ MODULE LIST  <span style={styles.count}>{modules.length} RomTags</span></div>
      <div style={styles.scroll}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Module Name','Version','Size','Address','Priority','Type','Action'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, i) => (
              <tr key={i} style={{ ...styles.row, ...(mod.action === 'remove' ? styles.rowRemoved : mod.action === 'replace' ? styles.rowReplaced : {}) }}>
                <td style={styles.tdName}>
                  {mod.name}
                  {mod.replacementFilename && (
                    <div style={styles.replLabel}>← {mod.replacementFilename}</div>
                  )}
                </td>
                <td style={styles.td}>{mod.version}</td>
                <td style={styles.td}>{kb(mod.size)}</td>
                <td style={styles.tdMono}>{hex(mod.address)}</td>
                <td style={styles.td}>{mod.priority}</td>
                <td style={styles.tdMono}>{mod.nodeTypeDesc}</td>
                <td style={styles.tdAction}>
                  {mod.action === 'keep' && (
                    <>
                      <button style={styles.btnReplace}
                        onClick={() => fileInputRefs.current[i]?.click()}>
                        REPLACE
                      </button>
                      <button style={styles.btnRemove}
                        onClick={() => onAction(i, 'remove')}>
                        REMOVE
                      </button>
                    </>
                  )}
                  {mod.action === 'replace' && (
                    <>
                      <label style={styles.padLabel}>
                        <input type="checkbox" id={`pad-${i}`} defaultChecked
                          onChange={e => onPadToggle(i, e.target.checked ? mod.size : null)} />
                        &nbsp;pad to {kb(mod.size)}
                      </label>
                      <button style={styles.btnClear} onClick={() => onClear(i)}>UNDO</button>
                    </>
                  )}
                  {mod.action === 'remove' && (
                    <button style={styles.btnClear} onClick={() => onAction(i, 'keep')}>RESTORE</button>
                  )}
                  <input
                    type="file" accept=".bin,.device,.library"
                    style={{ display: 'none' }}
                    ref={el => fileInputRefs.current[i] = el}
                    onChange={e => { if (e.target.files[0]) handleReplace(i, e.target.files[0]) }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  card:        { background: '#0d1218', border: '1px solid #223344', borderRadius: 4, padding: 20, marginBottom: 16 },
  title:       { fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: '#ff6b00', letterSpacing: 3, marginBottom: 12 },
  count:       { color: '#445566', fontSize: 11 },
  scroll:      { overflowX: 'auto' },
  table:       { borderCollapse: 'collapse', width: '100%', minWidth: 800 },
  th:          { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#445566', padding: '4px 12px', textAlign: 'left', borderBottom: '1px solid #1a2530', letterSpacing: 2 },
  row:         { borderBottom: '1px solid #111a22' },
  rowRemoved:  { opacity: 0.4 },
  rowReplaced: { background: '#0d1a08' },
  td:          { fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#8aaabb', padding: '6px 12px' },
  tdMono:      { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#6a8090', padding: '6px 12px' },
  tdName:      { fontFamily: "'Exo 2', sans-serif", fontSize: 13, color: '#c8d8e8', padding: '6px 12px', fontWeight: 600 },
  tdAction:    { padding: '6px 12px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  replLabel:   { fontSize: 10, color: '#4a9', fontFamily: "'Share Tech Mono', monospace", marginTop: 2 },
  btnReplace:  { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, background: '#0d1f2d', border: '1px solid #335577', color: '#88bbcc', padding: '3px 8px', cursor: 'pointer', letterSpacing: 1 },
  btnRemove:   { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, background: '#1a0d0d', border: '1px solid #553333', color: '#cc8888', padding: '3px 8px', cursor: 'pointer', letterSpacing: 1 },
  btnClear:    { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, background: '#1a1a0d', border: '1px solid #555533', color: '#cccc88', padding: '3px 8px', cursor: 'pointer', letterSpacing: 1 },
  padLabel:    { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#4a9', cursor: 'pointer' },
}
