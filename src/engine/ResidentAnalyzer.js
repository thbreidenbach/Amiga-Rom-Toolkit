// ResidentAnalyzer.js – Conservative resident visibility / moveability checks

const ROMTAG_MAGIC = 0x4AFC

const FLAG_NAMES = {
  0x01: 'RTF_AUTOINIT',
  0x04: 'RTF_COLDSTART',
  0x08: 'RTF_SINGLETASK',
  0x10: 'RTF_AFTERDOS',
}

const NODE_TYPE_NAMES = {
  1: 'NT_TASK', 3: 'NT_MSGPORT', 8: 'NT_LIBRARY',
  12: 'NT_DEVICE', 14: 'NT_RESOURCE', 16: 'NT_PROCESS',
}

function decodeFlags(flags) {
  return Object.entries(FLAG_NAMES)
    .filter(([bit]) => flags & Number(bit))
    .map(([, name]) => name)
    .join(' | ') || 'none'
}

function ptrLocation(ptr, start, endExclusive) {
  if (ptr === 0) return 'null'
  if (ptr >= start && ptr < endExclusive) return 'internal'
  return 'external'
}

export function analyzeResidentBinary(data, moduleName = '(unnamed)') {
  const info = {
    moduleName,
    hasRomTag: false,
    execVisible: false,
    execLabel: 'NO',
    execReason: 'Binary does not start with a Resident RomTag.',
    moveVerdict: 'unsafe',
    moveLabel: 'NO',
    moveReason: 'Relocation support is unknown.',
    flags: 0,
    flagsDesc: 'none',
    nodeType: 0,
    nodeTypeDesc: 'UNKNOWN',
    version: 0,
    priority: 0,
    compiledMatchTag: 0,
    compiledEndSkip: 0,
    compiledSpan: 0,
    namePtr: 0,
    idPtr: 0,
    initPtr: 0,
    pointerLocations: {
      name: 'unknown',
      id: 'unknown',
      init: 'unknown',
    },
    warnings: [],
  }

  if (!data || data.length < 26) {
    info.execReason = `Binary is too small (${data?.length ?? 0} bytes) to contain a Resident header.`
    info.moveReason = 'Cannot move a module that exec cannot discover.'
    return info
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  if (view.getUint16(0, false) !== ROMTAG_MAGIC) {
    info.execReason = 'Binary does not begin with match word 0x4AFC.'
    info.moveReason = 'Cannot move a module that exec cannot discover.'
    return info
  }

  info.hasRomTag = true
  info.compiledMatchTag = view.getUint32(2, false)
  info.compiledEndSkip = view.getUint32(6, false)
  info.flags = data[10]
  info.flagsDesc = decodeFlags(info.flags)
  info.version = data[11]
  info.nodeType = data[12]
  info.nodeTypeDesc = NODE_TYPE_NAMES[info.nodeType] ?? `NT_${info.nodeType}`
  info.priority = view.getInt8(13)
  info.namePtr = view.getUint32(14, false)
  info.idPtr = view.getUint32(18, false)
  info.initPtr = view.getUint32(22, false)

  if (info.compiledEndSkip <= info.compiledMatchTag) {
    info.execReason = 'Resident header has rt_EndSkip before or at rt_MatchTag.'
    info.moveReason = 'Resident header is structurally invalid.'
    return info
  }

  info.compiledSpan = info.compiledEndSkip - info.compiledMatchTag
  if (info.compiledSpan < 26 || info.compiledSpan > data.length) {
    info.execReason = `Resident span (${info.compiledSpan} bytes) does not fit inside the binary (${data.length} bytes).`
    info.moveReason = 'Resident header is structurally invalid.'
    return info
  }

  const start = info.compiledMatchTag
  const end = info.compiledEndSkip
  info.pointerLocations = {
    name: ptrLocation(info.namePtr, start, end),
    id: ptrLocation(info.idPtr, start, end),
    init: ptrLocation(info.initPtr, start, end),
  }

  if (info.namePtr === 0) {
    info.execReason = 'Resident header has a NULL rt_Name pointer.'
    info.moveReason = 'Resident metadata is incomplete.'
    return info
  }

  if (info.initPtr === 0) {
    info.execReason = 'Resident header has a NULL rt_Init pointer.'
    info.moveReason = 'Resident metadata is incomplete.'
    return info
  }

  if (info.pointerLocations.name !== 'internal') {
    info.execReason = 'Resident name pointer is not self-contained inside the binary.'
    info.moveReason = 'This blob depends on external ROM data the tool cannot rebuild.'
    return info
  }

  if (info.pointerLocations.init !== 'internal') {
    info.execReason = 'Resident init pointer is not self-contained inside the binary.'
    info.moveReason = 'This blob depends on external ROM code/data the tool cannot rebuild.'
    return info
  }

  info.execVisible = true
  info.execLabel = 'YES'
  info.execReason = 'Resident header is structurally valid and self-contained, so exec can scan it after relocation.'

  if (info.pointerLocations.id === 'external') {
    info.warnings.push('rt_IdString points outside the binary and will not be relocated.')
  }

  if (info.flags & 0x01) {
    info.moveVerdict = 'limited'
    info.moveLabel = 'LIMITED'
    info.moveReason = 'RTF_AUTOINIT detected. Exec can see this resident, but the init table may contain more absolute pointers than the tool patches.'
    return info
  }

  info.moveVerdict = 'limited'
  info.moveLabel = 'LIMITED'
  info.moveReason = 'Only RomTag fields are patched today. The resident is visible to exec, but body-internal absolute pointers are not proven relocatable.'
  return info
}

export function describeModulePlacement(mod) {
  if (!mod.inserted && !mod.replacement) {
    return {
      execLabel: 'YES',
      execReason: 'Original scanned resident from ROM.',
      moveLabel: 'PINNED',
      moveReason: 'Original ROM modules are kept in place because absolute pointers in code/data are not relocatable.',
      moveVerdict: 'pinned',
    }
  }

  const residentInfo = mod.replacement
    ? (mod.replacementInfo ?? analyzeResidentBinary(mod.replacement, mod.replacementFilename ?? mod.name))
    : (mod.residentInfo ?? analyzeResidentBinary(mod.data, mod.name))
  return {
    execLabel: residentInfo.execLabel,
    execReason: residentInfo.execReason,
    moveLabel: residentInfo.moveLabel,
    moveReason: residentInfo.moveReason,
    moveVerdict: residentInfo.moveVerdict,
  }
}
