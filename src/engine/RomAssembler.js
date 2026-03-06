// RomAssembler.js – Assembles module list into a new ROM image

import { patchRomTag, patchProlog, fixChecksum, padToSize } from './RomPatcher.js'

const ALIGN = 4

function alignUp(n, align) {
  const r = n % align
  return r === 0 ? n : n + align - r
}

/**
 * Assemble a complete ROM image from prolog + module list.
 *
 * @param {Uint8Array}  prolog        Bytes before the first RomTag
 * @param {object[]}    modules       Ordered module descriptors
 *   Each module: { name, address, data, replacement, padTo, action, endSkip, initPtr }
 * @param {number}      romSize       Target ROM size in bytes (256K or 512K)
 * @param {number}      base          ROM base address (e.g. 0xF80000)
 * @returns {{ rom: Uint8Array, layout: object[], warnings: string[] }}
 */
export function assembleRom(prolog, modules, romSize, base) {
  const warnings = []
  const layout   = []
  let cursor     = prolog.length

  // --- Build layout --------------------------------------------------
  const kept = modules.filter(m => m.action !== 'remove')

  for (const mod of kept) {
    cursor = alignUp(cursor, ALIGN)
    const newAddress = base + cursor
    const delta      = newAddress - mod.address

    let data = mod.replacement ?? mod.data

    // Apply padding if requested or if we're replacing a same-slot module
    if (mod.padTo != null) {
      try {
        data = padToSize(data, mod.padTo)
      } catch (e) {
        throw new Error(`Module "${mod.name}": ${e.message}`)
      }
    }

    // Warn about internal pointer breakage when delta != 0 and no padding
    if (delta !== 0 && mod.padTo == null) {
      warnings.push(
        `Module "${mod.name}" relocated by 0x${Math.abs(delta).toString(16)} bytes. ` +
        `Internal pointers (beyond RomTag header) are NOT adjusted – consider padding to original size.`
      )
    }

    // Patch RomTag header pointers
    let patched = data
    if (delta !== 0) {
      patched = patchRomTag(data, delta)
    }

    layout.push({
      name:        mod.name,
      originalAddress: mod.address,
      newOffset:   cursor,
      newAddress,
      delta,
      size:        patched.length,
      data:        patched,
    })

    cursor += patched.length
  }

  if (cursor > romSize) {
    throw new Error(`Assembled size ${cursor} bytes exceeds ROM size ${romSize} bytes`)
  }

  // --- Build ROM buffer ----------------------------------------------
  const rom = new Uint8Array(romSize) // zero-filled

  // Write prolog (patch JMP entry if first module moved)
  let prologPatched = prolog
  if (layout.length > 0 && layout[0].delta !== 0) {
    const firstKept = kept[0]
    if (firstKept && prolog[0] === 0x4E && prolog[1] === 0xF9) {
      const view = new DataView(prolog.buffer, prolog.byteOffset, prolog.byteLength)
      const oldEntry = view.getUint32(2, false)
      // Only patch if old entry was inside the first module's original range
      if (oldEntry >= firstKept.address && oldEntry < firstKept.endSkip) {
        const newEntry = oldEntry + layout[0].delta
        prologPatched = patchProlog(prolog, newEntry)
        warnings.push(`Prolog JMP target patched: 0x${oldEntry.toString(16)} → 0x${newEntry.toString(16)}`)
      }
    }
  }

  rom.set(prologPatched, 0)

  for (const entry of layout) {
    rom.set(entry.data, entry.newOffset)
  }

  // --- Fix checksum --------------------------------------------------
  const romWithChecksum = fixChecksum(rom)

  return { rom: romWithChecksum, layout, warnings }
}
