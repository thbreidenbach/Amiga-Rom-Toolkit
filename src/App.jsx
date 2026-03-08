// App.jsx – Root component and layout

import React from 'react'
import { useRomToolkit }   from './hooks/useRomToolkit.js'
import { useTheme }        from './theme/ThemeContext.jsx'
import { themeLabels }     from './theme/themes.js'
import { beveledBox }      from './theme/workbenchPatterns.js'
import { FileLoader }      from './components/FileLoader.jsx'
import { RomOverview }     from './components/RomOverview.jsx'
import { ModuleList }      from './components/ModuleList.jsx'
import { AssemblerView }   from './components/AssemblerView.jsx'
import { ValidatorPanel }  from './components/ValidatorPanel.jsx'

const STEPS = ['LOAD', 'ANALYSE', 'ASSEMBLE', 'VALIDATE']

export default function App() {
  const tk = useRomToolkit()
  const { theme, themeName, cycleTheme } = useTheme()
  const s = getStyles(theme)

  if (!tk.rom) {
    return <FileLoader onLoad={tk.loadRom} error={tk.error} />
  }

  return (
    <div style={s.app}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>AMIGA ROM TOOLKIT <span style={s.ver}>v2</span></div>
        <div style={s.nav}>
          {STEPS.map((step, i) => (
            <button
              key={step}
              style={{ ...s.navBtn, ...(tk.step === i ? s.navActive : {}) }}
              onClick={() => tk.setStep(i)}
            >
              {i+1}. {step}
            </button>
          ))}
        </div>
        <button style={s.themeBtn} onClick={cycleTheme} title="Switch theme">
          {themeLabels[themeName]}
        </button>
        <button style={s.resetBtn} onClick={() => window.location.reload()}>NEW ROM</button>
      </header>

      {/* Content */}
      <main style={s.main}>
        {tk.error && (
          <div style={s.globalError}>&#x26A0; {tk.error}</div>
        )}

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

        {tk.step >= 1 && (
          <AssemblerView
            rom={tk.rom}
            modules={tk.modules}
            assemblyResult={tk.assemblyResult}
            onAssemble={tk.assemble}
            error={tk.error}
          />
        )}

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

function getStyles(t) {
  const isWb = t.name !== 'cyber'
  return {
    app:         { minHeight: '100vh', background: t.colors.pageBg },
    header:      { display: 'flex', alignItems: 'center', gap: isWb ? 8 : 24, padding: isWb ? '6px 16px' : '12px 32px', background: t.colors.headerBg, borderBottom: `1px solid ${t.colors.borderSecondary}`, position: 'sticky', top: 0, zIndex: 100, ...beveledBox(t) },
    logo:        { fontFamily: t.fonts.display, fontSize: isWb ? 14 : 16, fontWeight: 900, color: t.colors.accent, letterSpacing: isWb ? 1 : 4, flexShrink: 0, textShadow: t.special.textShadow },
    ver:         { fontSize: 10, color: t.colors.textVeryDim, letterSpacing: 1, fontWeight: 400 },
    nav:         { display: 'flex', gap: 4, flex: 1 },
    navBtn:      { fontFamily: t.fonts.mono, fontSize: 11, background: 'none', border: `1px solid ${t.colors.borderSecondary}`, color: t.colors.textDim, padding: '5px 14px', cursor: 'pointer', letterSpacing: isWb ? 0 : 2, borderRadius: t.borders.radius },
    navActive:   { border: `1px solid ${t.colors.accent}`, color: t.colors.accent, background: isWb ? t.colors.accentBg : t.colors.accentBg },
    themeBtn:    { fontFamily: t.fonts.mono, fontSize: 10, background: isWb ? t.colors.accent : 'none', color: isWb ? t.colors.cardBgDeep : t.colors.textSecondary, padding: '4px 10px', cursor: 'pointer', letterSpacing: 1, borderRadius: t.borders.radius, ...beveledBox(t), fontWeight: 700 },
    resetBtn:    { fontFamily: t.fonts.mono, fontSize: 11, background: 'none', border: `1px solid ${t.colors.textVeryDim}`, color: t.colors.textSecondary, padding: '5px 14px', cursor: 'pointer', letterSpacing: isWb ? 0 : 2, borderRadius: t.borders.radius },
    main:        { padding: isWb ? '12px 16px' : '24px 32px', maxWidth: 1200, margin: '0 auto' },
    globalError: { fontFamily: t.fonts.mono, fontSize: 12, color: t.colors.error, background: t.colors.errorBg, border: `1px solid ${t.colors.errorBorder}`, borderRadius: t.borders.radius, padding: '10px 16px', marginBottom: 16 },
  }
}
