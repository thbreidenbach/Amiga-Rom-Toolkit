// RomAssembler.js – Assembles module list into a new ROM image

import { patchRomTag, patchProlog, fixChecksum, padToSize } from './RomPatcher.js'

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
 * @param {Uint8Array}  prolog        Bytes before the first RomTag
 * @param {object[]}    modules       Ordered module descriptors
 *   Each module: { name, address, data, replacement, padTo, action, endSkip, initPtr }
 *   action: 'keep' | 'replace' | 'remove' | 'insert'
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

    // Inserted modules have no original address; use newAddress as origin
    const origAddress = mod.inserted ? newAddress : mod.address
    const delta       = newAddress - origAddress

    let data = mod.replacement ?? mod.data

    // Apply padding if requested
    if (mod.padTo != null) {
      try {
        data = padToSize(data, mod.padTo)
      } catch (e) {
        throw new Error(`Module "${mod.name}": ${e.message}`)
      }
    }

    // Warn about internal pointer breakage when delta != 0 and no padding
    if (delta !== 0 && mod.padTo == null && !mod.inserted) {
      warnings.push(
        `Module "${mod.name}" relocated by 0x${Math.abs(delta).toString(16)} bytes. ` +
        `Internal pointers (beyond RomTag header) are NOT adjusted – consider padding to original size.`
      )
    }

    // Patch RomTag header pointers (skip for raw inserted binaries)
    let patched = data
    if (delta !== 0 && !mod.inserted) {
      patched = patchRomTag(data, delta, origAddress, mod.endSkip)
    }

    layout.push({
      name:        mod.name,
      originalAddress: origAddress,
      newOffset:   cursor,
      newAddress,
      delta,
      size:        patched.length,
      data:        patched,
      inserted:    !!mod.inserted,
    })

    cursor += patched.length
  }

  // --- Size enforcement ------------------------------------------------
  if (cursor > SIZE_512K) {
    throw new Error(
      `Assembled payload is ${cursor} bytes – exceeds the absolute 512 KB limit (${SIZE_512K} bytes). ` +
      `Remove or shrink modules.`
    )
  }

  if (cursor > romSize) {
    throw new Error(`Assembled size ${cursor} bytes exceeds target ROM size ${romSize} bytes`)
  }

  if (cursor > SIZE_256K) {
    warnings.push(
      `Payload is ${cursor} bytes (${(cursor / 1024).toFixed(1)} KB) – exceeds 256 KB. ` +
      `This ROM will NOT fit in a 256 KB flash chip; a 512 KB flash is required.`
    )
  }

  // --- Build ROM buffer ----------------------------------------------
  const rom = new Uint8Array(romSize) // zero-filled

  // Write prolog (patch JMP entry if first module moved)
  let prologPatched = prolog
  if (layout.length > 0 && layout[0].delta !== 0 && !layout[0].inserted) {
    const firstKept = kept[0]
    if (firstKept && !firstKept.inserted) {
      const pView = new DataView(prolog.buffer, prolog.byteOffset, prolog.byteLength)
      let oldEntry = null
      // Standard format: type word at 0, JMP at offset 2, target at offset 4
      if (prolog.length >= 8 && prolog[2] === 0x4E && prolog[3] === 0xF9) {
        oldEntry = pView.getUint32(4, false)
      // Legacy: JMP directly at offset 0, target at offset 2
      } else if (prolog.length >= 6 && prolog[0] === 0x4E && prolog[1] === 0xF9) {
        oldEntry = pView.getUint32(2, false)
      }
      if (oldEntry != null && oldEntry >= firstKept.address && oldEntry < firstKept.endSkip) {
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

  // --- Write ROM footer fields ----------------------------------------
  const romView = new DataView(rom.buffer, rom.byteOffset, rom.byteLength)
  // ROM size field at -20 bytes from end
  romView.setUint32(romSize - 20, romSize, false)

  // --- Fix checksum (ones' complement, written at -24 from end) ------
  const romWithChecksum = fixChecksum(rom)

  return { rom: romWithChecksum, layout, warnings }
}
