// RomTagScanner.js – Scans ROM binary for Resident (RomTag) structures

const ROMTAG_MAGIC   = 0x4AFC
const ROMTAG_SIZE    = 26  // bytes

const NODE_TYPE_NAMES = {
  1: 'NT_TASK', 3: 'NT_MSGPORT', 8: 'NT_LIBRARY',
  12: 'NT_DEVICE', 14: 'NT_RESOURCE', 16: 'NT_PROCESS',
}

const FLAG_NAMES = {
  0x01: 'RTF_AUTOINIT',
  0x04: 'RTF_COLDSTART',
  0x08: 'RTF_SINGLETASK',
  0x10: 'RTF_AFTERDOS',
}

function readCString(raw, offset) {
  if (offset < 0 || offset >= raw.length) return '(invalid ptr)'
  let end = offset
  while (end < raw.length && raw[end] !== 0) end++
  return new TextDecoder('latin1').decode(raw.slice(offset, end))
}

function decodeFlags(flags) {
  return Object.entries(FLAG_NAMES)
    .filter(([k]) => flags & Number(k))
    .map(([, v]) => v)
    .join(' | ') || 'none'
}

/**
 * Scan raw ROM for valid RomTags.
 * @param {Uint8Array} raw
 * @param {number} base  ROM base address in Amiga address space
 * @returns {RomTag[]}
 */
export function scanRomTags(raw, base) {
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
  const romtags = []

  for (let i = 0; i <= raw.length - ROMTAG_SIZE; i += 2) {
    if (view.getUint16(i, false) !== ROMTAG_MAGIC) continue

    const matchTag = view.getUint32(i + 2, false)
    const expected = base + i
    if (matchTag !== expected) continue

    const endSkip  = view.getUint32(i + 6, false)
    if (endSkip <= expected) continue
    if (endSkip > base + raw.length) continue

    const flags    = raw[i + 10]
    const version  = raw[i + 11]
    const nodeType = raw[i + 12]
    const priority = view.getInt8(i + 13)
    const namePtr  = view.getUint32(i + 14, false)
    const idPtr    = view.getUint32(i + 18, false)
    const initPtr  = view.getUint32(i + 22, false)

    const nameOff = namePtr - base
    const idOff   = idPtr   - base

    const name     = readCString(raw, nameOff)
    const idString = readCString(raw, idOff)

    const moduleEnd = Math.min(endSkip - base, raw.length)
    const moduleStart = i

    romtags.push({
      offset:    i,
      address:   expected,
      endSkip,
      size:      endSkip - expected,
      flags,
      flagsDesc: decodeFlags(flags),
      version,
      nodeType,
      nodeTypeDesc: NODE_TYPE_NAMES[nodeType] ?? `NT_${nodeType}`,
      priority,
      name,
      idString,
      namePtr,
      idPtr,
      initPtr,
      data: raw.slice(moduleStart, moduleEnd),
    })
  }

  return romtags.sort((a, b) => a.offset - b.offset)
}

/**
 * Build a full component map of the ROM including prolog, modules,
 * inter-module gaps, and trailing space.
 * @param {Uint8Array} raw
 * @param {number} base
 * @param {Uint8Array} prolog
 * @param {RomTag[]} romtags  Output of scanRomTags, sorted by offset
 * @returns {Component[]}
 */
export function buildComponentMap(raw, base, prolog, romtags) {
  const components = []
  const checksumSize = 4

  if (prolog.length > 0) {
    components.push({
      kind: 'prolog', name: 'PROLOG (boot code)',
      offset: 0, address: base, size: prolog.length,
      data: prolog,
    })
  }

  let cursor = prolog.length

  for (const tag of romtags) {
    if (tag.offset > cursor) {
      const gapSize = tag.offset - cursor
      components.push({
        kind: 'gap', name: `GAP (${gapSize} bytes)`,
        offset: cursor, address: base + cursor, size: gapSize,
        data: raw.slice(cursor, tag.offset),
      })
    }

    const moduleEnd = Math.min(tag.endSkip - base, raw.length)
    components.push({
      kind: 'module', name: tag.name,
      offset: tag.offset, address: tag.address, size: tag.size,
      data: raw.slice(tag.offset, moduleEnd), romtag: tag,
    })

    cursor = moduleEnd
  }

  const trailEnd = raw.length - checksumSize
  if (cursor < trailEnd) {
    const trailSize = trailEnd - cursor
    components.push({
      kind: 'trailing', name: `TRAILING SPACE (${trailSize} bytes)`,
      offset: cursor, address: base + cursor, size: trailSize,
      data: raw.slice(cursor, trailEnd),
    })
  }

  components.push({
    kind: 'checksum', name: 'CHECKSUM',
    offset: raw.length - checksumSize, address: base + raw.length - checksumSize,
    size: checksumSize, data: raw.slice(raw.length - checksumSize),
  })

  return components
}
