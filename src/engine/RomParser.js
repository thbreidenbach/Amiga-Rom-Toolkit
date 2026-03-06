// RomParser.js – Parses raw ROM binary into a structured object
//
// Standard Amiga Kickstart ROM header layout:
//   Offset 0x00: ROM type word ($1111 = 256K, $1114 = 512K)
//   Offset 0x02: $4EF9 (JMP instruction)
//   Offset 0x04: JMP target address (entry point, 4 bytes)
//   Offset 0x0C: Version  (2 bytes)
//   Offset 0x0E: Revision (2 bytes)

const VALID_SIZES = [262144, 524288] // 256 KB, 512 KB
const BASE_BY_SIZE = {
  262144: 0xFC0000,
  524288: 0xF80000,
}

/**
 * Locate the JMP ($4EF9) instruction in the ROM header.
 * Standard ROMs have the type word at offset 0 and JMP at offset 2.
 * Returns { jmpOffset, entryPoint } or null if no JMP found.
 */
function findEntryPoint(raw, view) {
  // Standard format: type word at 0, JMP at offset 2
  if (raw[2] === 0x4E && raw[3] === 0xF9) {
    return { jmpOffset: 2, entryPoint: view.getUint32(4, false) }
  }
  // Legacy/non-standard: JMP directly at offset 0
  if (raw[0] === 0x4E && raw[1] === 0xF9) {
    return { jmpOffset: 0, entryPoint: view.getUint32(2, false) }
  }
  return null
}

/**
 * Detect byte-swapped ROM images (each pair of bytes reversed).
 * Common with ROM chip dumps where even/odd chips are read in wrong order.
 */
function detectByteSwap(raw) {
  // Check for swapped JMP opcode ($F94E instead of $4EF9)
  if (raw[2] === 0xF9 && raw[3] === 0x4E) return true
  if (raw[0] === 0xF9 && raw[1] === 0x4E) return true

  // Count normal vs swapped RomTag magics ($4AFC vs $FC4A)
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
  let normal = 0, swapped = 0
  for (let i = 0; i < raw.length; i += 2) {
    const w = view.getUint16(i, false)
    if (w === 0x4AFC) normal++
    if (w === 0xFC4A) swapped++
  }
  return swapped > normal && swapped >= 3
}

function byteSwap(raw) {
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 2) {
    out[i]     = raw[i + 1]
    out[i + 1] = raw[i]
  }
  return out
}

/**
 * Parse a raw ArrayBuffer into a ROM descriptor.
 * @param {ArrayBuffer} buffer
 * @returns {{ raw: Uint8Array, base: number, size: number, prolog: Uint8Array,
 *             entryPoint: number|null, jmpOffset: number, version: number,
 *             revision: number, wasSwapped: boolean }}
 */
export function parseRom(buffer) {
  let raw = new Uint8Array(buffer)
  const size = raw.length

  if (!VALID_SIZES.includes(size)) {
    throw new Error(`Invalid ROM size: ${size} bytes. Expected 256 KB or 512 KB.`)
  }

  // Auto-detect and fix byte-swapped ROM dumps
  let wasSwapped = false
  if (detectByteSwap(raw)) {
    raw = byteSwap(raw)
    wasSwapped = true
  }

  const base = BASE_BY_SIZE[size]
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)

  // Locate JMP entry point (offset 2 standard, offset 0 fallback)
  const ep = findEntryPoint(raw, view)
  const entryPoint = ep ? ep.entryPoint : null
  const jmpOffset  = ep ? ep.jmpOffset  : -1

  // Read version/revision (always at offsets 0x0C / 0x0E)
  const version  = view.getUint16(0x0C, false)
  const revision = view.getUint16(0x0E, false)

  // Determine prolog boundary: scan for first valid $4AFC RomTag
  let prologEnd = 0
  for (let i = 0; i < size - 26; i += 2) {
    if (view.getUint16(i, false) === 0x4AFC) {
      const matchTag = view.getUint32(i + 2, false)
      if (matchTag === base + i) {
        prologEnd = i
        break
      }
    }
  }

  const prolog = raw.slice(0, prologEnd)

  return { raw, base, size, prolog, entryPoint, jmpOffset, version, revision, wasSwapped }
}
