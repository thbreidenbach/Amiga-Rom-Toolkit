// RomParser.js – Parses raw ROM binary into a structured object

const VALID_SIZES = [262144, 524288] // 256 KB, 512 KB
const BASE_BY_SIZE = {
  262144: 0xFC0000,
  524288: 0xF80000,
}

/**
 * Parse a raw ArrayBuffer into a ROM descriptor.
 * @param {ArrayBuffer} buffer
 * @returns {{ raw: Uint8Array, base: number, size: number, prolog: Uint8Array, entryPoint: number|null, version: number, revision: number }}
 */
export function parseRom(buffer) {
  const raw = new Uint8Array(buffer)
  const size = raw.length

  if (!VALID_SIZES.includes(size)) {
    throw new Error(`Invalid ROM size: ${size} bytes. Expected 256 KB or 512 KB.`)
  }

  const base = BASE_BY_SIZE[size]
  const view = new DataView(buffer)

  // Read entry point from JMP instruction at offset 0
  let entryPoint = null
  if (raw[0] === 0x4E && raw[1] === 0xF9) {
    entryPoint = view.getUint32(2, false)
  }

  // Read version/revision (typically at offsets 0x0C / 0x0E)
  const version  = view.getUint16(0x0C, false)
  const revision = view.getUint16(0x0E, false)

  // Determine prolog boundary: scan for first $4AFC
  let prologEnd = 0
  const dv = new DataView(buffer)
  for (let i = 0; i < size - 26; i += 2) {
    if (dv.getUint16(i, false) === 0x4AFC) {
      const matchTag = dv.getUint32(i + 2, false)
      if (matchTag === base + i) {
        prologEnd = i
        break
      }
    }
  }

  const prolog = raw.slice(0, prologEnd)

  return { raw, base, size, prolog, entryPoint, version, revision }
}
