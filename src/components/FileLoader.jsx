// FileLoader.jsx – ROM file drop zone

import React, { useCallback, useState } from 'react'

export function FileLoader({ onLoad, error }) {
  const [dragging, setDragging] = useState(false)

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
    <div style={styles.wrapper}>
      <div style={styles.logo}>AMIGA ROM TOOLKIT</div>
      <div style={styles.sub}>Analyse · Patch · Validate · Export</div>

      <div
        style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneDrag : {}) }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('rom-file-input').click()}
      >
        <div style={styles.dropIcon}>◈</div>
        <div style={styles.dropText}>DROP ROM IMAGE HERE</div>
        <div style={styles.dropSub}>or click to browse · .rom / .bin · 256 KB or 512 KB</div>
        <input id="rom-file-input" type="file" accept=".rom,.bin" style={styles.hidden} onChange={onInputChange} />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.hint}>
        Supports Kickstart 1.x · 2.x · 3.x · 3.2 ROM images
      </div>
    </div>
  )
}

const styles = {
  wrapper:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 32 },
  logo:         { fontFamily: "'Orbitron', sans-serif", fontSize: 42, fontWeight: 900, color: '#ff6b00', letterSpacing: 8, textShadow: '0 0 40px #ff6b0060' },
  sub:          { fontFamily: "'Share Tech Mono', monospace", color: '#6a8090', fontSize: 13, letterSpacing: 4 },
  dropzone:     { border: '2px dashed #334455', borderRadius: 4, padding: '64px 96px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s', background: '#0d1218' },
  dropzoneDrag: { border: '2px dashed #ff6b00', background: '#1a1008', boxShadow: '0 0 30px #ff6b0030' },
  dropIcon:     { fontSize: 56, color: '#ff6b00', lineHeight: 1 },
  dropText:     { fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: '#c8d8e8', letterSpacing: 4 },
  dropSub:      { fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#445566' },
  hidden:       { display: 'none' },
  error:        { color: '#ff3333', fontFamily: "'Share Tech Mono', monospace", fontSize: 13, background: '#1a0808', border: '1px solid #ff3333', borderRadius: 4, padding: '8px 16px' },
  hint:         { fontFamily: "'Share Tech Mono', monospace", color: '#334455', fontSize: 11, letterSpacing: 2 },
}
