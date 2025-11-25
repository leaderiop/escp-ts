/**
 * ESC/P2 Layout Engine Type Definitions
 */

import {
  PRINT_QUALITY,
  TYPEFACE,
  INTERNATIONAL_CHARSET,
  CHAR_TABLE,
  JUSTIFICATION,
  PRINT_COLOR,
  BIT_IMAGE_MODE,
  BARCODE_TYPE,
} from './constants';

// Utility types
export type ValueOf<T> = T[keyof T];

// Print quality type
export type PrintQuality = ValueOf<typeof PRINT_QUALITY>;

// Typeface type
export type Typeface = ValueOf<typeof TYPEFACE>;

// International charset type
export type InternationalCharset = ValueOf<typeof INTERNATIONAL_CHARSET>;

// Character table type
export type CharacterTable = ValueOf<typeof CHAR_TABLE>;

// Justification type
export type Justification = ValueOf<typeof JUSTIFICATION>;

// Print color type
export type PrintColor = ValueOf<typeof PRINT_COLOR>;

// Bit image mode type
export type BitImageMode = ValueOf<typeof BIT_IMAGE_MODE>;

// Barcode type
export type BarcodeType = ValueOf<typeof BARCODE_TYPE>;

/**
 * Position in dots (1/360 inch units)
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size in dots (1/360 inch units)
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Page margins in dots
 */
export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Paper configuration
 */
export interface PaperConfig {
  /** Paper width in inches */
  widthInches: number;
  /** Paper height in inches */
  heightInches: number;
  /** Margins in dots (1/360 inch) */
  margins: Margins;
  /** Lines per page (for ESC C command) */
  linesPerPage?: number;
}

/**
 * Font style flags
 */
export interface FontStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  doubleStrike: boolean;
  superscript: boolean;
  subscript: boolean;
  doubleWidth: boolean;
  doubleHeight: boolean;
  condensed: boolean;
  proportional: boolean;
}

/**
 * Font configuration
 */
export interface FontConfig {
  /** Typeface ID */
  typeface: Typeface;
  /** Characters per inch */
  cpi: number;
  /** Point size (for scalable fonts) */
  pointSize?: number;
  /** Font style flags */
  style: FontStyle;
  /** Print quality */
  quality: PrintQuality;
}

/**
 * Current printer state
 */
export interface PrinterState {
  /** Current horizontal position in dots */
  x: number;
  /** Current vertical position in dots */
  y: number;
  /** Current page number (0-indexed) */
  page: number;

  /** Paper configuration */
  paper: PaperConfig;

  /** Font configuration */
  font: FontConfig;

  /** Line spacing in dots (1/360 inch) */
  lineSpacing: number;

  /** Intercharacter space in dots */
  interCharSpace: number;

  /** Horizontal motion index in dots */
  hmi: number;

  /** Current character table */
  charTable: CharacterTable;

  /** Current international character set */
  internationalCharset: InternationalCharset;

  /** Current print color */
  color: PrintColor;

  /** Justification mode */
  justification: Justification;

  /** Unidirectional printing enabled */
  unidirectional: boolean;

  /** MSB control: 0 = none, 1 = set to 0, 2 = set to 1 */
  msbControl: 0 | 1 | 2;

  /** Horizontal tab stops (in column positions) */
  horizontalTabs: number[];

  /** Vertical tab stops (in line positions) */
  verticalTabs: number[];

  /** User-defined characters enabled */
  userDefinedCharsEnabled: boolean;

  /** Paper-out sensor enabled */
  paperOutSensor: boolean;

  /** Unit settings */
  units: {
    /** Base unit (reciprocal inches, typically 1440) */
    base: number;
    /** Horizontal unit in base units */
    horizontal: number;
    /** Vertical unit in base units */
    vertical: number;
    /** Page unit in base units */
    page: number;
  };

  /** Graphics state */
  graphics: {
    /** Current bit image mode */
    mode: BitImageMode;
    /** Reassigned graphics modes */
    reassignedModes: Map<number, BitImageMode>;
  };
}

/**
 * Graphics data for bit image printing
 */
export interface BitImageData {
  /** Image mode (determines DPI and pin count) */
  mode: BitImageMode;
  /** Width in columns (dots) */
  width: number;
  /** Raw graphics data (vertical columns) */
  data: Uint8Array;
}

/**
 * Barcode configuration
 */
export interface BarcodeConfig {
  /** Barcode type */
  type: BarcodeType;
  /** Module width in dots (1-3) */
  moduleWidth: number;
  /** Bar height in dots */
  height: number;
  /** Human readable text position: 0=none, 1=above, 2=below, 3=both */
  hriPosition: 0 | 1 | 2 | 3;
  /** HRI font: 0=font A, 1=font B */
  hriFont: 0 | 1;
}

/**
 * Line/Score style for ESC ( - command
 */
export interface LineScoreStyle {
  /** Line position: 1=underline, 2=strikethrough, 3=overscore */
  position: 1 | 2 | 3;
  /** Line type: 0=single, 1=double, 2=broken */
  type: 0 | 1 | 2;
}

/**
 * User-defined character definition
 */
export interface UserDefinedChar {
  /** Character code being defined */
  charCode: number;
  /** Left margin (space before character) */
  leftMargin: number;
  /** Right margin (space after character) */
  rightMargin: number;
  /** Character width in dots */
  width: number;
  /** Dot pattern data (vertical columns) */
  data: Uint8Array;
}

/**
 * Layout element types
 */
export type LayoutElementType =
  | 'text'
  | 'graphics'
  | 'barcode'
  | 'line'
  | 'box'
  | 'newline'
  | 'formfeed'
  | 'tab'
  | 'position';

/**
 * Base layout element
 */
export interface LayoutElementBase {
  type: LayoutElementType;
  /** Position where element starts (set during layout) */
  position?: Position;
}

/**
 * Text layout element
 */
export interface TextElement extends LayoutElementBase {
  type: 'text';
  /** Text content */
  content: string;
  /** Font configuration for this text */
  font: FontConfig;
  /** Intercharacter space */
  interCharSpace: number;
  /** Color */
  color: PrintColor;
}

/**
 * Graphics layout element
 */
export interface GraphicsElement extends LayoutElementBase {
  type: 'graphics';
  /** Bit image data */
  data: BitImageData;
}

/**
 * Barcode layout element
 */
export interface BarcodeElement extends LayoutElementBase {
  type: 'barcode';
  /** Barcode content */
  content: string;
  /** Barcode configuration */
  config: BarcodeConfig;
}

/**
 * Line layout element (horizontal or vertical line)
 */
export interface LineElement extends LayoutElementBase {
  type: 'line';
  /** Line length in dots */
  length: number;
  /** Line thickness in dots */
  thickness: number;
  /** Horizontal or vertical */
  direction: 'horizontal' | 'vertical';
}

/**
 * Box layout element
 */
export interface BoxElement extends LayoutElementBase {
  type: 'box';
  /** Box size */
  size: Size;
  /** Border thickness in dots */
  borderThickness: number;
  /** Fill pattern (0 = no fill) */
  fill: number;
}

/**
 * New line element
 */
export interface NewlineElement extends LayoutElementBase {
  type: 'newline';
  /** Number of line feeds (default 1) */
  count: number;
  /** Line spacing to use (in dots) */
  lineSpacing: number;
}

/**
 * Form feed element
 */
export interface FormFeedElement extends LayoutElementBase {
  type: 'formfeed';
}

/**
 * Tab element
 */
export interface TabElement extends LayoutElementBase {
  type: 'tab';
  /** Tab type */
  tabType: 'horizontal' | 'vertical';
}

/**
 * Position change element
 */
export interface PositionElement extends LayoutElementBase {
  type: 'position';
  /** Target position (absolute or relative) */
  target: Position;
  /** Whether position is relative to current */
  relative: boolean;
}

/**
 * Union of all layout elements
 */
export type LayoutElement =
  | TextElement
  | GraphicsElement
  | BarcodeElement
  | LineElement
  | BoxElement
  | NewlineElement
  | FormFeedElement
  | TabElement
  | PositionElement;

/**
 * Page content
 */
export interface Page {
  /** Page number (0-indexed) */
  number: number;
  /** Layout elements on this page */
  elements: LayoutElement[];
  /** Page size in dots */
  size: Size;
}

/**
 * Document structure
 */
export interface Document {
  /** Pages in the document */
  pages: Page[];
  /** Paper configuration */
  paper: PaperConfig;
  /** Initial printer state */
  initialState: Partial<PrinterState>;
}

/**
 * ESC/P2 command output
 */
export interface CommandOutput {
  /** Raw command bytes */
  bytes: Uint8Array;
  /** Human-readable description */
  description: string;
}

/**
 * Render output options
 */
export interface RenderOptions {
  /** Output format */
  format: 'raw' | 'hex' | 'base64';
  /** Include command descriptions as comments */
  includeComments?: boolean;
}

/**
 * Bitmap render options for virtual preview
 */
export interface BitmapRenderOptions {
  /** Horizontal DPI for rendering */
  dpi: number;
  /** Scale factor */
  scale: number;
  /** Background color (hex) */
  backgroundColor: string;
  /** Foreground/ink color (hex) */
  foregroundColor: string;
  /** Show page boundaries */
  showPageBoundaries: boolean;
  /** Show margins */
  showMargins: boolean;
}

/**
 * Printer profile for specific printer models
 */
export interface PrinterProfile {
  /** Printer model name */
  name: string;
  /** Number of pins in print head */
  pins: 9 | 24 | 48;
  /** Maximum print width in inches */
  maxPrintWidthInches: number;
  /** Supported CPIs */
  supportedCpi: readonly number[];
  /** Supports ESC/P2 */
  escP2: boolean;
  /** Supports scalable fonts */
  scalableFonts: boolean;
  /** Supports color */
  color: boolean;
  /** Available typefaces */
  typefaces: readonly Typeface[];
  /** Max draft speed (CPS) */
  maxDraftSpeed: number;
  /** Max LQ speed (CPS) */
  maxLqSpeed: number;
}

/**
 * Layout engine options
 */
export interface LayoutEngineOptions {
  /** Printer profile */
  profile: PrinterProfile;
  /** Default paper configuration */
  defaultPaper: PaperConfig;
  /** Default font configuration */
  defaultFont: Partial<FontConfig>;
  /** Auto-wrap long lines */
  autoWrap: boolean;
  /** Strict mode (throw on unsupported commands) */
  strict: boolean;
}
