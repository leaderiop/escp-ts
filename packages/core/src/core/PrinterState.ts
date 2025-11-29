/**
 * Printer State Management
 * Tracks the current state of the virtual printer
 */

import {
  PRINT_QUALITY,
  TYPEFACE,
  INTERNATIONAL_CHARSET,
  CHAR_TABLE,
  JUSTIFICATION,
  PRINT_COLOR,
  BIT_IMAGE_MODE,
  LQ_2090II,
  UNITS,
} from './constants';
import type {
  PrinterState,
  FontStyle,
  FontConfig,
  PaperConfig,
  Margins,
  PrintQuality,
  Typeface,
  CharacterTable,
  InternationalCharset,
  Justification,
  PrintColor,
  BitImageMode,
} from './types';

/**
 * Default font style (all disabled)
 */
export const DEFAULT_FONT_STYLE: FontStyle = {
  bold: false,
  italic: false,
  underline: false,
  doubleStrike: false,
  superscript: false,
  subscript: false,
  doubleWidth: false,
  doubleHeight: false,
  condensed: false,
  proportional: false,
};

/**
 * Default font configuration
 */
export const DEFAULT_FONT_CONFIG: FontConfig = {
  typeface: TYPEFACE.ROMAN as Typeface,
  cpi: LQ_2090II.DEFAULT_CPI,
  style: { ...DEFAULT_FONT_STYLE },
  quality: PRINT_QUALITY.DRAFT as PrintQuality,
};

/**
 * Default margins in dots (1/360 inch units)
 * Top/bottom: 0.25 inch (90 dots)
 * Left/right: ~0.624 inch (225 dots) to center 13.6" printable on 14.847" paper
 */
export const DEFAULT_MARGINS: Margins = {
  top: 90, // 0.25 * 360
  bottom: 90,
  left: 225, // (14.847 - 13.6) / 2 * 360 ≈ 225
  right: 225,
};

/**
 * Default paper configuration
 * CUPS Custom.1069x615: lpoptions -p EPSON_LQ_2090II -o PageSize=Custom.1069x615
 * 1069x615 points = 14.847" x 8.542" (1 point = 1/72 inch)
 */
export const DEFAULT_PAPER_CONFIG: PaperConfig = {
  widthInches: 1069 / 72, // 14.847 inches
  heightInches: 615 / 72, // 8.542 inches
  margins: { ...DEFAULT_MARGINS },
  linesPerPage: 51, // ~8.542 inches at 6 lines per inch
};

/**
 * Create initial printer state
 */
export function createInitialState(
  paper: Partial<PaperConfig> = {},
  font: Partial<FontConfig> = {}
): PrinterState {
  const paperConfig: PaperConfig = {
    ...DEFAULT_PAPER_CONFIG,
    ...paper,
    margins: {
      ...DEFAULT_MARGINS,
      ...paper.margins,
    },
  };

  const fontConfig: FontConfig = {
    ...DEFAULT_FONT_CONFIG,
    ...font,
    style: {
      ...DEFAULT_FONT_STYLE,
      ...font.style,
    },
  };

  return {
    // Position
    x: paperConfig.margins.left,
    y: paperConfig.margins.top,
    page: 0,

    // Paper
    paper: paperConfig,

    // Font
    font: fontConfig,

    // Line spacing: 1/6 inch = 60 dots at 360 DPI
    lineSpacing: Math.round(UNITS.DEFAULT_UNIT_DIVISOR / 6),

    // Intercharacter space (0 by default)
    interCharSpace: 0,

    // HMI (horizontal motion index) - depends on CPI
    hmi: calculateHMI(fontConfig.cpi, fontConfig.style.condensed),

    // Character sets
    charTable: CHAR_TABLE.PC437_USA as CharacterTable,
    internationalCharset: INTERNATIONAL_CHARSET.USA as InternationalCharset,

    // Color
    color: PRINT_COLOR.BLACK as PrintColor,

    // Layout
    justification: JUSTIFICATION.LEFT as Justification,

    // Printing mode
    unidirectional: false,

    // MSB control (0 = no control)
    msbControl: 0,

    // Tabs (default: every 8 columns for horizontal)
    horizontalTabs: [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128],
    verticalTabs: [],

    // User-defined characters
    userDefinedCharsEnabled: false,

    // Paper-out sensor
    paperOutSensor: true,

    // Units (ESC/P2 default: 1/360 inch)
    units: {
      base: 1440, // Base unit in reciprocal inches
      horizontal: 4, // 1/360 inch (1440/360 = 4)
      vertical: 4, // 1/360 inch
      page: 4, // 1/360 inch
    },

    // Graphics state
    graphics: {
      mode: BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
      reassignedModes: new Map(),
    },
  };
}

/**
 * Calculate horizontal motion index (character width in dots)
 */
export function calculateHMI(cpi: number, condensed: boolean): number {
  // Base character width at 360 DPI
  const baseWidth = Math.round(360 / cpi);

  // Condensed mode reduces width by factor of ~0.6
  if (condensed) {
    return Math.round(baseWidth * 0.6);
  }

  return baseWidth;
}

/**
 * Calculate character width including modifiers
 */
export function calculateCharWidth(font: FontConfig, interCharSpace: number): number {
  let width = calculateHMI(font.cpi, font.style.condensed);

  // Double width doubles the character width
  if (font.style.doubleWidth) {
    width *= 2;
  }

  // Add intercharacter space
  width += interCharSpace;

  return width;
}

/**
 * Calculate line height including modifiers
 */
export function calculateLineHeight(lineSpacing: number, doubleHeight: boolean): number {
  let height = lineSpacing;

  if (doubleHeight) {
    height *= 2;
  }

  return height;
}

/**
 * Get printable width in dots
 */
export function getPrintableWidth(paper: PaperConfig): number {
  const totalWidth = Math.round(paper.widthInches * UNITS.DEFAULT_UNIT_DIVISOR);
  return totalWidth - paper.margins.left - paper.margins.right;
}

/**
 * Get printable height in dots
 */
export function getPrintableHeight(paper: PaperConfig): number {
  const totalHeight = Math.round(paper.heightInches * UNITS.DEFAULT_UNIT_DIVISOR);
  return totalHeight - paper.margins.top - paper.margins.bottom;
}

/**
 * Get page width in dots
 */
export function getPageWidth(paper: PaperConfig): number {
  return Math.round(paper.widthInches * UNITS.DEFAULT_UNIT_DIVISOR);
}

/**
 * Get page height in dots
 */
export function getPageHeight(paper: PaperConfig): number {
  return Math.round(paper.heightInches * UNITS.DEFAULT_UNIT_DIVISOR);
}

/**
 * Check if position is within printable area
 */
export function isInPrintableArea(x: number, y: number, paper: PaperConfig): boolean {
  const pageWidth = getPageWidth(paper);
  const pageHeight = getPageHeight(paper);

  return (
    x >= paper.margins.left &&
    x <= pageWidth - paper.margins.right &&
    y >= paper.margins.top &&
    y <= pageHeight - paper.margins.bottom
  );
}

/**
 * Get maximum X position for current page
 */
export function getMaxX(paper: PaperConfig): number {
  return getPageWidth(paper) - paper.margins.right;
}

/**
 * Get maximum Y position for current page
 */
export function getMaxY(paper: PaperConfig): number {
  return getPageHeight(paper) - paper.margins.bottom;
}

/**
 * Convert inches to dots
 */
export function inchesToDots(inches: number): number {
  return Math.round(inches * UNITS.DEFAULT_UNIT_DIVISOR);
}

/**
 * Convert dots to inches
 */
export function dotsToInches(dots: number): number {
  return dots / UNITS.DEFAULT_UNIT_DIVISOR;
}

/**
 * Convert millimeters to dots
 */
export function mmToDots(mm: number): number {
  return Math.round((mm / UNITS.INCH_TO_MM) * UNITS.DEFAULT_UNIT_DIVISOR);
}

/**
 * Convert dots to millimeters
 */
export function dotsToMm(dots: number): number {
  return (dots / UNITS.DEFAULT_UNIT_DIVISOR) * UNITS.INCH_TO_MM;
}

/**
 * Convert column position to dots based on current CPI
 */
export function columnsToDots(columns: number, cpi: number): number {
  return Math.round((columns / cpi) * UNITS.DEFAULT_UNIT_DIVISOR);
}

/**
 * Convert line position to dots based on line spacing
 */
export function linesToDots(lines: number, lineSpacing: number): number {
  return lines * lineSpacing;
}

/**
 * Printer state manager class
 */
export class PrinterStateManager {
  private state: PrinterState;
  private stateHistory: PrinterState[] = [];
  private maxHistorySize = 100;

  constructor(initialState?: Partial<PrinterState>) {
    this.state = createInitialState(initialState?.paper, initialState?.font);
    if (initialState) {
      // Don't overwrite font/paper as they were already merged in createInitialState
      const { font: _, paper: __, ...rest } = initialState;
      Object.assign(this.state, rest);
    }
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): Readonly<PrinterState> {
    return this.state;
  }

  /**
   * Get mutable state reference (use with caution)
   */
  getMutableState(): PrinterState {
    return this.state;
  }

  /**
   * Update state with partial changes
   */
  updateState(changes: Partial<PrinterState>): void {
    this.saveHistory();
    Object.assign(this.state, changes);
  }

  /**
   * Update font configuration
   */
  updateFont(changes: Partial<FontConfig>): void {
    this.saveHistory();
    this.state.font = {
      ...this.state.font,
      ...changes,
      style: {
        ...this.state.font.style,
        ...changes.style,
      },
    };
    // Recalculate HMI when CPI changes
    if (changes.cpi !== undefined || changes.style?.condensed !== undefined) {
      this.state.hmi = calculateHMI(this.state.font.cpi, this.state.font.style.condensed);
    }
  }

  /**
   * Update font style
   */
  updateFontStyle(changes: Partial<FontStyle>): void {
    this.saveHistory();
    this.state.font.style = {
      ...this.state.font.style,
      ...changes,
    };
    // Recalculate HMI when condensed changes
    if (changes.condensed !== undefined) {
      this.state.hmi = calculateHMI(this.state.font.cpi, this.state.font.style.condensed);
    }
  }

  /**
   * Move to absolute position
   */
  moveTo(x: number, y: number): void {
    this.saveHistory();
    this.state.x = Math.max(this.state.paper.margins.left, x);
    this.state.y = Math.max(this.state.paper.margins.top, y);
  }

  /**
   * Move by relative offset
   */
  moveBy(dx: number, dy: number): void {
    this.moveTo(this.state.x + dx, this.state.y + dy);
  }

  /**
   * Advance X position by character width
   */
  advanceX(chars = 1): void {
    const charWidth = calculateCharWidth(this.state.font, this.state.interCharSpace);
    this.moveBy(charWidth * chars, 0);
  }

  /**
   * Carriage return (move to left margin)
   */
  carriageReturn(): void {
    this.saveHistory();
    this.state.x = this.state.paper.margins.left;
  }

  /**
   * Line feed (advance by line spacing)
   */
  lineFeed(): void {
    const lineHeight = calculateLineHeight(
      this.state.lineSpacing,
      this.state.font.style.doubleHeight
    );
    this.moveBy(0, lineHeight);
    this.checkPageBreak();
  }

  /**
   * New line (CR + LF)
   */
  newLine(): void {
    this.carriageReturn();
    this.lineFeed();
  }

  /**
   * Form feed (eject page)
   */
  formFeed(): void {
    this.saveHistory();
    this.state.page++;
    this.state.x = this.state.paper.margins.left;
    this.state.y = this.state.paper.margins.top;
  }

  /**
   * Check if page break is needed and handle it
   */
  checkPageBreak(): boolean {
    const maxY = getMaxY(this.state.paper);
    if (this.state.y > maxY) {
      this.formFeed();
      return true;
    }
    return false;
  }

  /**
   * Check if line wrap is needed
   */
  checkLineWrap(additionalWidth = 0): boolean {
    const maxX = getMaxX(this.state.paper);
    return this.state.x + additionalWidth > maxX;
  }

  /**
   * Perform line wrap if needed
   */
  wrapLine(): boolean {
    if (this.checkLineWrap()) {
      this.newLine();
      return true;
    }
    return false;
  }

  /**
   * Get next horizontal tab position
   */
  getNextHorizontalTab(): number | null {
    const currentColumn = Math.floor(
      (this.state.x - this.state.paper.margins.left) / this.state.hmi
    );
    const nextTab = this.state.horizontalTabs.find((t) => t > currentColumn);
    if (nextTab !== undefined) {
      return this.state.paper.margins.left + nextTab * this.state.hmi;
    }
    return null;
  }

  /**
   * Get next vertical tab position
   */
  getNextVerticalTab(): number | null {
    const currentLine = Math.floor(
      (this.state.y - this.state.paper.margins.top) / this.state.lineSpacing
    );
    const nextTab = this.state.verticalTabs.find((t) => t > currentLine);
    if (nextTab !== undefined) {
      return this.state.paper.margins.top + nextTab * this.state.lineSpacing;
    }
    return null;
  }

  /**
   * Move to next horizontal tab
   */
  horizontalTab(): void {
    const nextPos = this.getNextHorizontalTab();
    if (nextPos !== null) {
      this.moveTo(nextPos, this.state.y);
    }
  }

  /**
   * Move to next vertical tab
   */
  verticalTab(): void {
    const nextPos = this.getNextVerticalTab();
    if (nextPos !== null) {
      this.moveTo(this.state.x, nextPos);
    }
  }

  /**
   * Reset printer to initial state
   */
  reset(): void {
    this.saveHistory();
    const paper = this.state.paper;
    this.state = createInitialState(paper);
  }

  /**
   * Save current state to history
   */
  private saveHistory(): void {
    this.stateHistory.push(JSON.parse(JSON.stringify(this.state)));
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Undo last state change
   */
  undo(): boolean {
    const previousState = this.stateHistory.pop();
    if (previousState) {
      this.state = previousState;
      // Restore the Map object for graphics.reassignedModes
      const entries = previousState.graphics.reassignedModes || {};
      this.state.graphics.reassignedModes = new Map<number, BitImageMode>(
        Object.entries(entries).map(([k, v]) => [Number(k), v as BitImageMode])
      );
      return true;
    }
    return false;
  }

  /**
   * Clone current state
   */
  clone(): PrinterStateManager {
    const cloned = new PrinterStateManager();
    cloned.state = JSON.parse(JSON.stringify(this.state));
    cloned.state.graphics.reassignedModes = new Map(this.state.graphics.reassignedModes);
    return cloned;
  }
}

export default PrinterStateManager;
