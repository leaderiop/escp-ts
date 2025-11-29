/**
 * Character Set and Font Handling
 * Provides character width tables and encoding support
 */

import { CHAR_TABLE, INTERNATIONAL_CHARSET, TYPEFACE } from '../core/constants';
import type { CharacterTable, InternationalCharset, Typeface } from '../core/types';

/**
 * Character width for proportional fonts (relative units)
 * Based on standard ESC/P2 proportional width tables
 * Width is in 1/360 inch units at 10.5 point
 */
export const PROPORTIONAL_WIDTHS: Record<number, number> = {
  // Control characters (no width)
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 0,
  16: 0,
  17: 0,
  18: 0,
  19: 0,
  20: 0,
  21: 0,
  22: 0,
  23: 0,
  24: 0,
  25: 0,
  26: 0,
  27: 0,
  28: 0,
  29: 0,
  30: 0,
  31: 0,

  // Printable ASCII
  32: 12, // Space
  33: 12, // !
  34: 15, // "
  35: 24, // #
  36: 24, // $
  37: 36, // %
  38: 27, // &
  39: 9, // '
  40: 15, // (
  41: 15, // )
  42: 18, // *
  43: 24, // +
  44: 12, // ,
  45: 15, // -
  46: 12, // .
  47: 18, // /
  48: 24, // 0
  49: 24, // 1
  50: 24, // 2
  51: 24, // 3
  52: 24, // 4
  53: 24, // 5
  54: 24, // 6
  55: 24, // 7
  56: 24, // 8
  57: 24, // 9
  58: 12, // :
  59: 12, // ;
  60: 24, // <
  61: 24, // =
  62: 24, // >
  63: 21, // ?
  64: 36, // @
  65: 27, // A
  66: 27, // B
  67: 27, // C
  68: 27, // D
  69: 24, // E
  70: 24, // F
  71: 30, // G
  72: 27, // H
  73: 12, // I
  74: 21, // J
  75: 27, // K
  76: 24, // L
  77: 33, // M
  78: 27, // N
  79: 30, // O
  80: 24, // P
  81: 30, // Q
  82: 27, // R
  83: 24, // S
  84: 24, // T
  85: 27, // U
  86: 27, // V
  87: 36, // W
  88: 27, // X
  89: 27, // Y
  90: 24, // Z
  91: 15, // [
  92: 18, // \
  93: 15, // ]
  94: 21, // ^
  95: 24, // _
  96: 12, // `
  97: 24, // a
  98: 24, // b
  99: 21, // c
  100: 24, // d
  101: 24, // e
  102: 15, // f
  103: 24, // g
  104: 24, // h
  105: 12, // i
  106: 12, // j
  107: 24, // k
  108: 12, // l
  109: 36, // m
  110: 24, // n
  111: 24, // o
  112: 24, // p
  113: 24, // q
  114: 18, // r
  115: 21, // s
  116: 15, // t
  117: 24, // u
  118: 24, // v
  119: 33, // w
  120: 24, // x
  121: 24, // y
  122: 21, // z
  123: 18, // {
  124: 12, // |
  125: 18, // }
  126: 24, // ~
  127: 24, // DEL (block character)
};

// Fill remaining extended ASCII with default width
for (let i = 128; i < 256; i++) {
  if (!(i in PROPORTIONAL_WIDTHS)) {
    PROPORTIONAL_WIDTHS[i] = 24; // Default width
  }
}

/**
 * International character set replacements
 * Maps ASCII characters to their international variants
 */
export const INTERNATIONAL_CHAR_MAPS: Record<number, Record<number, number>> = {
  [INTERNATIONAL_CHARSET.USA]: {
    // No replacements for USA (default)
  },
  [INTERNATIONAL_CHARSET.FRANCE]: {
    35: 0xa3, // # -> £
    64: 0xe0, // @ -> à
    91: 0xb0, // [ -> °
    92: 0xe7, // \ -> ç
    93: 0xa7, // ] -> §
    94: 0x5e, // ^ -> ^
    96: 0x60, // ` -> `
    123: 0xe9, // { -> é
    124: 0xf9, // | -> ù
    125: 0xe8, // } -> è
    126: 0xa8, // ~ -> ¨
  },
  [INTERNATIONAL_CHARSET.GERMANY]: {
    64: 0xa7, // @ -> §
    91: 0xc4, // [ -> Ä
    92: 0xd6, // \ -> Ö
    93: 0xdc, // ] -> Ü
    94: 0x5e, // ^ -> ^
    96: 0x60, // ` -> `
    123: 0xe4, // { -> ä
    124: 0xf6, // | -> ö
    125: 0xfc, // } -> ü
    126: 0xdf, // ~ -> ß
  },
  [INTERNATIONAL_CHARSET.UK]: {
    35: 0xa3, // # -> £
  },
  [INTERNATIONAL_CHARSET.DENMARK_I]: {
    91: 0xc6, // [ -> Æ
    92: 0xd8, // \ -> Ø
    93: 0xc5, // ] -> Å
    123: 0xe6, // { -> æ
    124: 0xf8, // | -> ø
    125: 0xe5, // } -> å
  },
  [INTERNATIONAL_CHARSET.SWEDEN]: {
    64: 0xc9, // @ -> É
    91: 0xc4, // [ -> Ä
    92: 0xd6, // \ -> Ö
    93: 0xc5, // ] -> Å
    94: 0xdc, // ^ -> Ü
    96: 0xe9, // ` -> é
    123: 0xe4, // { -> ä
    124: 0xf6, // | -> ö
    125: 0xe5, // } -> å
    126: 0xfc, // ~ -> ü
  },
  [INTERNATIONAL_CHARSET.ITALY]: {
    35: 0xa3, // # -> £
    64: 0xa7, // @ -> §
    91: 0xb0, // [ -> °
    92: 0xe7, // \ -> ç
    93: 0xe9, // ] -> é
    96: 0xf9, // ` -> ù
    123: 0xe0, // { -> à
    124: 0xf2, // | -> ò
    125: 0xe8, // } -> è
    126: 0xec, // ~ -> ì
  },
  [INTERNATIONAL_CHARSET.SPAIN_I]: {
    35: 0xa3, // # -> £
    64: 0xa7, // @ -> §
    91: 0xa1, // [ -> ¡
    92: 0xd1, // \ -> Ñ
    93: 0xbf, // ] -> ¿
    123: 0xb0, // { -> °
    124: 0xf1, // | -> ñ
    125: 0xe7, // } -> ç
  },
  [INTERNATIONAL_CHARSET.JAPAN]: {
    91: 0xa5, // [ -> ¥
    92: 0x5c, // \ -> \
    125: 0x7e, // } -> ~
    126: 0xaf, // ~ -> ¯
  },
  [INTERNATIONAL_CHARSET.NORWAY]: {
    91: 0xc6, // [ -> Æ
    92: 0xd8, // \ -> Ø
    93: 0xc5, // ] -> Å
    123: 0xe6, // { -> æ
    124: 0xf8, // | -> ø
    125: 0xe5, // } -> å
  },
  [INTERNATIONAL_CHARSET.DENMARK_II]: {
    91: 0xc6, // [ -> Æ
    92: 0xd8, // \ -> Ø
    93: 0xc5, // ] -> Å
    123: 0xe6, // { -> æ
    124: 0xf8, // | -> ø
    125: 0xe5, // } -> å
  },
  [INTERNATIONAL_CHARSET.SPAIN_II]: {
    35: 0x23, // # -> #
    64: 0xa1, // @ -> ¡
    91: 0xbf, // [ -> ¿
    92: 0xd1, // \ -> Ñ
    123: 0xa8, // { -> ¨
    124: 0xf1, // | -> ñ
  },
  [INTERNATIONAL_CHARSET.LATIN_AMERICA]: {
    35: 0x23, // # -> #
    64: 0xa1, // @ -> ¡
    91: 0xbf, // [ -> ¿
    92: 0xd1, // \ -> Ñ
    123: 0xa8, // { -> ¨
    124: 0xf1, // | -> ñ
    125: 0xa8, // } -> ¨
    126: 0xbf, // ~ -> ¿
  },
};

/**
 * Get character width in proportional mode
 * @param charCode Character code (0-255)
 * @returns Width in 1/360 inch units
 */
export function getProportionalWidth(charCode: number): number {
  return PROPORTIONAL_WIDTHS[charCode & 0xff] ?? 24;
}

/**
 * Get character width based on font settings
 * @param charCode Character code
 * @param cpi Characters per inch (for fixed-width)
 * @param proportional Use proportional spacing
 * @param condensed Condensed mode
 * @param doubleWidth Double width mode
 */
export function getCharacterWidth(
  charCode: number,
  cpi: number,
  proportional: boolean,
  condensed: boolean,
  doubleWidth: boolean
): number {
  let width: number;

  if (proportional) {
    width = getProportionalWidth(charCode);
  } else {
    // Fixed width: 360 / CPI dots per character
    width = Math.round(360 / cpi);

    // Condensed reduces width by ~60%
    if (condensed) {
      width = Math.round(width * 0.6);
    }
  }

  // Double width doubles the character width
  if (doubleWidth) {
    width *= 2;
  }

  return width;
}

/**
 * Apply international character set mapping
 * @param charCode Original character code
 * @param charset International character set ID
 * @returns Mapped character code
 */
export function mapInternationalChar(charCode: number, charset: InternationalCharset): number {
  const charMap = INTERNATIONAL_CHAR_MAPS[charset];
  if (charMap && charCode in charMap) {
    return charMap[charCode] ?? charCode;
  }
  return charCode;
}

/**
 * Unicode to CP437 mapping for box-drawing characters
 * Maps Unicode code points (U+2500 range) to CP437 byte values
 */
const UNICODE_TO_CP437: Record<number, number> = {
  // Single line
  0x2500: 0xc4, // ─ horizontal
  0x2502: 0xb3, // │ vertical
  0x250c: 0xda, // ┌ top-left
  0x2510: 0xbf, // ┐ top-right
  0x2514: 0xc0, // └ bottom-left
  0x2518: 0xd9, // ┘ bottom-right
  0x251c: 0xc3, // ├ left T
  0x2524: 0xb4, // ┤ right T
  0x252c: 0xc2, // ┬ top T
  0x2534: 0xc1, // ┴ bottom T
  0x253c: 0xc5, // ┼ cross

  // Double line
  0x2550: 0xcd, // ═ double horizontal
  0x2551: 0xba, // ║ double vertical
  0x2554: 0xc9, // ╔ double top-left
  0x2557: 0xbb, // ╗ double top-right
  0x255a: 0xc8, // ╚ double bottom-left
  0x255d: 0xbc, // ╝ double bottom-right
  0x2560: 0xcc, // ╠ double left T
  0x2563: 0xb9, // ╣ double right T
  0x2566: 0xcb, // ╦ double top T
  0x2569: 0xca, // ╩ double bottom T
  0x256c: 0xce, // ╬ double cross
};

/**
 * Encode string to bytes with character set handling
 * @param text Input text
 * @param charset International character set
 * @param charTable Character table (code page)
 */
export function encodeText(
  text: string,
  charset: InternationalCharset = INTERNATIONAL_CHARSET.USA as InternationalCharset,
  _charTable: CharacterTable = CHAR_TABLE.PC437_USA as CharacterTable
): Uint8Array {
  const result = new Uint8Array(text.length);

  for (let i = 0; i < text.length; i++) {
    let charCode = text.charCodeAt(i);

    // Check for Unicode box-drawing characters and map to CP437
    const cp437Code = UNICODE_TO_CP437[charCode];
    if (cp437Code !== undefined) {
      result[i] = cp437Code;
      continue;
    }

    // Handle basic ASCII range
    if (charCode < 128) {
      charCode = mapInternationalChar(charCode, charset);
    }

    // Clamp to byte range
    result[i] = charCode & 0xff;
  }

  return result;
}

/**
 * Calculate total width of a text string
 * @param text Text string
 * @param cpi Characters per inch
 * @param proportional Use proportional spacing
 * @param condensed Condensed mode
 * @param doubleWidth Double width mode
 * @param interCharSpace Additional space between characters
 */
export function calculateTextWidth(
  text: string,
  cpi: number,
  proportional: boolean,
  condensed: boolean,
  doubleWidth: boolean,
  interCharSpace = 0
): number {
  let totalWidth = 0;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    totalWidth += getCharacterWidth(charCode, cpi, proportional, condensed, doubleWidth);
    totalWidth += interCharSpace;
  }

  // Remove last interCharSpace (not added after last character)
  if (text.length > 0) {
    totalWidth -= interCharSpace;
  }

  return totalWidth;
}

/**
 * Word wrap text to fit within specified width
 * @param text Text to wrap
 * @param maxWidth Maximum width in dots
 * @param cpi Characters per inch
 * @param proportional Use proportional spacing
 * @param condensed Condensed mode
 * @param doubleWidth Double width mode
 * @param interCharSpace Additional space between characters
 */
export function wordWrap(
  text: string,
  maxWidth: number,
  cpi: number,
  proportional: boolean,
  condensed: boolean,
  doubleWidth: boolean,
  interCharSpace = 0
): string[] {
  const lines: string[] = [];
  const words = text.split(/(\s+)/); // Keep whitespace in results
  let currentLine = '';
  let currentWidth = 0;

  for (const word of words) {
    const wordWidth = calculateTextWidth(
      word,
      cpi,
      proportional,
      condensed,
      doubleWidth,
      interCharSpace
    );

    if (currentWidth + wordWidth <= maxWidth) {
      currentLine += word;
      currentWidth += wordWidth;
      if (currentLine.length > 0) {
        currentWidth += interCharSpace;
      }
    } else {
      // Word doesn't fit on current line
      if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
      }

      // Check if word fits on a new line
      if (wordWidth <= maxWidth) {
        currentLine = word.trimStart();
        currentWidth = calculateTextWidth(
          currentLine,
          cpi,
          proportional,
          condensed,
          doubleWidth,
          interCharSpace
        );
      } else {
        // Word is too long, need to break it
        const chars = word.split('');
        currentLine = '';
        currentWidth = 0;

        for (const char of chars) {
          const charWidth =
            getCharacterWidth(char.charCodeAt(0), cpi, proportional, condensed, doubleWidth) +
            interCharSpace;

          if (currentWidth + charWidth <= maxWidth) {
            currentLine += char;
            currentWidth += charWidth;
          } else {
            if (currentLine) {
              lines.push(currentLine);
            }
            currentLine = char;
            currentWidth = charWidth;
          }
        }
      }
    }
  }

  // Add remaining text
  if (currentLine.trim()) {
    lines.push(currentLine.trimEnd());
  }

  return lines;
}

/**
 * Get typeface name
 */
export function getTypefaceName(typeface: Typeface): string {
  const names: Record<number, string> = {
    [TYPEFACE.ROMAN]: 'Roman',
    [TYPEFACE.SANS_SERIF]: 'Sans Serif',
    [TYPEFACE.COURIER]: 'Courier',
    [TYPEFACE.PRESTIGE]: 'Prestige',
    [TYPEFACE.SCRIPT]: 'Script',
    [TYPEFACE.OCR_B]: 'OCR-B',
    [TYPEFACE.OCR_A]: 'OCR-A',
    [TYPEFACE.ORATOR]: 'Orator',
    [TYPEFACE.ORATOR_S]: 'Orator-S',
    [TYPEFACE.SCRIPT_C]: 'Script-C',
    [TYPEFACE.ROMAN_T]: 'Roman-T',
    [TYPEFACE.SANS_SERIF_H]: 'Sans Serif H',
  };
  return names[typeface] ?? `Typeface ${typeface}`;
}

/**
 * Check if typeface supports scalable fonts
 */
export function isScalableTypeface(typeface: Typeface): boolean {
  return typeface === TYPEFACE.ROMAN || typeface === TYPEFACE.SANS_SERIF;
}

export default {
  PROPORTIONAL_WIDTHS,
  INTERNATIONAL_CHAR_MAPS,
  getProportionalWidth,
  getCharacterWidth,
  mapInternationalChar,
  encodeText,
  calculateTextWidth,
  wordWrap,
  getTypefaceName,
  isScalableTypeface,
};
