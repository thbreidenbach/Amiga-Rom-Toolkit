// RomAssembler.js – Assembles module list into a new ROM image
//
// Strategy: IN-PLACE assembly.  Kept modules stay at their original ROM
// offsets so that absolute pointers embedded in 68000 machine code remain
// valid.  Only removed modules are zeroed out, and replaced modules are
// written at their original offset (padded to original size by default).
// Inserted modules are appended after the last resident module.

import { patchRomTag, fixChecksum, padToSize } from './RomPatcher.js'

const ALIGN    = 2   // 68000 requires word (2-byte) alignment, not longword
const SIZE_256K = 262144
const SIZE_512K = 524288

function alignUp(n, align) {
  const r = n % align
  return r === 0 ? n : n + align - r
}

/**
 * Assemble a complete ROM image from prolog + module list.
 *
 * Uses an IN-PLACE strategy: kept/replaced modules stay at their original
 * ROM offsets so that absolute 68000 pointers inside module code remain
 * valid.  Removed modules are zeroed out.  Inserted modules are appended
 * after the last resident module.
 *
 * @param {Uint8Array}  prolog        Bytes before the first RomTag
 * @param {object[]}    modules       Ordered module descriptors
 *   Each module: { name, address, data, replacement, padTo, action, endSkip, initPtr, offset }
 *   action: 'keep' | 'replace' | 'remove' | 'insert'
 * @param {number}      romSize       Target ROM size in bytes (256K or 512K)
 * @param {number}      base          ROM base address (e.g. 0xF80000)
 * @param {Uint8Array}  [originalRom] Full original ROM image
 * @returns {{ rom: Uint8Array, layout: object[], warnings: string[] }}
 */
export function assembleRom(prolog, modules, romSize, base, originalRom) {
  const warnings = []
  const layout   = []

  const kept = modules.filter(m => m.action !== 'remove')
  const anyChanges = kept.some(m => m.action !== 'keep' || m.inserted) ||
                     modules.some(m => m.action === 'remove')

  // ── Fast path: no modifications → return original ROM with fresh checksum ─
  if (!anyChanges && originalRom) {
    const rom = new Uint8Array(originalRom)

    for (const mod of kept) {
      layout.push({
        name:        mod.name,
        originalAddress: mod.address,
        newOffset:   mod.offset,
        newAddress:  mod.address,
        delta:       0,
        size:        mod.data.length,
        data:        mod.data,
        inserted:    false,
      })
    }

    const romView = new DataView(rom.buffer, rom.byteOffset, rom.byteLength)
    romView.setUint32(romSize - 20, romSize, false)
    const romWithChecksum = fixChecksum(rom)

    return { rom: romWithChecksum, layout, warnings }
  }

  // ── In-place rebuild: start from original ROM ─────────────────────
  const rom = originalRom ? new Uint8Array(originalRom) : new Uint8Array(romSize)

  // Write prolog (unmodified – entry point hasn't moved since modules stay in place)
  rom.set(prolog, 0)

  // Track the high-water mark (end of last module/gap) for appending inserts
  let highWater = prolog.length

  // ── Phase 1: Process original modules (keep / replace / remove) ───
  for (const mod of modules) {
    if (mod.inserted) continue   // handle inserts in Phase 2

    if (mod.action === 'remove') {
      // Zero out ONLY the removed module's own data area (offset → endSkip).
      // Do NOT zero the preGap – it may contain strings or data tables
      // referenced by pointers in the PREVIOUS module (which is kept).
      const modStart = mod.offset
      const modEnd   = Math.min(mod.endSkip - base, romSize - 24)
      rom.fill(0, modStart, modEnd)

      warnings.push(`Module "${mod.name}" removed – ${mod.size} bytes zeroed at offset 0x${mod.offset.toString(16)}`)
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

      // The replacement binary may have its own RomTag with pointers
      // compiled for a different base address.  Patch it so rt_MatchTag
      // and rt_EndSkip match the actual ROM location.
      if (data.length >= 26 && data[0] === 0x4A && data[1] === 0xFC) {
        const dv = new DataView(data.buffer, data.byteOffset, data.byteLength)
        const replMatch = dv.getUint32(2, false)
        const targetAddr = mod.address  // original address in ROM
        if (replMatch !== targetAddr) {
          const replDelta = targetAddr - replMatch
          data = patchRomTag(data, replDelta, replMatch, dv.getUint32(6, false))
          warnings.push(
            `Module "${mod.name}": replacement RomTag patched ` +
            `(delta=0x${Math.abs(replDelta).toString(16)}, was 0x${replMatch.toString(16)} → 0x${targetAddr.toString(16)})`
          )
        }
      }
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
    })
  }

  // ── Phase 2: Append inserted modules after the last resident ──────
  const inserts = modules.filter(m => m.inserted)

  if (inserts.length > 0) {
    // Find free space: start after the highest module endSkip
    // (accounting for any gap/trailing data)
    let cursor = highWater

    for (const mod of inserts) {
      cursor = alignUp(cursor, ALIGN)
      const newAddress = base + cursor

      if (cursor + mod.data.length > romSize - 24) {
        throw new Error(
          `Cannot insert "${mod.name}" (${mod.data.length} bytes): ` +
          `would overflow ROM at offset 0x${cursor.toString(16)} ` +
          `(${romSize - 24 - cursor} bytes free)`
        )
      }

      // Write inserted module data
      rom.set(mod.data, cursor)

      layout.push({
        name:            mod.name,
        originalAddress: newAddress,
        newOffset:       cursor,
        newAddress,
        delta:           0,
        size:            mod.data.length,
        data:            mod.data,
        inserted:        true,
      })

      warnings.push(
        `Module "${mod.name}" inserted at offset 0x${cursor.toString(16)} (${mod.data.length} bytes)`
      )

      cursor += mod.data.length
    }
  }

  // --- Size enforcement ------------------------------------------------
  // (in-place keeps can't overflow, but inserts might)
  const totalUsed = layout.reduce((max, e) => Math.max(max, e.newOffset + e.size), prolog.length)

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

  // --- Write ROM footer fields ----------------------------------------
  if (originalRom) {
    rom.set(originalRom.slice(romSize - 16), romSize - 16)
  }
  const romView = new DataView(rom.buffer, rom.byteOffset, rom.byteLength)
  romView.setUint32(romSize - 20, romSize, false)

  // --- Fix checksum (ones' complement, written at -24 from end) ------
  const romWithChecksum = fixChecksum(rom)

  return { rom: romWithChecksum, layout, warnings }
}
