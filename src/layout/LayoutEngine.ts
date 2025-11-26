/**
 * ESC/P2 Layout Engine
 * Main engine for building documents and generating printer commands
 */

import { CommandBuilder } from '../commands/CommandBuilder';
import { PrinterStateManager, getMaxX, getPageWidth, getPageHeight, getPrintableWidth } from '../core/PrinterState';
import { encodeText, calculateTextWidth, wordWrap } from '../fonts/CharacterSet';
import { splitIntoStripes, GRAPHICS_MODES, type GrayscaleImage, type ConversionOptions } from '../graphics/BitmapConverter';
import {
  PRINT_QUALITY,
  TYPEFACE,
  JUSTIFICATION,
  BIT_IMAGE_MODE,
  LQ_2090II,
} from '../core/constants';
import { concat } from '../core/utils';
import { assertNonNegative, assertOneOf } from '../core/validation';
import type {
  PrinterState,
  FontConfig,
  FontStyle,
  PaperConfig,
  PrintQuality,
  Typeface,
  CharacterTable,
  InternationalCharset,
  Justification,
  BitImageMode,
  BitImageData,
  BarcodeConfig,
  PrinterProfile,
  LayoutEngineOptions,
  Document,
  Page,
  LayoutElement,
  TextElement,
} from '../core/types';

// Layout system imports
import type { LayoutNode, WidthSpec } from './nodes';
import { measureNode, type MeasureContext } from './measure';
import { performLayout } from './layout';
import { renderLayout } from './renderer';
import { StackBuilder, FlexBuilder, GridBuilder, stack, flex, grid } from './builders';

/**
 * Default LQ-2090II printer profile
 */
export const LQ_2090II_PROFILE: PrinterProfile = {
  name: 'EPSON LQ-2090II',
  pins: 24,
  maxPrintWidthInches: LQ_2090II.MAX_PRINT_WIDTH_INCHES,
  supportedCpi: LQ_2090II.SUPPORTED_CPI,
  escP2: true,
  scalableFonts: true,
  color: false,
  typefaces: [
    TYPEFACE.ROMAN,
    TYPEFACE.SANS_SERIF,
    TYPEFACE.COURIER,
    TYPEFACE.PRESTIGE,
    TYPEFACE.SCRIPT,
    TYPEFACE.OCR_B,
    TYPEFACE.ORATOR,
    TYPEFACE.ORATOR_S,
    TYPEFACE.SCRIPT_C,
    TYPEFACE.ROMAN_T,
    TYPEFACE.SANS_SERIF_H,
  ] as Typeface[],
  maxDraftSpeed: LQ_2090II.MAX_SPEED_DRAFT_CPS,
  maxLqSpeed: LQ_2090II.MAX_SPEED_LQ_CPS,
};

/**
 * Default layout engine options
 */
export const DEFAULT_ENGINE_OPTIONS: LayoutEngineOptions = {
  profile: LQ_2090II_PROFILE,
  defaultPaper: {
    widthInches: 8.5,
    heightInches: 11,
    margins: { top: 90, bottom: 90, left: 90, right: 90 },
    linesPerPage: 66,
  },
  defaultFont: {
    typeface: TYPEFACE.ROMAN as Typeface,
    cpi: 10,
    quality: PRINT_QUALITY.DRAFT as PrintQuality,
  },
  autoWrap: true,
  strict: false,
};

/**
 * Main ESC/P2 Layout Engine
 */
export class LayoutEngine {
  private stateManager: PrinterStateManager;
  private options: LayoutEngineOptions;
  private output: Uint8Array[] = [];
  private pages: Page[] = [];
  private currentPageElements: LayoutElement[] = [];

  constructor(options: Partial<LayoutEngineOptions> = {}) {
    this.options = { ...DEFAULT_ENGINE_OPTIONS, ...options };
    this.stateManager = new PrinterStateManager({
      paper: this.options.defaultPaper,
      font: this.options.defaultFont as FontConfig,
    });
  }

  /**
   * Get current printer state
   */
  getState(): Readonly<PrinterState> {
    return this.stateManager.getState();
  }

  /**
   * Get accumulated output bytes
   */
  getOutput(): Uint8Array {
    return concat(...this.output);
  }

  /**
   * Clear output buffer
   */
  clearOutput(): void {
    this.output = [];
  }

  /**
   * Add raw command to output
   */
  private emit(command: Uint8Array): void {
    this.output.push(command);
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize printer (send reset command)
   */
  initialize(): this {
    this.emit(CommandBuilder.initialize());
    this.stateManager = new PrinterStateManager({
      paper: this.options.defaultPaper,
      font: this.options.defaultFont as FontConfig,
    });
    return this;
  }

  /**
   * Set up page with custom configuration
   * @throws {ValidationError} if margins are negative
   */
  setupPage(paper: Partial<PaperConfig>): this {
    // Validate margins if provided
    if (paper.margins) {
      if (paper.margins.top !== undefined) {
        assertNonNegative(paper.margins.top, 'margins.top');
      }
      if (paper.margins.bottom !== undefined) {
        assertNonNegative(paper.margins.bottom, 'margins.bottom');
      }
      if (paper.margins.left !== undefined) {
        assertNonNegative(paper.margins.left, 'margins.left');
      }
      if (paper.margins.right !== undefined) {
        assertNonNegative(paper.margins.right, 'margins.right');
      }
    }

    const state = this.stateManager.getMutableState();
    Object.assign(state.paper, paper);

    // Set page length
    if (paper.linesPerPage) {
      this.emit(CommandBuilder.setPageLengthLines(paper.linesPerPage));
    } else if (paper.heightInches) {
      this.emit(CommandBuilder.setPageLengthInches(Math.round(paper.heightInches)));
    }

    // Set margins
    if (paper.margins) {
      // Convert dots to columns for margin commands
      const leftColumns = Math.round(paper.margins.left / state.hmi);
      const rightColumns = Math.round(
        (getPageWidth(state.paper) - paper.margins.right) / state.hmi
      );
      this.emit(CommandBuilder.setLeftMargin(leftColumns));
      this.emit(CommandBuilder.setRightMargin(rightColumns));
    }

    return this;
  }

  // ==================== LINE SPACING ====================

  /**
   * Set line spacing to 1/6 inch (default)
   */
  setLineSpacing1_6(): this {
    this.emit(CommandBuilder.lineSpacing1_6());
    this.stateManager.updateState({ lineSpacing: 60 }); // 1/6 * 360
    return this;
  }

  /**
   * Set line spacing to 1/8 inch
   */
  setLineSpacing1_8(): this {
    this.emit(CommandBuilder.lineSpacing1_8());
    this.stateManager.updateState({ lineSpacing: 45 }); // 1/8 * 360
    return this;
  }

  /**
   * Set line spacing in n/180 inch
   */
  setLineSpacingN180(n: number): this {
    this.emit(CommandBuilder.lineSpacingN180(n));
    this.stateManager.updateState({ lineSpacing: Math.round((n / 180) * 360) });
    return this;
  }

  /**
   * Set line spacing in n/360 inch (ESC/P2)
   */
  setLineSpacingN360(n: number): this {
    this.emit(CommandBuilder.lineSpacingN360(n));
    this.stateManager.updateState({ lineSpacing: n });
    return this;
  }

  /**
   * Set line spacing in inches
   */
  setLineSpacing(inches: number): this {
    const dots = Math.round(inches * 360);
    return this.setLineSpacingN360(dots);
  }

  // ==================== FONT SELECTION ====================

  /**
   * Set font by CPI
   * @throws {ConfigurationError} if CPI is not supported
   */
  setCpi(cpi: number): this {
    assertOneOf(cpi, this.options.profile.supportedCpi, 'cpi');

    switch (cpi) {
      case 10:
        this.emit(CommandBuilder.selectPica());
        break;
      case 12:
        this.emit(CommandBuilder.selectElite());
        break;
      case 15:
        this.emit(CommandBuilder.selectMicron());
        break;
      case 17:
      case 20:
        // Condensed modes
        this.emit(cpi === 17 ? CommandBuilder.selectPica() : CommandBuilder.selectElite());
        this.emit(CommandBuilder.selectCondensed());
        this.stateManager.updateFontStyle({ condensed: true });
        break;
    }

    this.stateManager.updateFont({ cpi });
    return this;
  }

  /**
   * Set typeface
   */
  setTypeface(typeface: Typeface): this {
    this.emit(CommandBuilder.selectTypeface(typeface));
    this.stateManager.updateFont({ typeface });
    return this;
  }

  /**
   * Set print quality
   */
  setQuality(quality: PrintQuality): this {
    this.emit(CommandBuilder.selectQuality(quality));
    this.stateManager.updateFont({ quality });
    return this;
  }

  /**
   * Set scalable font (ESC/P2 only)
   */
  setScalableFont(pointSize: number, pitch: number = 0): this {
    if (!this.options.profile.scalableFonts) {
      if (this.options.strict) {
        throw new Error('Scalable fonts not supported by this printer');
      }
      return this;
    }

    // Point size must be even, 8-32
    const clampedSize = Math.max(8, Math.min(32, Math.round(pointSize / 2) * 2));
    this.emit(CommandBuilder.selectScalableFont(pitch, clampedSize));
    this.stateManager.updateFont({ pointSize: clampedSize });
    return this;
  }

  // ==================== FONT STYLE ====================

  /**
   * Set bold mode
   */
  setBold(on: boolean): this {
    this.emit(on ? CommandBuilder.boldOn() : CommandBuilder.boldOff());
    this.stateManager.updateFontStyle({ bold: on });
    return this;
  }

  /**
   * Set italic mode
   */
  setItalic(on: boolean): this {
    this.emit(on ? CommandBuilder.italicOn() : CommandBuilder.italicOff());
    this.stateManager.updateFontStyle({ italic: on });
    return this;
  }

  /**
   * Set underline mode
   */
  setUnderline(on: boolean): this {
    this.emit(CommandBuilder.setUnderline(on));
    this.stateManager.updateFontStyle({ underline: on });
    return this;
  }

  /**
   * Set double-strike mode
   */
  setDoubleStrike(on: boolean): this {
    this.emit(on ? CommandBuilder.doubleStrikeOn() : CommandBuilder.doubleStrikeOff());
    this.stateManager.updateFontStyle({ doubleStrike: on });
    return this;
  }

  /**
   * Set double-width mode
   */
  setDoubleWidth(on: boolean): this {
    this.emit(CommandBuilder.setDoubleWidth(on));
    this.stateManager.updateFontStyle({ doubleWidth: on });
    return this;
  }

  /**
   * Set double-height mode
   */
  setDoubleHeight(on: boolean): this {
    this.emit(CommandBuilder.setDoubleHeight(on));
    this.stateManager.updateFontStyle({ doubleHeight: on });
    return this;
  }

  /**
   * Set condensed mode
   */
  setCondensed(on: boolean): this {
    this.emit(on ? CommandBuilder.selectCondensed() : CommandBuilder.cancelCondensed());
    this.stateManager.updateFontStyle({ condensed: on });
    return this;
  }

  /**
   * Set proportional spacing
   */
  setProportional(on: boolean): this {
    this.emit(CommandBuilder.setProportional(on));
    this.stateManager.updateFontStyle({ proportional: on });
    return this;
  }

  /**
   * Set superscript mode
   */
  setSuperscript(on: boolean): this {
    if (on) {
      this.emit(CommandBuilder.setSuperSubscript(0));
      this.stateManager.updateFontStyle({ superscript: true, subscript: false });
    } else {
      this.emit(CommandBuilder.cancelSuperSubscript());
      this.stateManager.updateFontStyle({ superscript: false });
    }
    return this;
  }

  /**
   * Set subscript mode
   */
  setSubscript(on: boolean): this {
    if (on) {
      this.emit(CommandBuilder.setSuperSubscript(1));
      this.stateManager.updateFontStyle({ subscript: true, superscript: false });
    } else {
      this.emit(CommandBuilder.cancelSuperSubscript());
      this.stateManager.updateFontStyle({ subscript: false });
    }
    return this;
  }

  /**
   * Apply multiple font styles at once using master select
   */
  setFontStyle(style: Partial<FontStyle>): this {
    this.emit(CommandBuilder.masterSelect(style));
    this.stateManager.updateFontStyle(style);
    return this;
  }

  // ==================== CHARACTER SETTINGS ====================

  /**
   * Set character table (code page)
   */
  setCharTable(table: CharacterTable): this {
    this.emit(CommandBuilder.selectCharTable(table));
    this.stateManager.updateState({ charTable: table });
    return this;
  }

  /**
   * Set international character set
   */
  setInternationalCharset(charset: InternationalCharset): this {
    this.emit(CommandBuilder.selectInternationalCharset(charset));
    this.stateManager.updateState({ internationalCharset: charset });
    return this;
  }

  /**
   * Set intercharacter spacing
   */
  setInterCharSpace(dots: number): this {
    this.emit(CommandBuilder.setInterCharSpace(dots));
    this.stateManager.updateState({ interCharSpace: dots });
    return this;
  }

  // ==================== JUSTIFICATION ====================

  /**
   * Set text justification
   */
  setJustification(justification: Justification): this {
    this.emit(CommandBuilder.setJustification(justification));
    this.stateManager.updateState({ justification });
    return this;
  }

  /**
   * Left justify
   */
  leftAlign(): this {
    return this.setJustification(JUSTIFICATION.LEFT as Justification);
  }

  /**
   * Center justify
   */
  centerAlign(): this {
    return this.setJustification(JUSTIFICATION.CENTER as Justification);
  }

  /**
   * Right justify
   */
  rightAlign(): this {
    return this.setJustification(JUSTIFICATION.RIGHT as Justification);
  }

  /**
   * Full justify
   */
  fullJustify(): this {
    return this.setJustification(JUSTIFICATION.FULL as Justification);
  }

  // ==================== POSITIONING ====================

  /**
   * Move to absolute horizontal position (in dots)
   */
  moveToX(dots: number): this {
    const state = this.stateManager.getState();
    // Convert dots to motion units
    const units = Math.round(dots / (360 / 60)); // Assuming 1/60 inch motion units
    this.emit(CommandBuilder.absoluteHorizontalPosition(units));
    this.stateManager.moveTo(dots, state.y);
    return this;
  }

  /**
   * Move to absolute column position
   */
  moveToColumn(column: number): this {
    const state = this.stateManager.getState();
    const dots = state.paper.margins.left + column * state.hmi;
    return this.moveToX(dots);
  }

  /**
   * Move by relative horizontal offset
   */
  moveByX(dots: number): this {
    // Convert dots to motion units (can be negative)
    const units = Math.round(dots / 6); // 1/60 inch motion units
    this.emit(CommandBuilder.relativeHorizontalPosition(units));
    this.stateManager.moveBy(dots, 0);
    return this;
  }

  /**
   * Carriage return (move to left margin)
   */
  carriageReturn(): this {
    this.emit(CommandBuilder.carriageReturn());
    this.stateManager.carriageReturn();
    return this;
  }

  /**
   * Line feed (advance one line)
   */
  lineFeed(): this {
    this.emit(CommandBuilder.lineFeed());
    this.stateManager.lineFeed();
    return this;
  }

  /**
   * New line (CR + LF)
   */
  newLine(): this {
    this.emit(CommandBuilder.carriageReturn());
    this.emit(CommandBuilder.lineFeed());
    this.stateManager.newLine();
    return this;
  }

  /**
   * Form feed (eject page)
   */
  formFeed(): this {
    this.emit(CommandBuilder.formFeed());
    this.stateManager.formFeed();

    // Save current page
    const state = this.stateManager.getState();
    this.pages.push({
      number: this.pages.length,
      elements: this.currentPageElements,
      size: {
        width: getPageWidth(state.paper),
        height: getPageHeight(state.paper),
      },
    });
    this.currentPageElements = [];

    return this;
  }

  /**
   * Advance vertical position by n/180 inch
   */
  advanceVertical(n180: number): this {
    this.emit(CommandBuilder.advanceVertical(n180));
    this.stateManager.moveBy(0, Math.round((n180 / 180) * 360));
    return this;
  }

  /**
   * Horizontal tab
   */
  tab(): this {
    this.emit(CommandBuilder.horizontalTab());
    this.stateManager.horizontalTab();
    return this;
  }

  /**
   * Vertical tab
   */
  verticalTab(): this {
    this.emit(CommandBuilder.verticalTab());
    this.stateManager.verticalTab();
    return this;
  }

  /**
   * Set horizontal tab stops
   */
  setHorizontalTabs(columns: number[]): this {
    this.emit(CommandBuilder.setHorizontalTabs(columns));
    this.stateManager.updateState({ horizontalTabs: columns });
    return this;
  }

  /**
   * Set vertical tab stops
   */
  setVerticalTabs(lines: number[]): this {
    this.emit(CommandBuilder.setVerticalTabs(lines));
    this.stateManager.updateState({ verticalTabs: lines });
    return this;
  }

  // ==================== TEXT PRINTING ====================

  /**
   * Print text at current position
   */
  print(text: string): this {
    const state = this.stateManager.getState();

    // Encode text with current character set
    const encoded = encodeText(text, state.internationalCharset, state.charTable);
    this.emit(encoded);

    // Calculate width and update position
    const width = calculateTextWidth(
      text,
      state.font.cpi,
      state.font.style.proportional,
      state.font.style.condensed,
      state.font.style.doubleWidth,
      state.interCharSpace
    );
    this.stateManager.moveBy(width, 0);

    // Track element
    this.currentPageElements.push({
      type: 'text',
      content: text,
      font: { ...state.font, style: { ...state.font.style } },
      interCharSpace: state.interCharSpace,
      color: state.color,
      position: { x: state.x, y: state.y },
    } as TextElement);

    return this;
  }

  /**
   * Print text and move to next line
   */
  println(text: string = ''): this {
    if (text) {
      this.print(text);
    }
    return this.newLine();
  }

  /**
   * Print text with automatic word wrapping
   */
  printWrapped(text: string): this {
    const state = this.stateManager.getState();
    const maxWidth = getMaxX(state.paper) - state.x;

    const lines = wordWrap(
      text,
      maxWidth,
      state.font.cpi,
      state.font.style.proportional,
      state.font.style.condensed,
      state.font.style.doubleWidth,
      state.interCharSpace
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line) {
        this.print(line);
        if (i < lines.length - 1) {
          this.newLine();
        }
      }
    }

    return this;
  }

  /**
   * Print centered text on current line
   */
  printCentered(text: string): this {
    const state = this.stateManager.getState();
    const textWidth = calculateTextWidth(
      text,
      state.font.cpi,
      state.font.style.proportional,
      state.font.style.condensed,
      state.font.style.doubleWidth,
      state.interCharSpace
    );

    const printableWidth = getMaxX(state.paper) - state.paper.margins.left;
    const startX = state.paper.margins.left + Math.round((printableWidth - textWidth) / 2);

    return this.moveToX(startX).print(text);
  }

  /**
   * Print right-aligned text on current line
   */
  printRightAligned(text: string): this {
    const state = this.stateManager.getState();
    const textWidth = calculateTextWidth(
      text,
      state.font.cpi,
      state.font.style.proportional,
      state.font.style.condensed,
      state.font.style.doubleWidth,
      state.interCharSpace
    );

    const startX = getMaxX(state.paper) - textWidth;
    return this.moveToX(startX).print(text);
  }

  // ==================== GRAPHICS ====================

  /**
   * Print graphics data
   */
  printGraphics(data: BitImageData): this {
    const modeInfo = GRAPHICS_MODES[data.mode];
    if (!modeInfo) {
      throw new Error(`Unsupported graphics mode: ${data.mode}`);
    }

    // Emit graphics command
    this.emit(CommandBuilder.bitImage(data.mode, data.width, data.data));

    // Update position
    this.stateManager.moveBy(data.width, 0);

    return this;
  }

  /**
   * Print image with conversion
   */
  printImage(
    image: GrayscaleImage,
    options: Partial<ConversionOptions> = {}
  ): this {
    const state = this.stateManager.getState();

    // Default to 24-pin mode for LQ series
    const mode = options.mode ?? (BIT_IMAGE_MODE.HEX_DENSITY_24PIN as BitImageMode);
    const modeInfo = GRAPHICS_MODES[mode];

    if (!modeInfo) {
      throw new Error(`Unsupported graphics mode: ${mode}`);
    }

    // Calculate max width
    const maxWidthDots = getMaxX(state.paper) - state.x;
    const maxColumns = Math.floor(maxWidthDots * (modeInfo.horizontalDpi / 360));

    // Split image into stripes for printing
    const stripes = splitIntoStripes(image, mode, {
      ...options,
      maxColumns,
    });

    // Set line spacing to match pin height
    const lineSpacingDots = Math.round((modeInfo.pins / modeInfo.horizontalDpi) * 360);
    this.emit(CommandBuilder.lineSpacingN360(lineSpacingDots));

    for (const stripe of stripes) {
      this.printGraphics(stripe);
      this.newLine();
    }

    // Restore default line spacing
    this.setLineSpacing1_6();

    return this;
  }

  // ==================== BARCODE ====================

  /**
   * Print barcode (LQ-2090II specific)
   */
  printBarcode(content: string, config: Partial<BarcodeConfig> = {}): this {
    const fullConfig: BarcodeConfig = {
      type: 5, // Code 39 default
      moduleWidth: 2,
      height: 50,
      hriPosition: 2, // Below
      hriFont: 0,
      ...config,
    };

    this.emit(CommandBuilder.barcode(fullConfig, content));
    return this;
  }

  // ==================== MISCELLANEOUS ====================

  /**
   * Set unidirectional printing
   */
  setUnidirectional(on: boolean): this {
    this.emit(CommandBuilder.setUnidirectional(on));
    this.stateManager.updateState({ unidirectional: on });
    return this;
  }

  /**
   * Sound the beeper
   */
  beep(): this {
    this.emit(CommandBuilder.beep());
    return this;
  }

  /**
   * Send raw bytes
   */
  raw(data: Uint8Array | number[]): this {
    this.emit(data instanceof Uint8Array ? data : new Uint8Array(data));
    return this;
  }

  /**
   * Send raw hex string
   */
  rawHex(hex: string): this {
    this.emit(CommandBuilder.fromHex(hex));
    return this;
  }

  // ==================== LAYOUT SYSTEM ====================

  /**
   * Render a virtual layout tree
   *
   * This is the main entry point for the new layout system. It takes a
   * layout node (built using stack(), flex(), or grid() builders) and
   * renders it to ESC/P2 commands.
   *
   * @param node - The layout node to render
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * engine.render(
   *   stack()
   *     .align('center')
   *     .text('Title', { bold: true })
   *     .text('Subtitle')
   *     .build()
   * );
   * ```
   */
  render(node: LayoutNode): this {
    const state = this.stateManager.getState();

    // Create measure context from current state
    const measureCtx: MeasureContext = {
      availableWidth: getPrintableWidth(state.paper),
      availableHeight: getPageHeight(state.paper) - state.y,
      lineSpacing: state.lineSpacing,
      interCharSpace: state.interCharSpace,
      style: {
        bold: state.font.style.bold,
        italic: state.font.style.italic,
        underline: state.font.style.underline,
        doubleStrike: state.font.style.doubleStrike,
        doubleWidth: state.font.style.doubleWidth,
        doubleHeight: state.font.style.doubleHeight,
        condensed: state.font.style.condensed,
        cpi: state.font.cpi,
      },
    };

    // Phase 1: Measure
    const measured = measureNode(node, measureCtx, measureCtx.style);

    // Phase 2: Layout (assign positions)
    const layoutResult = performLayout(
      measured,
      state.x,
      state.y,
      measureCtx.availableWidth,
      measureCtx.availableHeight
    );

    // Phase 3: Render to commands
    const renderResult = renderLayout(layoutResult, {
      startX: state.x,
      startY: state.y,
      charset: state.internationalCharset,
      charTable: state.charTable,
      lineSpacing: state.lineSpacing,
      initialStyle: measureCtx.style,
    });

    // Emit generated commands
    this.emit(renderResult.commands);

    // Update position to after the layout
    this.stateManager.moveTo(state.paper.margins.left, renderResult.finalY);

    return this;
  }

  /**
   * Create a stack builder for vertical layouts
   *
   * @example
   * ```typescript
   * engine.render(
   *   engine.stack()
   *     .align('center')
   *     .gap(10)
   *     .text('Line 1')
   *     .text('Line 2')
   *     .build()
   * );
   * ```
   */
  createStack(): StackBuilder {
    return stack();
  }

  /**
   * Create a flex builder for horizontal layouts
   *
   * @example
   * ```typescript
   * engine.render(
   *   engine.flex()
   *     .justify('space-between')
   *     .text('Left')
   *     .text('Right')
   *     .build()
   * );
   * ```
   */
  createFlex(): FlexBuilder {
    return flex();
  }

  /**
   * Create a grid builder for table layouts
   *
   * @param columns - Column width specifications
   *
   * @example
   * ```typescript
   * engine.render(
   *   engine.grid([200, 'fill', 150])
   *     .cell('Qty').cell('Item').cell('Price').row()
   *     .cell('5').cell('Widget').cell('$10').row()
   *     .build()
   * );
   * ```
   */
  createGrid(columns: WidthSpec[]): GridBuilder {
    return grid(columns);
  }

  // ==================== DOCUMENT BUILDING ====================

  /**
   * Get document structure
   */
  getDocument(): Document {
    const state = this.stateManager.getState();
    return {
      pages: this.pages,
      paper: state.paper,
      initialState: {},
    };
  }

  /**
   * Generate final output with proper initialization and cleanup
   */
  finalize(): Uint8Array {
    // Add form feed if there's content on current page
    if (this.currentPageElements.length > 0) {
      this.formFeed();
    }

    return this.getOutput();
  }

  /**
   * Convert output to hex string
   */
  toHex(separator: string = ' '): string {
    return CommandBuilder.toHex(this.getOutput(), separator);
  }

  /**
   * Convert output to base64
   */
  toBase64(): string {
    const output = this.getOutput();
    // Use btoa for browser or Buffer for Node.js
    if (typeof btoa !== 'undefined') {
      return btoa(String.fromCharCode(...output));
    }
    return Buffer.from(output).toString('base64');
  }
}

export default LayoutEngine;
