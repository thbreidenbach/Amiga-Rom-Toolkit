// themes.js – Token definitions for Cyber, Workbench 1.x, and Workbench 3.x themes

// ─── Cyber Theme (default) ─────────────────────────────────────────
export const cyberTheme = {
  name: 'cyber',

  colors: {
    pageBg:          '#0a0a0f',
    cardBg:          '#0d1218',
    cardBgDeep:      '#0a0f14',
    headerBg:        '#0d1218',
    inputBg:         '#0d1218',
    highlightBg:     '#1a1008',

    borderPrimary:   '#223344',
    borderSecondary: '#1a2530',
    borderRow:       '#111a22',

    accent:          '#ff6b00',
    accentDim:       '#ff6b0060',
    accentBg:        '#1a0d00',

    textPrimary:     '#c8d8e8',
    textSecondary:   '#6a8090',
    textDim:         '#445566',
    textVeryDim:     '#334455',

    success:         '#4aaa66',
    error:           '#ff4444',
    errorBg:         '#1a0808',
    errorBorder:     '#ff333344',
    warning:         '#ffaa00',
    warningBg:       '#1a1808',
    warningBorder:   '#ffaa0044',
    warningText:     '#aaaa44',
    warningLabel:    '#666600',
    info:            '#88aaff',

    // Buttons
    btnSaveBg:       '#0d1a1a',  btnSaveBorder:    '#336666',  btnSaveText:    '#88cccc',
    btnReplaceBg:    '#0d1f2d',  btnReplaceBorder: '#335577',  btnReplaceText: '#88bbcc',
    btnInsertBg:     '#0d0d2d',  btnInsertBorder:  '#335577',  btnInsertText:  '#aaaaff',
    btnRemoveBg:     '#1a0d0d',  btnRemoveBorder:  '#553333',  btnRemoveText:  '#cc8888',
    btnUndoBg:       '#1a1a0d',  btnUndoBorder:    '#555533',  btnUndoText:    '#cccc88',
    btnPrimaryBg:    '#112233',  btnPrimaryBorder: '#ff6b00',  btnPrimaryText: '#ff6b00',
    btnExportBg:     '#ff6b00',  btnExportText:    '#000',

    rowReplacedBg:   '#0d1a08',
    rowInsertedBg:   '#0d0d1a',

    kindProlog:      '#ff6b00',
    kindModule:      '#88bbcc',
    kindGap:         '#6a8090',
    kindTrailing:    '#445566',
    kindChecksum:    '#ffaa00',

    replLabel:       '#4a9',
    insertLabel:     '#88aaff',

    hexOffset:       '#ff6b00',
    hexByte:         '#8aaabb',
    hexByteHi:       '#ffaa00',
    hexAscii:        '#445566',
  },

  fonts: {
    display: "'Orbitron', sans-serif",
    mono:    "'Share Tech Mono', monospace",
    body:    "'Exo 2', sans-serif",
  },

  borders: {
    radius: 4,
    bevelLight: null,
    bevelDark:  null,
    bevelWidth: 0,
  },

  special: {
    scrollbarThumb:  '#ff6b00',
    scrollbarTrack:  '#111',
    bgPattern:       null,
    textShadow:      '0 0 40px #ff6b0060',
    bodyClass:       '',
    showKickstartHand: false,
  },
}


// ─── Workbench 1.x Theme ───────────────────────────────────────────
export const wb1Theme = {
  name: 'wb1',

  colors: {
    pageBg:          '#0055AA',
    cardBg:          '#0055AA',
    cardBgDeep:      '#000022',
    headerBg:        '#0055AA',
    inputBg:         '#000022',
    highlightBg:     '#FF8800',

    borderPrimary:   '#FFFFFF',
    borderSecondary: '#000022',
    borderRow:       '#000022',

    accent:          '#FF8800',
    accentDim:       '#FF880066',
    accentBg:        '#FF8800',

    textPrimary:     '#FFFFFF',
    textSecondary:   '#FFFFFF',
    textDim:         '#FFFFFF',
    textVeryDim:     '#000022',

    success:         '#FFFFFF',
    error:           '#FF8800',
    errorBg:         '#000022',
    errorBorder:     '#FF8800',
    warning:         '#FF8800',
    warningBg:       '#000022',
    warningBorder:   '#FF8800',
    warningText:     '#FF8800',
    warningLabel:    '#FF8800',
    info:            '#FFFFFF',

    btnSaveBg:       '#0055AA',  btnSaveBorder:    '#FFFFFF',  btnSaveText:    '#FFFFFF',
    btnReplaceBg:    '#0055AA',  btnReplaceBorder: '#FFFFFF',  btnReplaceText: '#FFFFFF',
    btnInsertBg:     '#0055AA',  btnInsertBorder:  '#FFFFFF',  btnInsertText:  '#FFFFFF',
    btnRemoveBg:     '#000022',  btnRemoveBorder:  '#FF8800',  btnRemoveText:  '#FF8800',
    btnUndoBg:       '#0055AA',  btnUndoBorder:    '#FF8800',  btnUndoText:    '#FF8800',
    btnPrimaryBg:    '#FF8800',  btnPrimaryBorder: '#FFFFFF',  btnPrimaryText: '#000022',
    btnExportBg:     '#FF8800',  btnExportText:    '#000022',

    rowReplacedBg:   '#003388',
    rowInsertedBg:   '#003366',

    kindProlog:      '#FF8800',
    kindModule:      '#FFFFFF',
    kindGap:         '#000022',
    kindTrailing:    '#000022',
    kindChecksum:    '#FF8800',

    replLabel:       '#FF8800',
    insertLabel:     '#FFFFFF',

    hexOffset:       '#FF8800',
    hexByte:         '#FFFFFF',
    hexByteHi:       '#FF8800',
    hexAscii:        '#000022',
  },

  fonts: {
    display: "'Topaz a500a1000a2000', 'Courier New', monospace",
    mono:    "'Topaz a500a1000a2000', 'Courier New', monospace",
    body:    "'Topaz a500a1000a2000', 'Courier New', monospace",
  },

  borders: {
    radius: 0,
    bevelLight: '#FFFFFF',
    bevelDark:  '#000022',
    bevelWidth: 2,
  },

  special: {
    scrollbarThumb:  '#FF8800',
    scrollbarTrack:  '#000022',
    bgPattern:       'repeating-linear-gradient(0deg, #0055AA 0px, #0055AA 1px, #004499 1px, #004499 2px)',
    textShadow:      'none',
    bodyClass:       'theme-wb1',
    showKickstartHand: true,
  },
}


// ─── Workbench 3.x Theme ───────────────────────────────────────────
export const wb3Theme = {
  name: 'wb3',

  colors: {
    pageBg:          '#AAAAAA',
    cardBg:          '#AAAAAA',
    cardBgDeep:      '#888888',
    headerBg:        '#AAAAAA',
    inputBg:         '#888888',
    highlightBg:     '#6688BB',

    borderPrimary:   '#000000',
    borderSecondary: '#000000',
    borderRow:       '#000000',

    accent:          '#6688BB',
    accentDim:       '#6688BB88',
    accentBg:        '#6688BB',

    textPrimary:     '#000000',
    textSecondary:   '#000000',
    textDim:         '#444444',
    textVeryDim:     '#666666',

    success:         '#000000',
    error:           '#FF0000',
    errorBg:         '#FFAAAA',
    errorBorder:     '#FF0000',
    warning:         '#FF8800',
    warningBg:       '#FFDDAA',
    warningBorder:   '#FF8800',
    warningText:     '#884400',
    warningLabel:    '#884400',
    info:            '#6688BB',

    btnSaveBg:       '#AAAAAA',  btnSaveBorder:    '#000000',  btnSaveText:    '#000000',
    btnReplaceBg:    '#AAAAAA',  btnReplaceBorder: '#000000',  btnReplaceText: '#000000',
    btnInsertBg:     '#AAAAAA',  btnInsertBorder:  '#000000',  btnInsertText:  '#000000',
    btnRemoveBg:     '#AAAAAA',  btnRemoveBorder:  '#FF0000',  btnRemoveText:  '#FF0000',
    btnUndoBg:       '#AAAAAA',  btnUndoBorder:    '#000000',  btnUndoText:    '#000000',
    btnPrimaryBg:    '#6688BB',  btnPrimaryBorder: '#FFFFFF',  btnPrimaryText: '#FFFFFF',
    btnExportBg:     '#6688BB',  btnExportText:    '#FFFFFF',

    rowReplacedBg:   '#99BB99',
    rowInsertedBg:   '#9999BB',

    kindProlog:      '#6688BB',
    kindModule:      '#000000',
    kindGap:         '#666666',
    kindTrailing:    '#888888',
    kindChecksum:    '#FF8800',

    replLabel:       '#006600',
    insertLabel:     '#6688BB',

    hexOffset:       '#6688BB',
    hexByte:         '#000000',
    hexByteHi:       '#FF8800',
    hexAscii:        '#666666',
  },

  fonts: {
    display: "'Topaz a600a1200a4000', 'Topaz a500a1000a2000', 'Courier New', monospace",
    mono:    "'Topaz a600a1200a4000', 'Topaz a500a1000a2000', 'Courier New', monospace",
    body:    "'Topaz a600a1200a4000', 'Topaz a500a1000a2000', 'Courier New', monospace",
  },

  borders: {
    radius: 0,
    bevelLight: '#FFFFFF',
    bevelDark:  '#000000',
    bevelWidth: 2,
  },

  special: {
    scrollbarThumb:  '#6688BB',
    scrollbarTrack:  '#888888',
    bgPattern:       'repeating-linear-gradient(0deg, #AAAAAA 0px, #AAAAAA 1px, #999999 1px, #999999 2px)',
    textShadow:      'none',
    bodyClass:       'theme-wb3',
    showKickstartHand: true,
  },
}


// ─── Theme map ──────────────────────────────────────────────────────
export const themes = {
  cyber: cyberTheme,
  wb1:   wb1Theme,
  wb3:   wb3Theme,
}

export const themeOrder = ['cyber', 'wb1', 'wb3']
export const themeLabels = { cyber: 'CYBER', wb1: 'WB 1.x', wb3: 'WB 3.x' }
