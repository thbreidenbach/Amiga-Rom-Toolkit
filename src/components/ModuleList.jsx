// ModuleList.jsx – Table of all RomTag modules with edit actions

import React, { useRef } from 'react'
import { useTheme }   from '../theme/ThemeContext.jsx'
import { beveledBox, wbButton } from '../theme/workbenchPatterns.js'
import { describeModulePlacement } from '../engine/ResidentAnalyzer.js'

function hex(n) { return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0') }
function kb(n)  { return n >= 1024 ? `${(n/1024).toFixed(1)} KB` : `${n} B` }

export function ModuleList({ modules, onAction, onReplace, onClear, onPadToggle,
                              onInsert, onRemoveInserted, onSaveModule, onSaveAll }) {
  const { theme } = useTheme()
  const s = getStyles(theme)
  const fileInputRefs  = useRef({})
  const insertInputRef = useRef({})

  const handleReplace = (index, file) => {
    const reader = new FileReader()
    reader.onload = e => {
      const padToOriginal = document.getElementById(`pad-${index}`)?.checked ?? true
      onReplace(index, e.target.result, file.name, padToOriginal)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleInsert = (afterIndex, file) => {
    const reader = new FileReader()
    reader.onload = e => onInsert(afterIndex, e.target.result, file.name)
    reader.readAsArrayBuffer(file)
  }

  return (
    <div style={s.card}>
      <div style={s.titleRow}>
        <div style={s.title}>{'\u25C8'} MODULE LIST  <span style={s.count}>{modules.length} entries</span></div>
        <div style={s.titleActions}>
          <button style={s.btnSaveAll} onClick={onSaveAll}>SAVE ALL</button>
        </div>
      </div>
      <div style={s.scroll}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Module Name','Version','Size','Address','Priority','Type','Exec','Move','Action'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, i) => {
              const placement = describeModulePlacement(mod)
              return (
              <tr key={i} title={`${placement.execReason}\n${placement.moveReason}`} style={{
                ...s.row,
                ...(mod.action === 'remove' ? s.rowRemoved :
                    mod.action === 'replace' ? s.rowReplaced :
                    mod.inserted ? s.rowInserted : {})
              }}>
                <td style={s.tdName}>
                  {mod.name}
                  {mod.replacementFilename && (
                    <div style={s.replLabel}>{'\u2190'} {mod.replacementFilename}</div>
                  )}
                  {mod.inserted && (
                    <div style={s.insertLabel}>+ INSERTED</div>
                  )}
                  <div style={s.moveDetail}>{placement.execReason}</div>
                  <div style={s.moveDetail}>{placement.moveReason}</div>
                </td>
                <td style={s.td}>{mod.inserted ? '\u2013' : mod.version}</td>
                <td style={s.td}>{kb(mod.size)}</td>
                <td style={s.tdMono}>{mod.inserted ? '(new)' : hex(mod.address)}</td>
                <td style={s.td}>{mod.inserted ? '\u2013' : mod.priority}</td>
                <td style={s.tdMono}>{mod.nodeTypeDesc}</td>
                <td style={s.tdStatus}>
                  <span style={{
                    ...s.statusBadge,
                    ...(placement.execLabel === 'YES' ? s.statusOk : s.statusBad),
                  }}>
                    {placement.execLabel}
                  </span>
                </td>
                <td style={s.tdStatus}>
                  <span style={{
                    ...s.statusBadge,
                    ...(placement.moveVerdict === 'pinned' ? s.statusPinned :
                        placement.moveLabel === 'LIMITED' ? s.statusWarn : s.statusBad),
                  }}>
                    {placement.moveLabel}
                  </span>
                </td>
                <td style={s.tdAction}>
                  {mod.inserted ? (
                    <button style={s.btnRemove} onClick={() => onRemoveInserted(i)}>REMOVE</button>
                  ) : (
                    <>
                      {mod.action === 'keep' && (
                        <>
                          <button style={s.btnSave} onClick={() => onSaveModule(i)}>SAVE</button>
                          <button style={s.btnReplace}
                            onClick={() => fileInputRefs.current[i]?.click()}>
                            REPLACE
                          </button>
                          <button style={s.btnInsert}
                            onClick={() => insertInputRef.current[i]?.click()}>
                            INSERT AFTER
                          </button>
                          <button style={s.btnRemove}
                            onClick={() => onAction(i, 'remove')}>
                            REMOVE
                          </button>
                        </>
                      )}
                      {mod.action === 'replace' && (
                        <>
                          <label style={s.padLabel}>
                            <input type="checkbox" id={`pad-${i}`} defaultChecked
                              onChange={e => onPadToggle(i, e.target.checked ? mod.size : null)} />
                            &nbsp;pad to {kb(mod.size)}
                          </label>
                          <button style={s.btnClear} onClick={() => onClear(i)}>UNDO</button>
                        </>
                      )}
                      {mod.action === 'remove' && (
                        <button style={s.btnClear} onClick={() => onAction(i, 'keep')}>RESTORE</button>
                      )}
                    </>
                  )}
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    ref={el => fileInputRefs.current[i] = el}
                    onChange={e => { if (e.target.files[0]) handleReplace(i, e.target.files[0]) }}
                  />
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    ref={el => insertInputRef.current[i] = el}
                    onChange={e => { if (e.target.files[0]) handleInsert(i, e.target.files[0]); e.target.value = '' }}
                  />
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getStyles(t) {
  const isWb = t.name !== 'cyber'
  return {
    card:        { background: t.colors.cardBg, ...beveledBox(t), borderRadius: t.borders.radius, padding: 20, marginBottom: 16 },
    titleRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    title:       { fontFamily: t.fonts.display, fontSize: 12, color: t.colors.accent, letterSpacing: isWb ? 1 : 3 },
    titleActions:{ display: 'flex', gap: 6 },
    count:       { color: t.colors.textDim, fontSize: 11 },
    scroll:      { overflowX: 'auto' },
    table:       { borderCollapse: 'collapse', width: '100%', minWidth: 800 },
    th:          { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.textDim, padding: '4px 12px', textAlign: 'left', borderBottom: `1px solid ${t.colors.borderSecondary}`, letterSpacing: isWb ? 0 : 2 },
    row:         { borderBottom: `1px solid ${t.colors.borderRow}` },
    rowRemoved:  { opacity: 0.4 },
    rowReplaced: { background: t.colors.rowReplacedBg },
    rowInserted: { background: t.colors.rowInsertedBg },
    td:          { fontFamily: t.fonts.mono, fontSize: 12, color: t.colors.textSecondary, padding: '6px 12px' },
    tdMono:      { fontFamily: t.fonts.mono, fontSize: 11, color: t.colors.textSecondary, padding: '6px 12px' },
    tdName:      { fontFamily: t.fonts.body, fontSize: 13, color: t.colors.textPrimary, padding: '6px 12px', fontWeight: 600 },
    tdStatus:    { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.textSecondary, padding: '6px 12px', verticalAlign: 'top' },
    tdAction:    { padding: '6px 12px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
    replLabel:   { fontSize: 10, color: t.colors.replLabel, fontFamily: t.fonts.mono, marginTop: 2 },
    insertLabel: { fontSize: 10, color: t.colors.insertLabel, fontFamily: t.fonts.mono, marginTop: 2 },
    moveDetail:  { fontSize: 10, color: t.colors.textDim, fontFamily: t.fonts.mono, marginTop: 2, fontWeight: 400, maxWidth: 280 },
    statusBadge: { display: 'inline-block', minWidth: 62, textAlign: 'center', padding: '2px 6px', borderRadius: t.borders.radius, border: `1px solid ${t.colors.borderSecondary}` },
    statusOk:    { color: t.colors.success, borderColor: t.colors.success, background: t.colors.successBg ?? 'transparent' },
    statusWarn:  { color: t.colors.warning, borderColor: t.colors.warning, background: t.colors.warningBg },
    statusBad:   { color: t.colors.error, borderColor: t.colors.errorBorder, background: t.colors.errorBg },
    statusPinned:{ color: t.colors.textSecondary, borderColor: t.colors.textVeryDim, background: t.colors.inputBg },
    btnSave:     wbButton(t, t.colors.btnSaveBg, t.colors.btnSaveBorder, t.colors.btnSaveText),
    btnSaveAll:  wbButton(t, t.colors.btnSaveBg, t.colors.btnSaveBorder, t.colors.btnSaveText),
    btnReplace:  wbButton(t, t.colors.btnReplaceBg, t.colors.btnReplaceBorder, t.colors.btnReplaceText),
    btnInsert:   wbButton(t, t.colors.btnInsertBg, t.colors.btnInsertBorder, t.colors.btnInsertText),
    btnRemove:   wbButton(t, t.colors.btnRemoveBg, t.colors.btnRemoveBorder, t.colors.btnRemoveText),
    btnClear:    wbButton(t, t.colors.btnUndoBg, t.colors.btnUndoBorder, t.colors.btnUndoText),
    padLabel:    { fontFamily: t.fonts.mono, fontSize: 10, color: t.colors.replLabel, cursor: 'pointer' },
  }
}
