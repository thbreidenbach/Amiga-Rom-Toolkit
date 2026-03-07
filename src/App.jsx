// App.jsx – Root component and layout

import React from 'react'
import { useRomToolkit }   from './hooks/useRomToolkit.js'
import { FileLoader }      from './components/FileLoader.jsx'
import { RomOverview }     from './components/RomOverview.jsx'
import { ModuleList }      from './components/ModuleList.jsx'
import { AssemblerView }   from './components/AssemblerView.jsx'
import { ValidatorPanel }  from './components/ValidatorPanel.jsx'

const STEPS = ['LOAD', 'ANALYSE', 'ASSEMBLE', 'VALIDATE']

export default function App() {
  const tk = useRomToolkit()

  if (!tk.rom) {
    return <FileLoader onLoad={tk.loadRom} error={tk.error} />
  }

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>AMIGA ROM TOOLKIT <span style={styles.ver}>v2</span></div>
        <div style={styles.nav}>
          {STEPS.map((s, i) => (
            <button
              key={s}
              style={{ ...styles.navBtn, ...(tk.step === i ? styles.navActive : {}) }}
              onClick={() => tk.setStep(i)}
            >
              {i+1}. {s}
            </button>
          ))}
        </div>
        <button style={styles.resetBtn} onClick={() => window.location.reload()}>NEW ROM</button>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {tk.error && (
          <div style={styles.globalError}>&#x26A0; {tk.error}</div>
        )}

        {/* Step 1: Analyse */}
        {tk.step >= 1 && (
          <>
            <RomOverview
              rom={tk.rom}
              components={tk.components}
              onSaveComponent={tk.saveComponent}
              onSaveAll={tk.saveAllComponents}
            />
            <ValidatorPanel
              validationResult={tk.validationResult?.target === 'original' ? tk.validationResult : null}
              assemblyResult={null}
            />
          </>
        )}

        {/* Step 2: Module Editor */}
        {tk.step >= 1 && (
          <ModuleList
            modules={tk.modules}
            onAction={tk.setModuleAction}
            onReplace={tk.setModuleReplacement}
            onClear={tk.clearModuleReplacement}
            onPadToggle={tk.setPadTo}
            onInsert={tk.insertModule}
            onRemoveInserted={tk.removeInserted}
            onSaveModule={tk.saveModule}
            onSaveAll={tk.saveAllModules}
          />
        )}

        {/* Step 3: Assembler */}
        {tk.step >= 1 && (
          <AssemblerView
            rom={tk.rom}
            modules={tk.modules}
            assemblyResult={tk.assemblyResult}
            onAssemble={tk.assemble}
            error={tk.error}
          />
        )}

        {/* Step 4: Assembled ROM Validator + Export */}
        {tk.assemblyResult && (
          <ValidatorPanel
            validationResult={tk.validationResult?.target === 'assembled' ? tk.validationResult : null}
            assemblyResult={tk.assemblyResult}
            onExport={tk.exportRom}
            onExportByteSwapped={tk.exportByteSwapped}
          />
        )}
      </main>
    </div>
  )
}

const styles = {
  app:         { minHeight: '100vh', background: '#0a0a0f' },
  header:      { display: 'flex', alignItems: 'center', gap: 24, padding: '12px 32px', background: '#0d1218', borderBottom: '1px solid #1a2530', position: 'sticky', top: 0, zIndex: 100 },
  logo:        { fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 900, color: '#ff6b00', letterSpacing: 4, flexShrink: 0 },
  ver:         { fontSize: 10, color: '#334455', letterSpacing: 1, fontWeight: 400 },
  nav:         { display: 'flex', gap: 4, flex: 1 },
  navBtn:      { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, background: 'none', border: '1px solid #1a2530', color: '#445566', padding: '5px 14px', cursor: 'pointer', letterSpacing: 2 },
  navActive:   { border: '1px solid #ff6b00', color: '#ff6b00', background: '#1a0d00' },
  resetBtn:    { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, background: 'none', border: '1px solid #334455', color: '#6a8090', padding: '5px 14px', cursor: 'pointer', letterSpacing: 2 },
  main:        { padding: '24px 32px', maxWidth: 1200, margin: '0 auto' },
  globalError: { fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#ff4444', background: '#1a0808', border: '1px solid #ff333344', borderRadius: 3, padding: '10px 16px', marginBottom: 16 },
}
