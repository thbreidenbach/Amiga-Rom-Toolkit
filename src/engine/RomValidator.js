// RomValidator.js – Multi-stage ROM image validation
// v2 – ones' complement checksum per Kreeblah/AmigaROMUtil

import { onesComplementSum } from './RomPatcher.js'

const VALID_SIZES    = [262144, 524288]
const BASE_BY_SIZE   = { 262144: 0xFC0000, 524288: 0xF80000 }
const ROMTAG_MAGIC   = 0x4AFC

// Modules that must be present for any valid Kickstart ROM
const REQUIRED_MODULES = ['exec.library', 'dos.library', 'graphics.library', 'intuition.library', 'expansion.library']
// Modules only expected in KS 2.0+ (version >= 36)
const WARNED_MODULES_V2 = ['utility.library']
// Modules expected in all versions
const WARNED_MODULES_ALL = ['trackdisk.device', 'layers.library']

function pass(id, name, detail = '')  { return { id, name, passed: true,  severity: 'ok',   detail } }
function fail(id, name, detail = '')  { return { id, name, passed: false, severity: 'error', detail } }
function warn(id, name, detail = '')  { return { id, name, passed: true,  severity: 'warn',  detail } }

/**
 * Run all validation stages on a ROM image.
 *
 * @param {Uint8Array} rom
 * @returns {{ stages: ValidationStage[], passed: boolean }}
 */
export function validateRom(rom) {
  const stages = []
  const view   = new DataView(rom.buffer, rom.byteOffset, rom.byteLength)

  // ── Stage 1: Size ─────────────────────────────────────────────────
  if (!VALID_SIZES.includes(rom.length)) {
    stages.push(fail('SIZE', 'Size Check',
      `ROM is ${rom.length} bytes. Expected 262144 (256 KB) or 524288 (512 KB).`))
    return { stages, passed: false }
  }
  stages.push(pass('SIZE', 'Size Check', `${rom.length / 1024} KB – valid`))

  const base = BASE_BY_SIZE[rom.length]

  // ── Stage 2: Alignment ────────────────────────────────────────────
  if (rom.length % 4 !== 0) {
    stages.push(fail('ALIGN', 'Alignment Check', `Length ${rom.length} is not a multiple of 4.`))
  } else {
    stages.push(pass('ALIGN', 'Alignment Check', 'Length is a multiple of 4'))
  }

  // ── Stage 3: Checksum (ones' complement per Kreeblah/AmigaROMUtil) ─
  // Sum ALL 32-bit big-endian words using ones' complement arithmetic.
  // Per-step carry folding: after each addition, if sum > 0xFFFFFFFF,
  // subtract 0xFFFFFFFF (fold carry back in).
  // A valid ROM's total (including stored checksum) must equal 0xFFFFFFFF.
  const sum = onesComplementSum(view, rom.length)
  // Checksum field is at -24 bytes from end of ROM (per Kreeblah)
  const storedCs = view.getUint32(rom.length - 24, false)
  if (sum === 0xFFFFFFFF) {
    stages.push(pass('CHECKSUM', 'Checksum',
      `0x${storedCs.toString(16).toUpperCase().padStart(8,'0')} – valid (ones' complement verified)`))
  } else {
    stages.push(fail('CHECKSUM', 'Checksum',
      `Ones' complement sum is 0x${sum.toString(16).toUpperCase().padStart(8,'0')}, expected 0xFFFFFFFF. ` +
      `Stored checksum (@-24): 0x${storedCs.toString(16).toUpperCase().padStart(8,'0')}.`))
  }

  // ── Stage 3b: Embedded ROM Size ───────────────────────────────────
  // At -20 bytes from end, a 32-bit word holds the ROM size in bytes
  const embeddedSize = view.getUint32(rom.length - 20, false)
  if (embeddedSize === rom.length) {
    stages.push(pass('ROMSIZE', 'Embedded ROM Size',
      `${embeddedSize} bytes – matches file size`))
  } else {
    stages.push(warn('ROMSIZE', 'Embedded ROM Size',
      `Embedded size ${embeddedSize} bytes ≠ file size ${rom.length} bytes`))
  }

  // ── Stage 4: Entry Point ──────────────────────────────────────────
  let entryFound = false
  if (rom[2] === 0x4E && rom[3] === 0xF9) {
    const entry = view.getUint32(4, false)
    const inRange = entry >= base && entry < base + rom.length
    if (inRange) {
      const typeWord = view.getUint16(0, false)
      stages.push(pass('ENTRY', 'Entry Point',
        `Type $${typeWord.toString(16).toUpperCase()} · JMP @+2 → 0x${entry.toString(16).toUpperCase()} (in ROM range)`))
    } else {
      stages.push(fail('ENTRY', 'Entry Point',
        `JMP target 0x${entry.toString(16).toUpperCase()} is outside ROM range`))
    }
    entryFound = true
  } else if (rom[0] === 0x4E && rom[1] === 0xF9) {
    const entry = view.getUint32(2, false)
    const inRange = entry >= base && entry < base + rom.length
    if (inRange) {
      stages.push(pass('ENTRY', 'Entry Point', `JMP @+0 → 0x${entry.toString(16).toUpperCase()} (in ROM range)`))
    } else {
      stages.push(fail('ENTRY', 'Entry Point',
        `JMP target 0x${entry.toString(16).toUpperCase()} is outside ROM range`))
    }
    entryFound = true
  }

  if (!entryFound) {
    stages.push(fail('ENTRY', 'Entry Point',
      `No JMP ($4EF9) found at offset 0 or 2. Bytes: ${Array.from(rom.slice(0,8)).map(b=>'$'+b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}`))
  }

  // ── Stage 5: RomTag Scan ──────────────────────────────────────────
  const romtags     = []
  const badRomtags  = []

  for (let i = 0; i <= rom.length - 26; i += 2) {
    if (view.getUint16(i, false) !== ROMTAG_MAGIC) continue

    const matchTag = view.getUint32(i + 2, false)
    const expected = base + i
    const endSkip  = view.getUint32(i + 6, false)
    const namePtr  = view.getUint32(i + 14, false)
    const initPtr  = view.getUint32(i + 22, false)

    if (matchTag !== expected) {
      badRomtags.push({ offset: i, reason: `rt_MatchTag 0x${matchTag.toString(16)} ≠ 0x${expected.toString(16)}` })
      continue
    }
    if (endSkip <= expected) {
      badRomtags.push({ offset: i, reason: `rt_EndSkip 0x${endSkip.toString(16)} not ahead of RomTag` })
      continue
    }
    if (endSkip > base + rom.length) {
      badRomtags.push({ offset: i, reason: `rt_EndSkip 0x${endSkip.toString(16)} beyond ROM end` })
      continue
    }

    const nameOff = namePtr - base
    let name = '(unknown)'
    if (nameOff >= 0 && nameOff < rom.length) {
      let end = nameOff
      // Read C-string, limit to 64 bytes to avoid runaway reads
      while (end < rom.length && end < nameOff + 64 && rom[end] !== 0) end++
      name = new TextDecoder('latin1').decode(rom.slice(nameOff, end))
      // Strip non-printable control characters and trim whitespace
      name = name.replace(/[\x00-\x1F\x7F]/g, '').trim()
    }

    romtags.push({ offset: i, address: expected, endSkip, name, namePtr, initPtr })
  }

  if (romtags.length === 0) {
    stages.push(fail('ROMTAGS', 'RomTag Scan', 'No valid RomTags found in ROM image.'))
  } else {
    // Rejected tags with wrong matchTag are normal – just data coincidence.
    // Only warn if there are structural (endSkip) issues.
    const structural = badRomtags.filter(b => !b.reason.includes('rt_MatchTag'))
    const detail = `${romtags.length} valid RomTag(s) found` +
      (badRomtags.length ? ` (${badRomtags.length} false $4AFC pattern(s) in data – normal)` : '')

    if (structural.length > 0) {
      const issues = structural.map(b => `  +0x${b.offset.toString(16)}: ${b.reason}`).join('\n')
      stages.push(warn('ROMTAGS', 'RomTag Scan', detail + '\nStructural issues:\n' + issues))
    } else {
      stages.push(pass('ROMTAGS', 'RomTag Scan', detail))
    }
  }

  // ── Stage 6: Required Modules ─────────────────────────────────────
  const ksVersion  = view.getUint16(0x0C, false)
  // Normalize names for matching (trim, lowercase)
  const foundNames = new Set(romtags.map(t => t.name.trim()))
  const missing    = REQUIRED_MODULES.filter(m => !foundNames.has(m))

  // utility.library only expected in KS 2.0+ (version >= 36)
  const warnedList = [...WARNED_MODULES_ALL]
  if (ksVersion >= 36) warnedList.push(...WARNED_MODULES_V2)
  const missingWarn = warnedList.filter(m => !foundNames.has(m))

  const foundList = romtags.map(t => `${t.name} @${t.offset.toString(16)}`).join(', ')

  if (missing.length > 0) {
    // Provide diagnostic: check for near-matches (corrupt name pointers)
    const diag = missing.map(m => {
      const near = romtags.find(t => t.name.includes(m) || m.includes(t.name.trim()))
      return near
        ? `"${m}" – near-match: "${near.name}" @0x${near.offset.toString(16)} (namePtr=0x${near.namePtr.toString(16)})`
        : `"${m}" – not found`
    })
    stages.push(fail('REQUIRED', 'Required Modules',
      `Missing: ${missing.join(', ')}\nFound (${romtags.length}): ${foundList}\nDiag: ${diag.join('; ')}`))
  } else if (missingWarn.length > 0) {
    stages.push(warn('REQUIRED', 'Required Modules',
      `All critical modules present. Missing (non-fatal): ${missingWarn.join(', ')}\nFound (${romtags.length}): ${foundList}`))
  } else {
    stages.push(pass('REQUIRED', 'Required Modules',
      `All required modules present (${romtags.length} total): ${foundList}`))
  }

  // ── Stage 7: Pointer Sanity ───────────────────────────────────────
  const ptrIssues = []
  for (const tag of romtags) {
    if (tag.initPtr === 0) {
      ptrIssues.push(`"${tag.name}": rt_Init is NULL`)
    } else if (tag.initPtr < base || tag.initPtr >= base + rom.length) {
      ptrIssues.push(`"${tag.name}": rt_Init 0x${tag.initPtr.toString(16)} outside ROM`)
    }
    if (tag.namePtr < base || tag.namePtr >= base + rom.length) {
      ptrIssues.push(`"${tag.name}": rt_Name 0x${tag.namePtr.toString(16)} outside ROM`)
    }
  }
  if (ptrIssues.length > 0) {
    stages.push(fail('POINTERS', 'Pointer Sanity', ptrIssues.join('\n')))
  } else {
    stages.push(pass('POINTERS', 'Pointer Sanity', 'All rt_Init and rt_Name pointers are within ROM address space'))
  }

  // ── Stage 8: Overlap Check ────────────────────────────────────────
  const overlaps = []
  for (let i = 0; i < romtags.length - 1; i++) {
    const a = romtags[i], b = romtags[i + 1]
    if (a.endSkip > b.address) {
      overlaps.push(`"${a.name}" endSkip=0x${a.endSkip.toString(16)} overlaps "${b.name}" at 0x${b.address.toString(16)}`)
    }
  }
  if (overlaps.length > 0) {
    stages.push(fail('OVERLAP', 'Module Overlap', overlaps.join('\n')))
  } else {
    stages.push(pass('OVERLAP', 'Module Overlap', 'No module boundaries overlap'))
  }

  const passed = stages.every(s => s.passed)
  return { stages, passed, romtags }
}
