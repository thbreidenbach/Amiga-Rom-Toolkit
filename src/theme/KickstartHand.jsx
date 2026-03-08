// KickstartHand.jsx – SVG boot screen backgrounds for Workbench themes
//
// Kickstart13Hand  – the classic 1.3 "hand inserting floppy" silhouette
// Kickstart20Boot  – the 2.0+ purple boot screen with rainbow checkmark & drive

import React from 'react'

/* ────────────────────────────────────────────────────────────
 * KICKSTART 1.3 – Hand holding a 3.5" floppy disk
 * Reference: white hand with black outlines, purple floppy,
 *            metal shutter, label area, "V 1.3" below
 * ──────────────────────────────────────────────────────────── */
export function Kickstart13Hand({ width = 300, height = 400, style = {} }) {
  return (
    <svg
      viewBox="0 0 300 400"
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={{ imageRendering: 'auto', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Floppy disk – purple/blue body */}
      <g transform="translate(70, 20)">
        {/* Disk body */}
        <rect x="0" y="0" width="160" height="170" rx="4" fill="#7070CC"
              stroke="#222" strokeWidth="3" />
        {/* Metal shutter housing */}
        <rect x="40" y="0" width="80" height="36" rx="2" fill="#BBBBCC"
              stroke="#444" strokeWidth="2" />
        {/* Shutter slot */}
        <rect x="68" y="4" width="24" height="28" rx="1" fill="#555566" />
        {/* Shutter slide */}
        <rect x="56" y="2" width="10" height="32" rx="1" fill="#CCCCDD" />
        {/* Label area */}
        <rect x="16" y="56" width="128" height="76" rx="2" fill="#EEEEF4"
              stroke="#888" strokeWidth="1" />
        {/* Label text lines (stylized) */}
        <text x="80" y="80" fill="#4444AA" fontSize="14"
              fontFamily="monospace" textAnchor="middle" fontWeight="bold"
              transform="rotate(180, 80, 86)">AMIGA</text>
        <text x="80" y="100" fill="#4444AA" fontSize="10"
              fontFamily="monospace" textAnchor="middle"
              transform="rotate(180, 80, 94)">Workbench</text>
        {/* HD notch bottom-right */}
        <rect x="136" y="148" width="16" height="18" rx="1" fill="#888899" />
      </g>

      {/* Hand – coming from bottom-left, gripping the disk */}
      <g stroke="#222" strokeWidth="2.5" fill="#FFFFFF" strokeLinejoin="round">
        {/* Wrist / forearm from lower-left */}
        <path d="M 0,360 L 60,310 L 100,290 L 120,270 L 120,230
                 Q 120,220 130,215 L 145,210
                 L 145,185 L 230,185 L 230,200
                 L 150,200 L 150,220
                 Q 145,225 135,228 L 125,232 L 125,270
                 L 115,290 L 70,320 L 10,370 L 0,380 Z" />
        {/* Thumb – gripping top of disk from right side */}
        <path d="M 220,185 L 232,170 Q 240,155 238,145
                 L 232,130 L 226,125 L 218,130 L 216,140
                 Q 215,155 220,165 L 218,185 Z" />
        {/* Index finger – curling under disk */}
        <path d="M 145,185 L 140,178 Q 130,168 120,172
                 L 108,180 L 100,186 Q 95,192 100,196
                 L 115,194 L 130,190 L 145,190 Z" />
        {/* Middle finger */}
        <path d="M 100,196 L 90,200 Q 78,206 80,214
                 L 88,216 L 100,210 L 115,200 L 115,194 Z" />
        {/* Ring + pinky curl */}
        <path d="M 88,216 L 82,224 Q 78,234 84,240
                 L 94,238 L 104,228 L 110,216 L 112,206 L 100,210 Z" />
      </g>

      {/* V 1.3 text */}
      <text x="150" y="370" fill="#222222" fontSize="32"
            fontFamily="'Topaz a500a1000a2000', monospace"
            textAnchor="middle" fontWeight="bold">V 1.3</text>
    </svg>
  )
}


/* ────────────────────────────────────────────────────────────
 * KICKSTART 2.0+ – Purple boot screen with rainbow checkmark
 * Reference: dark purple bg, big rainbow checkmark (Amiga logo),
 *            floppy drive on the right, version text bottom-left
 * ──────────────────────────────────────────────────────────── */
export function Kickstart20Boot({ width = 480, height = 384, style = {} }) {
  return (
    <svg
      viewBox="0 0 640 512"
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={{ imageRendering: 'auto', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Purple background */}
      <rect width="640" height="512" fill="#440055" />

      {/* Rainbow checkmark – the iconic Amiga boot logo */}
      {/* Built from 4 colored parallelogram stripes forming a check shape */}
      <g transform="translate(80, 100)">
        {/* The checkmark goes down-left then up-right at a steep angle */}
        {/* Red stripe (topmost) */}
        <polygon points="180,0 200,0 100,200 40,120 60,120 100,180"
                 fill="#DD0000" />
        {/* Orange stripe */}
        <polygon points="200,0 220,0 120,200 60,120 80,120 120,180"
                 fill="#EE7700" />
        {/* Yellow stripe */}
        <polygon points="220,0 240,0 140,200 80,120 100,120 140,180"
                 fill="#EECC00" />
        {/* Green stripe */}
        <polygon points="240,0 260,0 160,200 100,120 120,120 160,180"
                 fill="#00AA00" />
      </g>

      {/* Floppy disk drive – right side */}
      <g transform="translate(400, 160)">
        {/* Drive housing */}
        <rect x="0" y="0" width="160" height="180" rx="6" fill="#CC9966"
              stroke="#886644" strokeWidth="3" />
        {/* Drive front face */}
        <rect x="10" y="20" width="140" height="140" rx="3" fill="#BBAA88"
              stroke="#887755" strokeWidth="2" />
        {/* Disk slot */}
        <rect x="20" y="30" width="120" height="8" rx="1" fill="#332211" />
        {/* Eject button */}
        <rect x="55" y="44" width="50" height="10" rx="2" fill="#AA9977"
              stroke="#776644" strokeWidth="1" />
        {/* Drive activity LED */}
        <rect x="125" y="46" width="8" height="6" rx="1" fill="#225522" />

        {/* Floppy disk partially inserted */}
        <g transform="translate(24, 52)">
          {/* Disk body */}
          <rect x="0" y="0" width="112" height="100" rx="2" fill="#2244AA"
                stroke="#112266" strokeWidth="2" />
          {/* Metal shutter */}
          <rect x="30" y="0" width="52" height="22" rx="1" fill="#AAAABB"
                stroke="#666" strokeWidth="1" />
          <rect x="48" y="2" width="16" height="18" rx="1" fill="#444455" />
          {/* Label */}
          <rect x="10" y="32" width="92" height="50" rx="1" fill="#DDDDEE" />
          <rect x="16" y="40" width="70" height="3" fill="#8888AA" />
          <rect x="16" y="48" width="60" height="3" fill="#8888AA" />
          <rect x="16" y="56" width="50" height="3" fill="#8888AA" />
          {/* Corner notch */}
          <rect x="92" y="80" width="14" height="16" rx="1" fill="#6666AA" />
        </g>
      </g>

      {/* Version text – bottom left */}
      <g fontFamily="'Topaz a600a1200a4000', 'Topaz a500a1000a2000', monospace"
         fontSize="20" fill="#CC9966">
        <text x="60" y="380">2.0 Roms (37.300)</text>
        <text x="60" y="410">Copyright &#xA9; 1985-1991</text>
        <text x="60" y="440">Commodore-Amiga, Inc.</text>
        <text x="60" y="470">All Rights Reserved</text>
      </g>
    </svg>
  )
}


/* ────────────────────────────────────────────────────────────
 * Legacy default export – picks the right variant by theme name
 * ──────────────────────────────────────────────────────────── */
export function KickstartHand({ themeName = 'wb1', ...props }) {
  if (themeName === 'wb3') return <Kickstart20Boot {...props} />
  return <Kickstart13Hand {...props} />
}
