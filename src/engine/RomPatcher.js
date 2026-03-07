// RomPatcher.js – Patches RomTag pointers and ROM checksum

/**
 * Patch all absolute pointers inside a RomTag header when a module
 * is relocated by `delta` bytes.
 *
 * Only the six fields that are defined by the Resident structure spec
 * are touched.  Internal code pointers inside the module body are NOT
 * adjusted – that would require a full relocation table which Amiga
 * ROM modules generally do not carry.  Padding with zeros (same-size
 * replacement) avoids this problem entirely.
 *
 * @param {Uint8Array} moduleData  Raw bytes of the module (starts at RomTag)
 * @param {number} delta           new_address - original_address
 * @returns {Uint8Array}           Patched copy
 */
export function patchRomTag(moduleData, delta) {
  if (delta === 0) return moduleData
  const data = moduleData.slice()
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)

  const patch32 = (offset) => {
    const old = view.getUint32(offset, false)
    view.setUint32(offset, (old + delta) >>> 0, false)
  }

  patch32(2)   // rt_MatchTag  → MUST point to itself
  patch32(6)   // rt_EndSkip   → end of module
  patch32(14)  // rt_Name      → name string pointer
  patch32(18)  // rt_IdString  → id string pointer
  patch32(22)  // rt_Init      → init function/table pointer

  return data
}

/**
 * Patch the JMP entry-point address in the ROM prolog.
 *
 * Standard Amiga ROM layout:
 *   Offset 0: type word ($1111/$1114)
 *   Offset 2: $4EF9 (JMP)
 *   Offset 4: entry address (4 bytes)
 *
 * Some ROMs have JMP directly at offset 0:
 *   Offset 0: $4EF9 (JMP)
 *   Offset 2: entry address (4 bytes)
 *
 * @param {Uint8Array} prolog
 * @param {number} newEntry  New absolute Amiga address for the JMP target
 * @returns {Uint8Array}
 */
export function patchProlog(prolog, newEntry) {
  const data = prolog.slice()
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  if (data.length >= 8 && data[2] === 0x4E && data[3] === 0xF9) {
    // Standard: type word at 0, JMP at 2, target at 4
    view.setUint32(4, newEntry >>> 0, false)
  } else if (data.length >= 6 && data[0] === 0x4E && data[1] === 0xF9) {
    // Legacy: JMP at 0, target at 2
    view.setUint32(2, newEntry >>> 0, false)
  }
  return data
}

/**
 * Compute and insert the Kickstart ROM checksum.
 *
 * Algorithm (Amiga ones' complement checksum):
 *   1. Zero the checksum field (24 bytes from end of ROM).
 *   2. Sum all 32-bit big-endian longwords using ones' complement
 *      addition (accumulate, then fold carries back into the sum).
 *   3. checksum = bitwise NOT of the sum (~sum)
 *   4. Write checksum at -24 bytes from end.
 *   Result: ones' complement sum of all longs == 0xFFFFFFFF
 *
 * Reference: Kreeblah/AmigaROMUtil CalculateAmigaROMChecksum()
 *
 * @param {Uint8Array} rom  Complete ROM image (must be multiple of 4)
 * @returns {Uint8Array}    ROM with valid checksum
 */
export function fixChecksum(rom) {
  if (rom.length % 4 !== 0) throw new Error('ROM length not a multiple of 4')
  const data = rom.slice()
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const csOffset = data.length - 24  // Checksum is 24 bytes from end

  // Step 1: zero the checksum slot
  view.setUint32(csOffset, 0, false)

  // Step 2: sum all longs using ones' complement addition
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += view.getUint32(i, false)
  }
  // Fold carries back into sum (ones' complement)
  while (sum > 0xFFFFFFFF) {
    sum = (sum % 0x100000000) + Math.floor(sum / 0x100000000)
  }

  // Step 3: one's complement (sum + ~sum === 0xFFFFFFFF)
  const checksum = (~sum) >>> 0

  // Step 4: write
  view.setUint32(csOffset, checksum, false)

  // Verify: ones' complement sum of all words must be 0xFFFFFFFF
  let verify = 0
  for (let i = 0; i < data.length; i += 4) {
    verify += view.getUint32(i, false)
  }
  while (verify > 0xFFFFFFFF) {
    verify = (verify % 0x100000000) + Math.floor(verify / 0x100000000)
  }
  if (verify !== 0xFFFFFFFF) throw new Error(`Checksum verification failed: got 0x${verify.toString(16)}`)

  return data
}

/**
 * Pad a Uint8Array to targetSize with fill byte (default 0x00).
 * Throws if the data is already larger than targetSize.
 */
export function padToSize(data, targetSize, fill = 0x00) {
  if (data.length > targetSize) {
    throw new Error(`Module too large: ${data.length} > ${targetSize} bytes`)
  }
  if (data.length === targetSize) return data
  const padded = new Uint8Array(targetSize)
  padded.fill(fill)
  padded.set(data)
  return padded
}
