// useRomToolkit.js – Central application state hook

import { useState, useCallback } from 'react'
import { parseRom, byteSwap } from '../engine/RomParser.js'
import { scanRomTags, buildComponentMap } from '../engine/RomTagScanner.js'
import { assembleRom }    from '../engine/RomAssembler.js'
import { validateRom }    from '../engine/RomValidator.js'

const SIZE_256K = 262144
const SIZE_512K = 524288

function downloadBlob(data, filename) {
  const blob = new Blob([data], { type: 'application/octet-stream' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useRomToolkit() {
  const [rom,              setRom]              = useState(null)
  const [romtags,          setRomtags]          = useState([])
  const [components,       setComponents]       = useState([])
  const [modules,          setModules]          = useState([])
  const [assemblyResult,   setAssemblyResult]   = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [error,            setError]            = useState(null)
  const [step,             setStep]             = useState(0)

  // ── Load ROM ───────────────────────────────────────────────────────
  const loadRom = useCallback((arrayBuffer, filename) => {
    setError(null)
    try {
      const parsed = parseRom(arrayBuffer)
      const tags   = scanRomTags(parsed.raw, parsed.base)
      const comps  = buildComponentMap(parsed.raw, parsed.base, parsed.prolog, tags)
      const mods   = tags.map(tag => ({
        ...tag,
        replacement: null,
        padTo:       null,
        action:      'keep',
        filename:    filename,
      }))

      setRom({ ...parsed, filename })
      setRomtags(tags)
      setComponents(comps)
      setModules(mods)
      setAssemblyResult(null)

      const validation = validateRom(parsed.raw)
      setValidationResult({ ...validation, target: 'original' })
      setStep(1)
    } catch (e) {
      setError(`Failed to parse ROM: ${e.message}`)
    }
  }, [])

  // ── Module actions ─────────────────────────────────────────────────
  const setModuleAction = useCallback((index, action) => {
    setModules(prev => prev.map((m, i) => i === index ? { ...m, action } : m))
    setAssemblyResult(null)
  }, [])

  const setModuleReplacement = useCallback((index, arrayBuffer, filename, padToOriginal) => {
    const replacement = new Uint8Array(arrayBuffer)
    setModules(prev => prev.map((m, i) => {
      if (i !== index) return m
      return {
        ...m,
        replacement,
        replacementFilename: filename,
        padTo: padToOriginal ? m.size : null,
        action: 'replace',
      }
    }))
    setAssemblyResult(null)
  }, [])

  const clearModuleReplacement = useCallback((index) => {
    setModules(prev => prev.map((m, i) =>
      i === index ? { ...m, replacement: null, replacementFilename: null, padTo: null, action: 'keep' } : m
    ))
    setAssemblyResult(null)
  }, [])

  const setPadTo = useCallback((index, padTo) => {
    setModules(prev => prev.map((m, i) =>
      i === index ? { ...m, padTo } : m
    ))
    setAssemblyResult(null)
  }, [])

  // ── Insert module ─────────────────────────────────────────────────
  const insertModule = useCallback((afterIndex, arrayBuffer, filename) => {
    const data = new Uint8Array(arrayBuffer)
    if (data.length + rom.prolog.length + modules.reduce((s, m) =>
      s + (m.action !== 'remove' ? (m.padTo ?? (m.replacement ? m.replacement.length : m.size)) : 0), 0) > SIZE_512K) {
      setError('Cannot insert: total payload would exceed 512 KB hard limit.')
      return
    }
    const inserted = {
      name:        filename,
      offset:      -1,
      address:     0,
      endSkip:     0,
      size:        data.length,
      flags:       0,
      flagsDesc:   'none',
      version:     0,
      nodeType:    0,
      nodeTypeDesc:'INSERTED',
      priority:    0,
      idString:    '',
      namePtr:     0,
      idPtr:       0,
      initPtr:     0,
      data,
      replacement: null,
      padTo:       null,
      action:      'insert',
      filename,
      inserted:    true,
    }
    setModules(prev => {
      const next = [...prev]
      next.splice(afterIndex + 1, 0, inserted)
      return next
    })
    setAssemblyResult(null)
  }, [rom, modules])

  const removeInserted = useCallback((index) => {
    setModules(prev => prev.filter((_, i) => i !== index))
    setAssemblyResult(null)
  }, [])

  // ── Save individual component ─────────────────────────────────────
  const saveComponent = useCallback((component) => {
    const safeName = component.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    downloadBlob(component.data, safeName + '.bin')
  }, [])

  const saveAllComponents = useCallback(() => {
    for (const comp of components) {
      if (comp.kind === 'checksum') continue
      const safeName = comp.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      downloadBlob(comp.data, safeName + '.bin')
    }
  }, [components])

  const saveModule = useCallback((index) => {
    const mod = modules[index]
    if (!mod) return
    const data = mod.replacement ?? mod.data
    const safeName = mod.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    downloadBlob(data, safeName + '.bin')
  }, [modules])

  const saveAllModules = useCallback(() => {
    for (const mod of modules) {
      if (mod.action === 'remove') continue
      const data = mod.replacement ?? mod.data
      const safeName = mod.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      downloadBlob(data, safeName + '.bin')
    }
  }, [modules])

  // ── Assemble ───────────────────────────────────────────────────────
  const assemble = useCallback(() => {
    setError(null)
    try {
      const result = assembleRom(rom.prolog, modules, rom.size, rom.base)
      setAssemblyResult(result)
      const validation = validateRom(result.rom)
      setValidationResult({ ...validation, target: 'assembled' })
      setStep(3)
    } catch (e) {
      setError(`Assembly failed: ${e.message}`)
    }
  }, [rom, modules])

  // ── Export ─────────────────────────────────────────────────────────
  const exportRom = useCallback(() => {
    if (!assemblyResult?.rom) return
    downloadBlob(assemblyResult.rom, `kick_custom_${Date.now()}.rom`)
  }, [assemblyResult])

  const exportByteSwapped = useCallback(() => {
    if (!assemblyResult?.rom) return
    const swapped = byteSwap(assemblyResult.rom)
    downloadBlob(swapped, `kick_custom_${Date.now()}_swapped.bin`)
  }, [assemblyResult])

  return {
    rom, romtags, components, modules, assemblyResult, validationResult, error, step,
    loadRom, setModuleAction, setModuleReplacement, clearModuleReplacement,
    setPadTo, insertModule, removeInserted,
    saveComponent, saveAllComponents, saveModule, saveAllModules,
    assemble, exportRom, exportByteSwapped, setStep,
  }
}
