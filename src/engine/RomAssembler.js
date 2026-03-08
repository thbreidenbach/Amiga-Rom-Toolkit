// RomAssembler.js – Assembles module list into a new ROM image
//
// Strategy: IN-PLACE assembly.  Kept modules stay at their original ROM
// offsets so that absolute pointers embedded in 68000 machine code remain
// valid.  Only removed modules are zeroed out, and replaced modules are
// written at their original offset (padded to original size by default).
//
// Inserted modules first try to fill gaps left by removed modules (at the
// gap's own address, so no existing module moves).  Any inserts that don't
// fit a gap are appended after the last resident module.

import { patchRomTag, fixChecksum, padToSize } from './RomPatcher.js'
import { analyzeResidentBinary } from './ResidentAnalyzer.js'

const ALIGN     = 2   // 68000 requires word (2-byte) alignment
const SIZE_256K = 262144
const SIZE_512K = 524288

function alignUp(n, align) {
  const r = n % align
  return r === 0 ? n : n + align - r
}

function mergeSegments(segments) {
  if (segments.length === 0) return []

  const sorted = segments
    .filter(s => s.size > 0)
    .sort((a, b) => a.offset - b.offset)

  if (sorted.length === 0) return []

  const merged = [{ ...sorted[0] }]

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]
    const prev = merged[merged.length - 1]
    const prevEnd = prev.offset + prev.size
    const currentEnd = current.offset + current.size

    if (current.offset <= prevEnd) {
      prev.size = Math.max(prevEnd, currentEnd) - prev.offset
      continue
    }

    merged.push({ ...current })
  }

  return merged
}

function buildFreeSpaceReport(gaps, totalUsed, romSize) {
  const payloadLimit = romSize - 24
  const tailStart = alignUp(totalUsed, ALIGN)
  const freeSegments = gaps.map(g => ({ offset: g.offset, size: g.size }))

  if (tailStart < payloadLimit) {
    freeSegments.push({ offset: tailStart, size: payloadLimit - tailStart })
  }

  const merged = mergeSegments(freeSegments)

  if (merged.length === 0) {
    return { gaps: [], trailing: 0, total: 0 }
  }

  const last = merged[merged.length - 1]
  const lastEnd = last.offset + last.size
  const trailing = lastEnd === payloadLimit ? last.size : 0
  const gapsOnly = trailing > 0 ? merged.slice(0, -1) : merged
  const gapTotal = gapsOnly.reduce((sum, g) => sum + g.size, 0)

  return {
    gaps: gapsOnly,
    trailing,
    total: gapTotal + trailing,
  }
}

/**
 * Patch a module binary's RomTag to target a specific ROM address.
 * Reads the compiled rt_MatchTag / rt_EndSkip from the binary, computes
 * the delta to the target, and calls patchRomTag().
 *
 * @param {Uint8Array} data          Raw module bytes (starts at RomTag)
 * @param {number}     targetAddress Desired absolute address in ROM
 * @param {string[]}   warnings      Accumulator for warning messages
 * @param {string}     modName       Module name (for messages)
 * @returns {Uint8Array}             Possibly-patched data
 */
function patchModuleRomTag(data, targetAddress, warnings, modName) {
  if (data.length < 26 || data[0] !== 0x4A || data[1] !== 0xFC) return data

  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const compiledMatch = dv.getUint32(2, false)   // rt_MatchTag
  const compiledEnd   = dv.getUint32(6, false)   // rt_EndSkip

  if (compiledMatch === targetAddress) return data   // already correct

  const delta = targetAddress - compiledMatch
  const patched = patchRomTag(data, delta, compiledMatch, compiledEnd)

  warnings.push(
    `Module "${modName}": RomTag patched ` +
    `(delta=${delta >= 0 ? '+' : ''}0x${Math.abs(delta).toString(16)}, ` +
    `was 0x${compiledMatch.toString(16)} → 0x${targetAddress.toString(16)})`
  )

  return patched
}


/**
 * Assemble a complete ROM image from prolog + module list.
 *
 * Uses an IN-PLACE strategy: kept/replaced modules stay at their original
 * ROM offsets so that absolute 68000 pointers inside module code remain
 * valid.  Removed modules are zeroed out, creating gaps.  Inserted modules
 * first try to fill those gaps while preserving insert order by ROM address;
 * overflow is appended after the last resident module.
 *
 * @param {Uint8Array}  prolog        Bytes before the first RomTag
 * @param {object[]}    modules       Ordered module descriptors
 *   Each module: { name, address, data, replacement, padTo, action, endSkip, initPtr, offset }
 *   action: 'keep' | 'replace' | 'remove' | 'insert'
 * @param {number}      romSize       Target ROM size in bytes (256K or 512K)
 * @param {number}      base          ROM base address (e.g. 0xF80000)
 * @param {Uint8Array}  [originalRom] Full original ROM image
 * @returns {{ rom: Uint8Array, layout: object[], warnings: string[], freeSpace: object }}
 */
export function assembleRom(prolog, modules, romSize, base, originalRom) {
  const warnings = []
  const layout   = []

  for (const mod of modules) {
    if (mod.action === 'remove') continue

    if (mod.inserted) {
      const info = mod.residentInfo ?? analyzeResidentBinary(mod.data, mod.name)
      if (!info.execVisible) {
        throw new Error(
          `Cannot insert "${mod.name}": exec will not discover this binary. ${info.execReason}`
        )
      }
      warnings.push(
        `Module "${mod.name}": ${info.execReason} Move safety: ${info.moveReason}`
      )
      continue
    }

    if (mod.action === 'replace' && mod.replacement) {
      const info = mod.replacementInfo ?? analyzeResidentBinary(mod.replacement, mod.replacementFilename ?? mod.name)
      if (!info.execVisible) {
        throw new Error(
          `Cannot replace "${mod.name}" with "${mod.replacementFilename ?? mod.name}": ` +
          `replacement is not a self-contained resident. ${info.execReason}`
        )
      }
      warnings.push(
        `Replacement "${mod.replacementFilename ?? mod.name}": ${info.execReason} Move safety: ${info.moveReason}`
      )
    }
  }

  const kept = modules.filter(m => m.action !== 'remove')
  const anyChanges = kept.some(m => m.action !== 'keep' || m.inserted) ||
                     modules.some(m => m.action === 'remove')

  // ── Fast path: no modifications → return original ROM with fresh checksum ─
  if (!anyChanges && originalRom) {
    const rom = new Uint8Array(originalRom)

    let hw = prolog.length
    for (const mod of kept) {
      const modEnd = Math.min(mod.endSkip - base, romSize - 24)
      if (modEnd > hw) hw = modEnd
      layout.push({
        name:        mod.name,
        originalAddress: mod.address,
        newOffset:   mod.offset,
        newAddress:  mod.address,
        delta:       0,
        size:        mod.data.length,
        data:        mod.data,
        inserted:    false,
        gapFilled:   false,
      })
    }

    const romView = new DataView(rom.buffer, rom.byteOffset, rom.byteLength)
    romView.setUint32(romSize - 20, romSize, false)
    const romWithChecksum = fixChecksum(rom)

    const trailing = Math.max(0, romSize - 24 - hw)
    return {
      rom: romWithChecksum, layout, warnings,
      freeSpace: { gaps: [], trailing, total: trailing },
    }
  }

  // ── In-place rebuild: start from original ROM ─────────────────────
  const rom = originalRom ? new Uint8Array(originalRom) : new Uint8Array(romSize)

  // Write prolog (unmodified – entry point hasn't moved since modules stay in place)
  rom.set(prolog, 0)

  // Track the high-water mark (end of last kept/replaced module) for appending
  let highWater = prolog.length

  // Collect gaps from removed modules for gap-filling
  const gaps = []

  // ── Phase 1: Process original modules (keep / replace / remove) ───
  for (const mod of modules) {
    if (mod.inserted) continue   // handle inserts in Phase 2

    if (mod.action === 'remove') {
      // Zero out the removed module's own data area (offset → endSkip).
      // Do NOT zero the preGap – it may contain strings or data tables
      // referenced by pointers in the PREVIOUS module (which is kept).
      const gapStart = mod.offset
      const gapEnd   = Math.min(mod.endSkip - base, romSize - 24)
      const gapSize  = gapEnd - gapStart
      rom.fill(0, gapStart, gapEnd)

      if (gapSize > 0) {
        gaps.push({ offset: gapStart, size: gapSize, address: base + gapStart })
      }

      warnings.push(
        `Module "${mod.name}" removed – ${gapSize} bytes freed at offset 0x${gapStart.toString(16)}`
      )
      continue
    }

    // action === 'keep' or 'replace'
    const origOffset = mod.offset
    let data = mod.replacement ?? mod.data

    if (mod.action === 'replace') {
      // For replacements: pad to original module size to stay in-place.
      // Never exceed the original module size – overwriting past the
      // boundary would corrupt the next module or inter-module gap.
      const targetSize = Math.min(mod.padTo ?? mod.size, mod.size)
      if (data.length > targetSize) {
        throw new Error(
          `Module "${mod.name}": replacement (${data.length} bytes) exceeds ` +
          `original module size (${targetSize} bytes). Use a smaller replacement.`
        )
      }
      if (data.length < targetSize) {
        data = padToSize(data, targetSize)
      }

      // Patch the replacement binary's RomTag to match the actual ROM location
      data = patchModuleRomTag(data, mod.address, warnings, mod.name)
      rom.set(data, origOffset)

      warnings.push(
        `Module "${mod.name}" replaced in-place at offset 0x${origOffset.toString(16)} ` +
        `(${data.length} bytes, padded to ${mod.size})`
      )
    } else {
      // 'keep' – module stays exactly as-is in the original ROM.
      // Since we started from a copy of originalRom, no write needed.
    }

    // Track the end of the last kept/replaced module for appending inserts.
    // Use endSkip (the module's declared boundary) rather than data length,
    // because there may be gap data between endSkip and the next module.
    const modEnd = mod.endSkip - base
    if (modEnd > highWater) highWater = modEnd

    layout.push({
      name:            mod.name,
      originalAddress: mod.address,
      newOffset:       origOffset,
      newAddress:      mod.address,       // unchanged!
      delta:           0,                 // always 0 for in-place
      size:            mod.action === 'replace' ? data.length : mod.data.length,
      data:            mod.action === 'replace' ? data : mod.data,
      inserted:        false,
      gapFilled:       false,
    })
  }

  // ── Phase 2: Place inserted modules (stable gap-fill first, then append) ─
  const inserts = modules.filter(m => m.inserted)

  if (inserts.length > 0) {
    // Keep gaps in ROM order so later inserts never land before earlier ones.
    gaps.sort((a, b) => a.offset - b.offset)

    let tailCursor = highWater
    let minInsertOffset = 0

    for (const mod of inserts) {
      const alignedLen = alignUp(mod.data.length, ALIGN)

      // Preserve resident order by only considering free space at or after
      // the previous inserted module's placement.
      const gapIdx = gaps.findIndex(g => g.offset >= minInsertOffset && g.size >= alignedLen)

      let cursor, newAddress, gapFilled

      if (gapIdx >= 0) {
        // ── Gap-fill: write into the removed module's slot ──
        const gap = gaps[gapIdx]
        cursor     = gap.offset
        newAddress = gap.address
        gapFilled  = true

        // Shrink or consume the gap
        if (gap.size - alignedLen >= ALIGN) {
          gap.offset  += alignedLen
          gap.size    -= alignedLen
          gap.address  = base + gap.offset
        } else {
          gaps.splice(gapIdx, 1)
        }
      } else {
        // ── Append after the last resident module ──
        cursor     = alignUp(Math.max(tailCursor, minInsertOffset), ALIGN)
        newAddress = base + cursor
        gapFilled  = false
        tailCursor = cursor + mod.data.length
      }

      // Overflow check
      if (cursor + mod.data.length > romSize - 24) {
        const freeHere = romSize - 24 - cursor
        throw new Error(
          `Cannot insert "${mod.name}" (${mod.data.length} bytes): ` +
          `would overflow ROM at offset 0x${cursor.toString(16)} ` +
          `(only ${freeHere} bytes available at that location)`
        )
      }

      // Patch the inserted binary's RomTag to match the target address
      let data = new Uint8Array(mod.data)
      data = patchModuleRomTag(data, newAddress, warnings, mod.name)

      // Write into ROM
      rom.set(data, cursor)

      layout.push({
        name:            mod.name,
        originalAddress: newAddress,
        newOffset:       cursor,
        newAddress,
        delta:           0,
        size:            mod.data.length,
        data,
        inserted:        true,
        gapFilled,
      })

      minInsertOffset = cursor

      const where = gapFilled
        ? `gap at offset 0x${cursor.toString(16)}`
        : `end at offset 0x${cursor.toString(16)}`
      warnings.push(
        `Module "${mod.name}" inserted into ${where} (${mod.data.length} bytes)`
      )
    }
  }

  // ── Size enforcement ──────────────────────────────────────────────
  const totalUsed = layout.reduce(
    (max, e) => Math.max(max, e.newOffset + e.size), prolog.length
  )

  if (totalUsed > romSize - 24) {
    throw new Error(
      `Assembled payload extends to offset 0x${totalUsed.toString(16)} – ` +
      `exceeds ROM size ${romSize} bytes (footer starts at 0x${(romSize - 24).toString(16)})`
    )
  }

  if (totalUsed > SIZE_256K && romSize === SIZE_256K) {
    warnings.push(
      `Payload extends to 0x${totalUsed.toString(16)} (${(totalUsed / 1024).toFixed(1)} KB) – ` +
      `exceeds 256 KB. This ROM will NOT fit in a 256 KB flash chip.`
    )
  }

  // ── Write ROM footer fields ───────────────────────────────────────
  if (originalRom) {
    rom.set(originalRom.slice(romSize - 16), romSize - 16)
  }
  const romView = new DataView(rom.buffer, rom.byteOffset, rom.byteLength)
  romView.setUint32(romSize - 20, romSize, false)

  // ── Fix checksum (ones' complement, written at -24 from end) ──────
  const romWithChecksum = fixChecksum(rom)

  // ── Free space report ─────────────────────────────────────────────
  const freeSpace = buildFreeSpaceReport(gaps, totalUsed, romSize)

  return { rom: romWithChecksum, layout, warnings, freeSpace }
}
