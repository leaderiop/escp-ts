/**
 * ESC/P2 Command Builder
 * Generates raw command bytes for ESC/P and ESC/P2 printers
 */

import { ASCII, ESC_COMMANDS, ESC_EXTENDED } from '../core/constants';
import type {
  PrintQuality,
  Typeface,
  InternationalCharset,
  CharacterTable,
  Justification,
  PrintColor,
  BitImageMode,
  FontStyle,
  LineScoreStyle,
  BarcodeConfig,
} from '../core/types';
import { bytes, concat, toLowHigh, to32BitLE } from '../core/utils';
import { assertByte, assertRange, assertValidHex } from '../core/validation';

/**
 * ESC/P2 Command Builder class
 * Provides methods to generate all ESC/P and ESC/P2 commands
 */
export class CommandBuilder {
  // ==================== PRINTER CONTROL ====================

  /**
   * ESC @ - Initialize printer (reset to default settings)
   */
  static initialize(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.INITIALIZE);
  }

  /**
   * ESC EM n - Control paper loading/ejecting
   * @param action 0=not used, 1=eject, 2=not used, R=roll paper
   */
  static paperControl(action: number): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PAPER_LOAD, action);
  }

  // ==================== LINE SPACING ====================

  /**
   * ESC 0 - Select 1/8-inch line spacing
   */
  static lineSpacing1_8(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.LINE_SPACING_1_8);
  }

  /**
   * ESC 1 - Select 7/60-inch line spacing
   */
  static lineSpacing7_60(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.LINE_SPACING_7_60);
  }

  /**
   * ESC 2 - Select 1/6-inch line spacing (default)
   */
  static lineSpacing1_6(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.LINE_SPACING_1_6);
  }

  /**
   * ESC 3 n - Set n/180-inch line spacing (24-pin) or n/216-inch (9-pin)
   * @param n Line spacing value (0-255)
   * @throws {EscpRangeError} if n is not between 0 and 255
   */
  static lineSpacingN180(n: number): Uint8Array {
    assertByte(n, 'n');
    return bytes(ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_180, n);
  }

  /**
   * ESC A n - Set n/60-inch line spacing
   * @param n Line spacing value (0-255)
   * @throws {EscpRangeError} if n is not between 0 and 255
   */
  static lineSpacingN60(n: number): Uint8Array {
    assertByte(n, 'n');
    return bytes(ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_60, n);
  }

  /**
   * ESC + n - Set n/360-inch line spacing (ESC/P2)
   * @param n Line spacing value (0-255)
   * @throws {EscpRangeError} if n is not between 0 and 255
   */
  static lineSpacingN360(n: number): Uint8Array {
    assertByte(n, 'n');
    return bytes(ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_360, n);
  }

  /**
   * Set line spacing in inches
   * Uses the most appropriate command for the value
   * @param inches Line spacing in inches
   */
  static setLineSpacingInches(inches: number): Uint8Array {
    // Try to use 1/360 inch precision first
    const n360 = Math.round(inches * 360);
    if (n360 >= 0 && n360 <= 255) {
      return this.lineSpacingN360(n360);
    }
    // Fall back to 1/180 inch
    const n180 = Math.round(inches * 180);
    if (n180 >= 0 && n180 <= 255) {
      return this.lineSpacingN180(n180);
    }
    // Fall back to 1/60 inch
    const n60 = Math.round(inches * 60);
    return this.lineSpacingN60(Math.min(255, Math.max(0, n60)));
  }

  // ==================== PRINT POSITION ====================

  /**
   * ESC $ nL nH - Set absolute horizontal print position
   * Position = (nL + nH * 256) * horizontal unit
   * @param position Position in dots (1/60 inch units in draft, 1/180 in LQ)
   */
  static absoluteHorizontalPosition(position: number): Uint8Array {
    const [nL, nH] = toLowHigh(position);
    return bytes(ASCII.ESC, ESC_COMMANDS.ABSOLUTE_HORZ_POS, nL, nH);
  }

  /**
   * ESC \ nL nH - Set relative horizontal print position
   * @param offset Offset in dots (can be negative)
   */
  static relativeHorizontalPosition(offset: number): Uint8Array {
    // Negative values use two's complement
    const value = offset < 0 ? 65536 + offset : offset;
    const [nL, nH] = toLowHigh(value);
    return bytes(ASCII.ESC, ESC_COMMANDS.RELATIVE_HORZ_POS, nL, nH);
  }

  /**
   * ESC ( V nL nH m1 m2 m3 m4 - Set absolute vertical print position (ESC/P2)
   * @param position Position in unit dots from top margin
   */
  static absoluteVerticalPosition(position: number): Uint8Array {
    const [m1, m2, m3, m4] = to32BitLE(position);
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.ABS_VERT_POS,
      4,
      0, // byte count = 4
      m1,
      m2,
      m3,
      m4
    );
  }

  /**
   * ESC ( v nL nH m1 m2 m3 m4 - Set relative vertical print position (ESC/P2)
   * @param offset Offset in unit dots (can be negative)
   */
  static relativeVerticalPosition(offset: number): Uint8Array {
    // Handle negative values
    const value = offset < 0 ? 0x100000000 + offset : offset;
    const [m1, m2, m3, m4] = to32BitLE(value);
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.REL_VERT_POS,
      4,
      0, // byte count = 4
      m1,
      m2,
      m3,
      m4
    );
  }

  /**
   * ESC J n - Advance print position vertically by n/180 inch
   * @param n Advance value (0-255)
   * @throws {EscpRangeError} if n is not between 0 and 255
   */
  static advanceVertical(n: number): Uint8Array {
    assertByte(n, 'n');
    return bytes(ASCII.ESC, ESC_COMMANDS.ADVANCE_VERTICAL, n);
  }

  /**
   * ESC j nL nH - Reverse paper feed by (nL + nH * 256)/180 inch
   * @param n Reverse value
   */
  static reverseFeed(n: number): Uint8Array {
    const [nL, nH] = toLowHigh(n);
    return bytes(ASCII.ESC, ESC_COMMANDS.REVERSE_FEED, nL, nH);
  }

  /**
   * CR - Carriage return
   */
  static carriageReturn(): Uint8Array {
    return bytes(ASCII.CR);
  }

  /**
   * LF - Line feed
   */
  static lineFeed(): Uint8Array {
    return bytes(ASCII.LF);
  }

  /**
   * FF - Form feed (eject page)
   */
  static formFeed(): Uint8Array {
    return bytes(ASCII.FF);
  }

  // ==================== PAGE FORMAT ====================

  /**
   * ESC C n - Set page length in lines
   * @param lines Number of lines per page (1-127)
   * @throws {EscpRangeError} if lines is not between 1 and 127
   */
  static setPageLengthLines(lines: number): Uint8Array {
    assertRange(lines, 1, 127, 'lines');
    return bytes(ASCII.ESC, ESC_COMMANDS.PAGE_LENGTH_LINES, lines);
  }

  /**
   * ESC C NUL n - Set page length in inches
   * @param inches Page length in inches (1-22)
   * @throws {EscpRangeError} if inches is not between 1 and 22
   */
  static setPageLengthInches(inches: number): Uint8Array {
    assertRange(inches, 1, 22, 'inches');
    return bytes(ASCII.ESC, ESC_COMMANDS.PAGE_LENGTH_LINES, ASCII.NUL, inches);
  }

  /**
   * ESC ( C nL nH m1 m2 m3 m4 - Set page length in defined unit (ESC/P2)
   * @param length Page length in unit dots
   */
  static setPageLengthUnit(length: number): Uint8Array {
    const [m1, m2, m3, m4] = to32BitLE(length);
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.SET_PAGE_LENGTH,
      4,
      0, // byte count = 4
      m1,
      m2,
      m3,
      m4
    );
  }

  /**
   * ESC ( c nL nH t1 t2 b1 b2 - Set page format (top/bottom margins)
   * @param topMargin Top margin in unit dots
   * @param pageLength Page length in unit dots
   */
  static setPageFormat(topMargin: number, pageLength: number): Uint8Array {
    const [t1, t2] = toLowHigh(topMargin);
    const [b1, b2] = toLowHigh(pageLength);
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.SET_PAGE_FORMAT,
      4,
      0, // byte count = 4
      t1,
      t2,
      b1,
      b2
    );
  }

  /**
   * ESC N n - Set bottom margin
   * @param lines Number of lines for bottom margin (1-127)
   * @throws {EscpRangeError} if lines is not between 1 and 127
   */
  static setBottomMargin(lines: number): Uint8Array {
    assertRange(lines, 1, 127, 'lines');
    return bytes(ASCII.ESC, ESC_COMMANDS.BOTTOM_MARGIN, lines);
  }

  /**
   * ESC O - Cancel bottom margin
   */
  static cancelBottomMargin(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.CANCEL_BOTTOM_MARGIN);
  }

  /**
   * ESC l n - Set left margin
   * @param columns Left margin in character columns (0-255)
   * @throws {EscpRangeError} if columns is not between 0 and 255
   */
  static setLeftMargin(columns: number): Uint8Array {
    assertByte(columns, 'columns');
    return bytes(ASCII.ESC, ESC_COMMANDS.LEFT_MARGIN, columns);
  }

  /**
   * ESC Q n - Set right margin
   * @param columns Right margin in character columns (0-255)
   * @throws {EscpRangeError} if columns is not between 0 and 255
   */
  static setRightMargin(columns: number): Uint8Array {
    assertByte(columns, 'columns');
    return bytes(ASCII.ESC, ESC_COMMANDS.RIGHT_MARGIN, columns);
  }

  // ==================== TABS ====================

  /**
   * ESC D n1 n2 ... NUL - Set horizontal tab stops
   * @param positions Tab positions in columns (ascending order, max 32)
   */
  static setHorizontalTabs(positions: number[]): Uint8Array {
    const sorted = [...positions].sort((a, b) => a - b).slice(0, 32);
    return bytes(ASCII.ESC, ESC_COMMANDS.HORIZONTAL_TABS, ...sorted, ASCII.NUL);
  }

  /**
   * ESC B n1 n2 ... NUL - Set vertical tab stops
   * @param positions Tab positions in lines (ascending order, max 16)
   */
  static setVerticalTabs(positions: number[]): Uint8Array {
    const sorted = [...positions].sort((a, b) => a - b).slice(0, 16);
    return bytes(ASCII.ESC, ESC_COMMANDS.VERTICAL_TAB_STOPS, ...sorted, ASCII.NUL);
  }

  /**
   * HT - Horizontal tab
   */
  static horizontalTab(): Uint8Array {
    return bytes(ASCII.HT);
  }

  /**
   * VT - Vertical tab
   */
  static verticalTab(): Uint8Array {
    return bytes(ASCII.VT);
  }

  // ==================== UNIT SETTINGS ====================

  /**
   * ESC ( U nL nH m - Set unit (ESC/P2)
   * @param unit Unit value (typically 1/360, 1/720, or 1/1440 inch) (0-255)
   * @throws {EscpRangeError} if unit is not between 0 and 255
   */
  static setUnit(unit: number): Uint8Array {
    assertByte(unit, 'unit');
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.SET_UNIT,
      1,
      0, // byte count = 1
      unit
    );
  }

  /**
   * ESC ( U nL nH base vUnit hUnit pUnit - Set units with full control
   */
  static setUnits(base: number, vUnit: number, hUnit: number, pUnit: number): Uint8Array {
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.SET_UNIT,
      5,
      0, // byte count = 5
      base & 0xff,
      vUnit & 0xff,
      hUnit & 0xff,
      pUnit & 0xff,
      0 // reserved
    );
  }

  // ==================== FONT SELECTION ====================

  /**
   * ESC ! n - Master select (set multiple font attributes at once)
   * @param style Font style flags
   */
  static masterSelect(style: Partial<FontStyle> & { elite?: boolean; pica?: boolean }): Uint8Array {
    let n = 0;
    if (style.pica === false || style.elite) n |= 0x01; // 12 CPI (elite)
    if (style.proportional) n |= 0x02;
    if (style.condensed) n |= 0x04;
    if (style.bold) n |= 0x08;
    if (style.doubleStrike) n |= 0x10;
    if (style.doubleWidth) n |= 0x20;
    if (style.italic) n |= 0x40;
    if (style.underline) n |= 0x80;
    return bytes(ASCII.ESC, ESC_COMMANDS.MASTER_SELECT, n);
  }

  /**
   * ESC P - Select 10 CPI (pica)
   */
  static selectPica(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PICA);
  }

  /**
   * ESC M - Select 12 CPI (elite)
   */
  static selectElite(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.ELITE);
  }

  /**
   * ESC g - Select 15 CPI (micron)
   */
  static selectMicron(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.MICRON);
  }

  /**
   * SI or ESC SI - Select condensed mode
   */
  static selectCondensed(): Uint8Array {
    return bytes(ASCII.SI);
  }

  /**
   * DC2 - Cancel condensed mode
   */
  static cancelCondensed(): Uint8Array {
    return bytes(ASCII.DC2);
  }

  /**
   * ESC p n - Turn proportional mode on/off
   * @param on True to enable proportional mode
   */
  static setProportional(on: boolean): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PROPORTIONAL, on ? 1 : 0);
  }

  /**
   * ESC X m nL nH - Select font by pitch and point (ESC/P2 scalable fonts)
   * @param pitch 0=proportional, 1=10cpi, 2=12cpi, etc. or pitch in 360ths
   * @param pointSize Point size (8-32, even numbers only)
   */
  static selectScalableFont(pitch: number, pointSize: number): Uint8Array {
    const [nL, nH] = toLowHigh(pointSize);
    return bytes(ASCII.ESC, ESC_COMMANDS.SCALABLE_FONT, pitch, nL, nH);
  }

  /**
   * ESC k n - Select typeface
   * @param typeface Typeface ID (0-11 typically)
   */
  static selectTypeface(typeface: Typeface): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.TYPEFACE, typeface);
  }

  /**
   * ESC x n - Select draft or LQ mode
   * @param quality Print quality (0=draft, 1=LQ)
   */
  static selectQuality(quality: PrintQuality): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PRINT_QUALITY, quality);
  }

  // ==================== FONT STYLE ====================

  /**
   * ESC E - Select bold
   */
  static boldOn(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.BOLD_ON);
  }

  /**
   * ESC F - Cancel bold
   */
  static boldOff(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.BOLD_OFF);
  }

  /**
   * ESC 4 - Select italic
   */
  static italicOn(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.ITALIC_ON);
  }

  /**
   * ESC 5 - Cancel italic
   */
  static italicOff(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.ITALIC_OFF);
  }

  /**
   * ESC - n - Turn underline on/off
   * @param on True to enable underline
   */
  static setUnderline(on: boolean): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.UNDERLINE, on ? 1 : 0);
  }

  /**
   * ESC ( - nL nH m n1 n2 - Select line/score (ESC/P2)
   * @param style Line/score style configuration
   */
  static setLineScore(style: LineScoreStyle): Uint8Array {
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.SELECT_LINE_SCORE,
      3,
      0, // byte count = 3
      style.position,
      style.type,
      0 // reserved
    );
  }

  /**
   * ESC G - Select double-strike
   */
  static doubleStrikeOn(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.DOUBLE_STRIKE_ON);
  }

  /**
   * ESC H - Cancel double-strike
   */
  static doubleStrikeOff(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.DOUBLE_STRIKE_OFF);
  }

  /**
   * ESC S n - Select superscript/subscript
   * @param mode 0=superscript, 1=subscript
   */
  static setSuperSubscript(mode: 0 | 1): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.SUPERSCRIPT_SUBSCRIPT, mode);
  }

  /**
   * ESC T - Cancel superscript/subscript
   */
  static cancelSuperSubscript(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.CANCEL_SUPER_SUB);
  }

  // ==================== CHARACTER SIZE ====================

  /**
   * ESC W n - Turn double-width printing on/off
   * @param on True to enable double width
   */
  static setDoubleWidth(on: boolean): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.DOUBLE_WIDTH, on ? 1 : 0);
  }

  /**
   * SO - Select double-width printing (one line only)
   */
  static doubleWidthOneLine(): Uint8Array {
    return bytes(ASCII.SO);
  }

  /**
   * DC4 - Cancel one-line double-width
   */
  static cancelDoubleWidthOneLine(): Uint8Array {
    return bytes(ASCII.DC4);
  }

  /**
   * ESC w n - Turn double-height printing on/off
   * @param on True to enable double height
   */
  static setDoubleHeight(on: boolean): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.DOUBLE_HEIGHT, on ? 1 : 0);
  }

  /**
   * ESC SP n - Set intercharacter space
   * @param dots Space in dots (depends on current mode) (0-255)
   * @throws {EscpRangeError} if dots is not between 0 and 255
   */
  static setInterCharSpace(dots: number): Uint8Array {
    assertByte(dots, 'dots');
    return bytes(ASCII.ESC, ESC_COMMANDS.INTER_CHAR_SPACE, dots);
  }

  // ==================== CHARACTER TABLES ====================

  /**
   * ESC t n - Select character table
   * @param table Character table ID
   */
  static selectCharTable(table: CharacterTable): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.CHAR_TABLE, table);
  }

  /**
   * ESC ( t nL nH d1 d2 d3 - Assign character table (ESC/P2)
   * @param table Table selection
   * @param charset Character set
   */
  static assignCharTable(table: number, charset: number): Uint8Array {
    return bytes(
      ASCII.ESC,
      0x28, // '('
      ESC_EXTENDED.ASSIGN_CHAR_TABLE,
      3,
      0, // byte count = 3
      0, // table (usually 0)
      table & 0xff,
      charset & 0xff
    );
  }

  /**
   * ESC R n - Select international character set
   * @param charset International character set ID
   */
  static selectInternationalCharset(charset: InternationalCharset): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.INTERNATIONAL_CHARSET, charset);
  }

  /**
   * ESC 6 - Enable printing of upper control codes
   */
  static enableUpperControlCodes(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PRINT_UPPER_CTRL);
  }

  /**
   * ESC 7 - Enable upper control codes (extended characters)
   */
  static enableExtendedChars(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PRINT_UPPER_CTRL_2);
  }

  // ==================== JUSTIFICATION ====================

  /**
   * ESC a n - Select justification
   * @param justification Justification mode
   */
  static setJustification(justification: Justification): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.JUSTIFICATION, justification);
  }

  // ==================== COLOR ====================

  /**
   * ESC r n - Select printing color
   * @param color Color code
   */
  static selectColor(color: PrintColor): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.SELECT_COLOR, color);
  }

  // ==================== GRAPHICS ====================

  /**
   * ESC * m nL nH data - Select bit image mode and print graphics
   * @param mode Bit image mode (determines DPI and pin count)
   * @param width Width in dots/columns
   * @param data Graphics data (vertical columns)
   */
  static bitImage(mode: BitImageMode, width: number, data: Uint8Array): Uint8Array {
    const [nL, nH] = toLowHigh(width);
    return concat(
      bytes(ASCII.ESC, ESC_COMMANDS.BIT_IMAGE, mode, nL, nH),
      data
    );
  }

  /**
   * ESC K nL nH data - Select 60-dpi 8-pin graphics
   */
  static graphics60dpi(width: number, data: Uint8Array): Uint8Array {
    const [nL, nH] = toLowHigh(width);
    return concat(bytes(ASCII.ESC, ESC_COMMANDS.GRAPHICS_60DPI, nL, nH), data);
  }

  /**
   * ESC L nL nH data - Select 120-dpi 8-pin graphics
   */
  static graphics120dpi(width: number, data: Uint8Array): Uint8Array {
    const [nL, nH] = toLowHigh(width);
    return concat(bytes(ASCII.ESC, ESC_COMMANDS.GRAPHICS_120DPI, nL, nH), data);
  }

  /**
   * ESC Y nL nH data - Select 120-dpi double-speed 8-pin graphics
   */
  static graphics120dpiDoubleSpeed(width: number, data: Uint8Array): Uint8Array {
    const [nL, nH] = toLowHigh(width);
    return concat(bytes(ASCII.ESC, ESC_COMMANDS.GRAPHICS_120DPI_FAST, nL, nH), data);
  }

  /**
   * ESC Z nL nH data - Select 240-dpi 8-pin graphics
   */
  static graphics240dpi(width: number, data: Uint8Array): Uint8Array {
    const [nL, nH] = toLowHigh(width);
    return concat(bytes(ASCII.ESC, ESC_COMMANDS.GRAPHICS_240DPI, nL, nH), data);
  }

  /**
   * Print 24-pin graphics at specified mode
   * @param mode 24-pin graphics mode (32-40)
   * @param width Width in columns
   * @param data Graphics data (3 bytes per column for 24 pins)
   */
  static graphics24pin(mode: BitImageMode, width: number, data: Uint8Array): Uint8Array {
    return this.bitImage(mode, width, data);
  }

  /**
   * ESC ? s n - Reassign bit-image mode
   * @param source Source mode to reassign
   * @param target Target mode
   */
  static reassignBitImageMode(source: number, target: BitImageMode): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.REASSIGN_BIT_IMAGE, source, target);
  }

  // ==================== USER-DEFINED CHARACTERS ====================

  /**
   * ESC : NUL NUL NUL - Copy ROM characters to RAM
   */
  static copyRomToRam(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.COPY_ROM_TO_RAM, ASCII.NUL, ASCII.NUL, ASCII.NUL);
  }

  /**
   * ESC % n - Select user-defined character set
   * @param enable True to enable user-defined characters
   */
  static selectUserDefinedSet(enable: boolean): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.SELECT_USER_SET, enable ? 1 : 0);
  }

  /**
   * ESC & NUL n1 n2 data - Define user-defined characters
   * @param startChar First character code to define
   * @param endChar Last character code to define
   * @param charData Array of character definition data
   */
  static defineUserChars(
    startChar: number,
    endChar: number,
    charData: { proportional: number; data: Uint8Array }[]
  ): Uint8Array {
    const header = bytes(ASCII.ESC, ESC_COMMANDS.DEFINE_USER_CHARS, ASCII.NUL, startChar, endChar);
    const dataArrays = charData.map((c) => concat(bytes(c.proportional), c.data));
    return concat(header, ...dataArrays);
  }

  // ==================== MISCELLANEOUS ====================

  /**
   * ESC U n - Turn unidirectional mode on/off
   * @param on True for unidirectional printing
   */
  static setUnidirectional(on: boolean): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.UNIDIRECTIONAL, on ? 1 : 0);
  }

  /**
   * ESC < - Unidirectional mode for one line
   */
  static unidirectionalOneLine(): Uint8Array {
    return bytes(ASCII.ESC, 0x3c);
  }

  /**
   * ESC # - Cancel MSB control
   */
  static cancelMsbControl(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.MSB_CONTROL);
  }

  /**
   * ESC = - Set MSB to 0
   */
  static setMsb0(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.SET_MSB_0);
  }

  /**
   * ESC > - Set MSB to 1
   */
  static setMsb1(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.SET_MSB_1);
  }

  /**
   * ESC 8 - Disable paper-out detector
   */
  static disablePaperOut(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PAPER_OUT_OFF);
  }

  /**
   * ESC 9 - Enable paper-out detector
   */
  static enablePaperOut(): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.PAPER_OUT_ON);
  }

  /**
   * ESC ~ n - Turn slash zero on/off
   * @param on True to use slashed zero
   */
  static setSlashZero(on: boolean): Uint8Array {
    return bytes(ASCII.ESC, ESC_COMMANDS.SLASH_ZERO, on ? 1 : 0);
  }

  /**
   * BEL - Sound beeper
   */
  static beep(): Uint8Array {
    return bytes(ASCII.BEL);
  }

  // ==================== BARCODE (LQ-2090II specific) ====================

  /**
   * ESC ( B - Set up and print barcode
   * @param config Barcode configuration
   * @param data Barcode content
   */
  static barcode(config: BarcodeConfig, data: string): Uint8Array {
    const dataBytes = new TextEncoder().encode(data);
    const byteCount = 7 + dataBytes.length;
    const [bcL, bcH] = toLowHigh(byteCount);

    return concat(
      bytes(
        ASCII.ESC,
        0x28, // '('
        ESC_EXTENDED.BARCODE,
        bcL,
        bcH,
        config.type,
        config.moduleWidth,
        0, // reserved
        config.height & 0xff,
        (config.height >> 8) & 0xff,
        config.hriPosition | (config.hriFont << 4)
      ),
      dataBytes
    );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Unicode to CP437 mapping for box-drawing characters
   * Maps Unicode code points (U+2500 range) to CP437 byte values
   */
  private static readonly UNICODE_TO_CP437: Record<number, number> = {
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
   * Encode text with current character set
   * @param text Text to encode
   * @param encoding Character encoding (default: ascii)
   */
  static encodeText(text: string, _encoding: 'ascii' | 'latin1' | 'cp437' = 'ascii'): Uint8Array {
    // For ASCII and Latin-1, we can use simple encoding
    const result = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      // Check for Unicode box-drawing characters and map to CP437
      const cp437Code = this.UNICODE_TO_CP437[code];
      if (cp437Code !== undefined) {
        result[i] = cp437Code;
      } else {
        // Handle ASCII and Latin-1 directly
        result[i] = code & 0xff;
      }
    }
    return result;
  }

  /**
   * Create a complete print line with text
   * @param text Text to print
   * @param newline Include CR+LF at end
   */
  static printLine(text: string, newline = true): Uint8Array {
    const textBytes = this.encodeText(text);
    if (newline) {
      return concat(textBytes, bytes(ASCII.CR, ASCII.LF));
    }
    return textBytes;
  }

  /**
   * Create raw byte array from hex string
   * @param hex Hex string (e.g., "1B40" or "1B 40")
   * @throws {EncodingError} if hex string has odd length or invalid characters
   */
  static fromHex(hex: string): Uint8Array {
    assertValidHex(hex);
    const clean = hex.replace(/\s/g, '');
    const result = new Uint8Array(clean.length / 2);
    for (let i = 0; i < result.length; i++) {
      result[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    }
    return result;
  }

  /**
   * Convert byte array to hex string
   * @param data Byte array
   * @param separator Separator between bytes
   */
  static toHex(data: Uint8Array, separator = ' '): string {
    return Array.from(data)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(separator);
  }
}

export default CommandBuilder;
