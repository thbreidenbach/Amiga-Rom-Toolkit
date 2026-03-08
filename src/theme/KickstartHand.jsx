// KickstartHand.jsx – SVG recreation of the Kickstart "insert disk" hand
//
// Simplified pixel-art-style rendition of the iconic hand holding a
// floppy disk from the Amiga Kickstart boot screen.

import React from 'react'

export function KickstartHand({ width = 240, height = 200, style = {} }) {
  return (
    <svg
      viewBox="0 0 120 100"
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background: Kickstart purple/magenta */}
      <rect width="120" height="100" fill="#880088" rx="0" />

      {/* Floppy disk body */}
      <rect x="20" y="30" width="44" height="46" fill="#AAAAAA" />
      {/* Floppy metal shutter */}
      <rect x="28" y="30" width="24" height="12" fill="#DDDDDD" />
      <rect x="36" y="30" width="8" height="12" fill="#666666" />
      {/* Floppy label */}
      <rect x="24" y="50" width="36" height="18" fill="#FFFFFF" />
      <rect x="26" y="53" width="32" height="2" fill="#888888" />
      <rect x="26" y="57" width="28" height="2" fill="#888888" />
      <rect x="26" y="61" width="24" height="2" fill="#888888" />
      {/* Floppy notch (bottom right) */}
      <rect x="54" y="68" width="6" height="8" fill="#888888" />

      {/* Hand - simplified blocky pixel art style */}
      {/* Wrist coming from right */}
      <rect x="80" y="42" width="40" height="16" fill="#FFaa77" />
      {/* Palm */}
      <rect x="60" y="38" width="24" height="24" fill="#FFaa77" />
      {/* Thumb (top, gripping disk) */}
      <rect x="54" y="32" width="14" height="8" fill="#FFaa77" />
      <rect x="54" y="30" width="10" height="6" fill="#FF9966" />
      {/* Fingers (bottom, gripping disk) */}
      <rect x="50" y="60" width="18" height="7" fill="#FFaa77" />
      <rect x="46" y="64" width="22" height="5" fill="#FF9966" />
      {/* Fingertips wrapping under disk */}
      <rect x="42" y="67" width="10" height="5" fill="#FFaa77" />

      {/* Arrow pointing down (insert direction) */}
      <rect x="38" y="82" width="4" height="10" fill="#FFFFFF" />
      <polygon points="32,88 48,88 40,96" fill="#FFFFFF" />

      {/* "Insert" text hint */}
      <text x="60" y="94" fill="#FFFFFF" fontSize="6"
            fontFamily="monospace" textAnchor="middle" opacity="0.7">
        INSERT
      </text>
    </svg>
  )
}
