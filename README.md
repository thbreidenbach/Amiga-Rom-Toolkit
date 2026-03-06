# Amiga ROM Toolkit

A browser-based tool for analysing, patching, and validating Amiga Kickstart ROM images.

## Features

- **ROM Parser** – Detects ROM size, base address, entry point, version/revision
- **RomTag Scanner** – Finds all Resident modules via `$4AFC` magic + self-reference validation
- **Module Editor** – Replace or remove individual modules; optional same-size padding
- **ROM Assembler** – Rebuilds a complete ROM with corrected RomTag pointers and checksum
- **Validator** – 8-stage validation pipeline (size, alignment, checksum, entry point, RomTags, required modules, pointer sanity, overlap check)
- **Export** – Download the assembled `.rom` file; export is gated behind a passing validator

## Supported ROMs

| Kickstart | Size | Base Address |
|-----------|------|--------------|
| 1.2 / 1.3 | 256 KB | `$FC0000` |
| 2.x / 3.x / 3.2 | 512 KB | `$F80000` |

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Architecture

```
src/
├── engine/
│   ├── RomParser.js       # ArrayBuffer → ROM descriptor
│   ├── RomTagScanner.js   # Resident structure scanner
│   ├── RomPatcher.js      # Pointer patching + checksum
│   ├── RomAssembler.js    # Module list → ROM binary
│   └── RomValidator.js    # 8-stage validation pipeline
├── hooks/
│   └── useRomToolkit.js   # Central application state
└── components/
    ├── FileLoader.jsx      # Drop zone
    ├── RomOverview.jsx     # Header metadata display
    ├── ModuleList.jsx      # RomTag table with actions
    ├── AssemblerView.jsx   # Layout preview + build trigger
    └── ValidatorPanel.jsx  # Stage-by-stage validation display
```

## Validator Stages

| # | Stage | Description |
|---|-------|-------------|
| 1 | Size Check | Must be exactly 256 KB or 512 KB |
| 2 | Alignment | Length must be a multiple of 4 |
| 3 | Checksum | Sum of all 32-bit words must equal `0xFFFFFFFF` |
| 4 | Entry Point | Byte 0/1 must be `4E F9` (JMP); target within ROM |
| 5 | RomTag Scan | Each `$4AFC` candidate validated via `rt_MatchTag` self-reference |
| 6 | Required Modules | exec, dos, graphics, intuition, expansion must be present |
| 7 | Pointer Sanity | `rt_Init` and `rt_Name` must point within ROM address space |
| 8 | Overlap Check | No two module boundaries may overlap |

## Checksum Algorithm

```
1. Zero the last 4 bytes (checksum slot)
2. Sum all 32-bit big-endian longwords (mod 2³²)
3. checksum = (0x1_0000_0000 - sum) & 0xFFFFFFFF
4. Write checksum into last 4 bytes
→ Verification: sum of all longs including checksum == 0xFFFFFFFF
```

## Important Notes

- **Internal pointer relocation**: Only the 6 RomTag header fields are patched when a module moves.
  Code-internal absolute pointers within module bodies are not adjusted.
  **Use same-size padding** (checkbox in Module Editor) to avoid this entirely.
- The assembler fills unused ROM space with `0x00`.
- Export is only enabled when the assembled ROM passes all validation stages without errors.

## License

MIT
