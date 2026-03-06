// useRomToolkit.js – Central application state hook

import { useState, useCallback } from 'react'
import { parseRom }       from '../engine/RomParser.js'
import { scanRomTags }    from '../engine/RomTagScanner.js'
import { assembleRom }    from '../engine/RomAssembler.js'
import { validateRom }    from '../engine/RomValidator.js'

export function useRomToolkit() {
  const [rom,              setRom]              = useState(null)
  const [romtags,          setRomtags]          = useState([])
  const [modules,          setModules]          = useState([])
  const [assemblyResult,   setAssemblyResult]   = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [error,            setError]            = useState(null)
  const [step,             setStep]             = useState(0) // 0=load,1=analyse,2=assemble,3=validate

  // ── Load ROM ───────────────────────────────────────────────────────
  const loadRom = useCallback((arrayBuffer, filename) => {
    setError(null)
    try {
      const parsed = parseRom(arrayBuffer)
      const tags   = scanRomTags(parsed.raw, parsed.base)
      const mods   = tags.map(tag => ({
        ...tag,
        replacement: null,
        padTo:       null,
        action:      'keep',
        filename:    filename,
      }))

      setRom({ ...parsed, filename })
      setRomtags(tags)
      setModules(mods)
      setAssemblyResult(null)

      // Validate the original ROM immediately
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
    const blob = new Blob([assemblyResult.rom], { type: 'application/octet-stream' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `kick_custom_${Date.now()}.rom`
    a.click()
    URL.revokeObjectURL(url)
  }, [assemblyResult])

  return {
    rom, romtags, modules, assemblyResult, validationResult, error, step,
    loadRom, setModuleAction, setModuleReplacement, clearModuleReplacement,
    setPadTo, assemble, exportRom, setStep,
  }
}
