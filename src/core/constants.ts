/**
 * ESC/P and ESC/P2 Control Codes and Constants
 * Reference: EPSON ESC/P Reference Manual (December 1997)
 * Target: EPSON LQ-2090II (24-pin dot matrix printer)
 */

// ASCII Control Characters
export const ASCII = {
  NUL: 0x00,
  SOH: 0x01,
  STX: 0x02,
  ETX: 0x03,
  EOT: 0x04,
  ENQ: 0x05,
  ACK: 0x06,
  BEL: 0x07,
  BS: 0x08,
  HT: 0x09,
  LF: 0x0a,
  VT: 0x0b,
  FF: 0x0c,
  CR: 0x0d,
  SO: 0x0e,
  SI: 0x0f,
  DLE: 0x10,
  DC1: 0x11,
  DC2: 0x12,
  DC3: 0x13,
  DC4: 0x14,
  NAK: 0x15,
  SYN: 0x16,
  ETB: 0x17,
  CAN: 0x18,
  EM: 0x19,
  SUB: 0x1a,
  ESC: 0x1b,
  FS: 0x1c,
  GS: 0x1d,
  RS: 0x1e,
  US: 0x1f,
  DEL: 0x7f,
} as const;

// ESC/P2 Command Codes (Second byte after ESC)
export const ESC_COMMANDS = {
  // Printer Control
  INITIALIZE: 0x40, // ESC @ - Initialize printer
  PAPER_LOAD: 0x19, // ESC EM - Control paper loading/ejecting

  // Line Spacing
  LINE_SPACING_1_8: 0x30, // ESC 0 - Select 1/8-inch line spacing
  LINE_SPACING_7_60: 0x31, // ESC 1 - Select 7/60-inch line spacing
  LINE_SPACING_1_6: 0x32, // ESC 2 - Select 1/6-inch line spacing
  LINE_SPACING_N_180: 0x33, // ESC 3 n - Set n/180-inch line spacing
  LINE_SPACING_N_60: 0x41, // ESC A n - Set n/60-inch line spacing
  LINE_SPACING_N_360: 0x2b, // ESC + n - Set n/360-inch line spacing

  // Print Position
  ABSOLUTE_HORZ_POS: 0x24, // ESC $ nL nH - Set absolute horizontal position
  RELATIVE_HORZ_POS: 0x5c, // ESC \ nL nH - Set relative horizontal position
  SET_HMI: 0x63, // ESC c n - Set horizontal motion index

  // Vertical Position & Tabs
  VERTICAL_TAB_STOPS: 0x42, // ESC B - Set vertical tabs
  ADVANCE_VERTICAL: 0x4a, // ESC J n - Advance print position vertically
  REVERSE_FEED: 0x6a, // ESC j nL nH - Reverse paper feed

  // Page Format
  PAGE_LENGTH_LINES: 0x43, // ESC C n - Set page length in lines
  BOTTOM_MARGIN: 0x4e, // ESC N n - Set bottom margin
  CANCEL_BOTTOM_MARGIN: 0x4f, // ESC O - Cancel bottom margin
  LEFT_MARGIN: 0x6c, // ESC l n - Set left margin
  RIGHT_MARGIN: 0x51, // ESC Q n - Set right margin

  // Horizontal Tabs
  HORIZONTAL_TABS: 0x44, // ESC D - Set horizontal tabs

  // Font Selection
  MASTER_SELECT: 0x21, // ESC ! n - Master select
  PICA: 0x50, // ESC P - Select 10 CPI (pica)
  ELITE: 0x4d, // ESC M - Select 12 CPI (elite)
  MICRON: 0x67, // ESC g - Select 15 CPI
  PROPORTIONAL: 0x70, // ESC p 0/1 - Proportional mode on/off
  SCALABLE_FONT: 0x58, // ESC X m nL nH - Select font by pitch and point
  TYPEFACE: 0x6b, // ESC k n - Select typeface
  PRINT_QUALITY: 0x78, // ESC x n - Select LQ or draft

  // Font Style
  BOLD_ON: 0x45, // ESC E - Select bold
  BOLD_OFF: 0x46, // ESC F - Cancel bold
  ITALIC_ON: 0x34, // ESC 4 - Select italic
  ITALIC_OFF: 0x35, // ESC 5 - Cancel italic
  UNDERLINE: 0x2d, // ESC - 0/1 - Underline on/off
  DOUBLE_STRIKE_ON: 0x47, // ESC G - Double-strike on
  DOUBLE_STRIKE_OFF: 0x48, // ESC H - Double-strike off
  SUPERSCRIPT_SUBSCRIPT: 0x53, // ESC S 0/1 - Superscript/subscript
  CANCEL_SUPER_SUB: 0x54, // ESC T - Cancel super/subscript

  // Character Size
  DOUBLE_WIDTH: 0x57, // ESC W 0/1 - Double width on/off
  DOUBLE_HEIGHT: 0x77, // ESC w 0/1 - Double height on/off
  INTER_CHAR_SPACE: 0x20, // ESC SP n - Set intercharacter space

  // Character Tables
  CHAR_TABLE: 0x74, // ESC t n - Select character table
  INTERNATIONAL_CHARSET: 0x52, // ESC R n - Select international character set

  // Graphics
  BIT_IMAGE: 0x2a, // ESC * m nL nH - Select bit image mode
  GRAPHICS_60DPI: 0x4b, // ESC K nL nH - Select 60-dpi graphics
  GRAPHICS_120DPI: 0x4c, // ESC L nL nH - Select 120-dpi graphics
  GRAPHICS_120DPI_FAST: 0x59, // ESC Y nL nH - Select 120-dpi double-speed
  GRAPHICS_240DPI: 0x5a, // ESC Z nL nH - Select 240-dpi graphics
  REASSIGN_BIT_IMAGE: 0x3f, // ESC ? s n - Reassign bit-image mode

  // User-Defined Characters
  DEFINE_USER_CHARS: 0x26, // ESC & - Define user-defined characters
  COPY_ROM_TO_RAM: 0x3a, // ESC : - Copy ROM to RAM
  SELECT_USER_SET: 0x25, // ESC % n - Select user-defined set

  // Miscellaneous
  UNIDIRECTIONAL: 0x55, // ESC U 0/1 - Unidirectional on/off
  JUSTIFICATION: 0x61, // ESC a n - Select justification
  MSB_CONTROL: 0x23, // ESC # - Cancel MSB control
  SET_MSB_0: 0x3d, // ESC = - Set MSB to 0
  SET_MSB_1: 0x3e, // ESC > - Set MSB to 1
  PRINT_UPPER_CTRL: 0x36, // ESC 6 - Enable upper control codes
  PRINT_UPPER_CTRL_2: 0x37, // ESC 7 - Enable upper control codes
  PAPER_OUT_OFF: 0x38, // ESC 8 - Disable paper-out detector
  PAPER_OUT_ON: 0x39, // ESC 9 - Enable paper-out detector
  SLASH_ZERO: 0x7e, // ESC ~ 0/1 - Slash zero on/off
  SELECT_COLOR: 0x72, // ESC r n - Select printing color
} as const;

// Extended ESC/P2 Commands (ESC ( x format)
export const ESC_EXTENDED = {
  ASSIGN_CHAR_TABLE: 0x74, // ESC ( t - Assign character table
  SELECT_LINE_SCORE: 0x2d, // ESC ( - - Select line/score
  SET_PAGE_FORMAT: 0x63, // ESC ( c - Set page format
  SET_PAGE_LENGTH: 0x43, // ESC ( C - Set page length
  SET_UNIT: 0x55, // ESC ( U - Set unit
  ABS_VERT_POS: 0x56, // ESC ( V - Absolute vertical position
  REL_VERT_POS: 0x76, // ESC ( v - Relative vertical position
  BARCODE: 0x42, // ESC ( B - Barcode setup and print
  PRINT_DATA_AS_CHARS: 0x5e, // ESC ( ^ - Print data as characters
} as const;

// Print Quality Modes
export const PRINT_QUALITY = {
  DRAFT: 0,
  LQ: 1,
  NLQ: 1, // Near Letter Quality (same as LQ for ESC/P2)
} as const;

// Character Pitches (Characters Per Inch)
export const CPI = {
  PICA: 10, // 10 CPI
  ELITE: 12, // 12 CPI
  MICRON: 15, // 15 CPI
  CONDENSED_PICA: 17, // 17.14 CPI (condensed 10 CPI)
  CONDENSED_ELITE: 20, // 20 CPI (condensed 12 CPI)
} as const;

// Character widths in dots at 360 DPI
export const CHAR_WIDTH_DOTS = {
  PICA: 36, // 10 CPI = 36 dots at 360 DPI
  ELITE: 30, // 12 CPI = 30 dots at 360 DPI
  MICRON: 24, // 15 CPI = 24 dots at 360 DPI
  CONDENSED_PICA: 21, // 17.14 CPI ≈ 21 dots at 360 DPI
  CONDENSED_ELITE: 18, // 20 CPI = 18 dots at 360 DPI
} as const;

// Typeface IDs for ESC k command
export const TYPEFACE = {
  ROMAN: 0,
  SANS_SERIF: 1,
  COURIER: 2,
  PRESTIGE: 3,
  SCRIPT: 4,
  OCR_B: 5,
  OCR_A: 6,
  ORATOR: 7,
  ORATOR_S: 8,
  SCRIPT_C: 9,
  ROMAN_T: 10,
  SANS_SERIF_H: 11,
  SV_BUSABA: 30,
  SV_JITTRA: 31,
} as const;

// International Character Sets for ESC R command
export const INTERNATIONAL_CHARSET = {
  USA: 0,
  FRANCE: 1,
  GERMANY: 2,
  UK: 3,
  DENMARK_I: 4,
  SWEDEN: 5,
  ITALY: 6,
  SPAIN_I: 7,
  JAPAN: 8,
  NORWAY: 9,
  DENMARK_II: 10,
  SPAIN_II: 11,
  LATIN_AMERICA: 12,
  KOREA: 13,
  LEGAL: 64,
} as const;

// Character Tables for ESC t command
export const CHAR_TABLE = {
  PC437_USA: 0,
  KATAKANA: 1,
  PC850_MULTILINGUAL: 2,
  PC860_PORTUGUESE: 3,
  PC863_CANADIAN_FRENCH: 4,
  PC865_NORDIC: 5,
  PC858_EURO: 13,
  ISO_8859_15: 15,
  PC866_CYRILLIC: 17,
  PC852_EASTERN_EUROPE: 18,
  PC858_MULTILINGUAL: 19,
  ISO_LATIN_1: 32,
  ISO_8859_15_LATIN9: 33,
} as const;

// Bit Image Modes for ESC * command
export const BIT_IMAGE_MODE = {
  SINGLE_DENSITY_8PIN: 0, // 60 DPI (8-pin)
  DOUBLE_DENSITY_8PIN: 1, // 120 DPI (8-pin)
  HIGH_SPEED_DOUBLE_8PIN: 3, // 120 DPI double-speed (8-pin)
  QUAD_DENSITY_8PIN: 4, // 240 DPI (8-pin)
  CRT_I_8PIN: 5, // 72 DPI (8-pin)
  CRT_II_8PIN: 6, // 90 DPI (8-pin)
  PLOTTER_8PIN: 7, // 80 DPI (8-pin)

  // 24-pin modes
  SINGLE_DENSITY_24PIN: 32, // 60 DPI (24-pin)
  DOUBLE_DENSITY_24PIN: 33, // 120 DPI (24-pin)
  HIGH_SPEED_DOUBLE_24PIN: 35, // 120 DPI double-speed (24-pin)
  TRIPLE_DENSITY_24PIN: 38, // 180 DPI (24-pin)
  HEX_DENSITY_24PIN: 39, // 360 DPI (24-pin)
  CRT_III_24PIN: 40, // 90 DPI (24-pin)
} as const;

// Resolution DPI values
export const DPI = {
  DRAFT_HORIZONTAL: 120,
  LQ_HORIZONTAL: 360,
  VERTICAL_24PIN: 180,
  MAX_HORIZONTAL: 360,
  MAX_VERTICAL: 360,
} as const;

// Paper Sizes (in inches)
export const PAPER_SIZE = {
  LETTER: { width: 8.5, height: 11 },
  LEGAL: { width: 8.5, height: 14 },
  A4: { width: 8.27, height: 11.69 },
  A3: { width: 11.69, height: 16.54 },
  CONTINUOUS_132: { width: 13.6, height: 11 }, // 132-column continuous
  CONTINUOUS_80: { width: 9.5, height: 11 }, // 80-column continuous
} as const;

// LQ-2090II Specific Constants
export const LQ_2090II = {
  MAX_PRINT_WIDTH_INCHES: 13.6, // 136 columns at 10 CPI
  MAX_PRINT_WIDTH_DOTS: 4896, // 13.6 * 360
  PINS: 24,
  MAX_SPEED_DRAFT_CPS: 584,
  MAX_SPEED_LQ_CPS: 121,
  SUPPORTED_CPI: [10, 12, 15, 17, 20] as const,
  DEFAULT_LINE_SPACING_INCHES: 1 / 6, // 1/6 inch
  DEFAULT_CPI: 10,
} as const;

// Unit Conversions
export const UNITS = {
  INCHES_TO_POINTS: 72,
  INCH_TO_MM: 25.4,
  DEFAULT_UNIT_DIVISOR: 360, // ESC/P2 uses 1/360 inch as base unit
  DRAFT_UNIT_DIVISOR: 120, // Draft mode uses 1/120 inch
  LQ_UNIT_DIVISOR: 180, // LQ mode uses 1/180 inch for some commands
} as const;

// Justification modes for ESC a command
export const JUSTIFICATION = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
  FULL: 3,
} as const;

// Color codes for ESC r command
export const PRINT_COLOR = {
  BLACK: 0,
  MAGENTA: 1,
  CYAN: 2,
  VIOLET: 3,
  YELLOW: 4,
  RED: 5,
  GREEN: 6,
} as const;

// Barcode types for ESC ( B command
export const BARCODE_TYPE = {
  EAN_13: 0,
  EAN_8: 1,
  INTERLEAVED_2_OF_5: 2,
  UPC_A: 3,
  UPC_E: 4,
  CODE_39: 5,
  CODE_128: 6,
  POSTNET: 7,
  CODABAR: 8, // NW-7
  INDUSTRIAL_2_OF_5: 9,
  MATRIX_2_OF_5: 10,
} as const;
