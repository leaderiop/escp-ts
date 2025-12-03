/**
 * Virtual Renderer
 * Renders ESC/P2 output to a bitmap for preview purposes
 * This creates an in-memory representation of what would be printed
 */

import {
  ASCII,
  ESC_COMMANDS,
  createInitialState,
  calculateLineHeight,
  getPageHeight,
  getProportionalWidth,
  GRAPHICS_MODES,
  type PrinterState,
  type PaperConfig,
  type BitImageMode,
  type Typeface,
} from '@escp/core';
import { getGlyph } from './fonts';

/**
 * Virtual page bitmap
 */
export interface VirtualPage {
  /** Page number (0-indexed) */
  number: number;
  /** Page width in pixels */
  width: number;
  /** Page height in pixels */
  height: number;
  /** Bitmap data (1 byte per pixel, 0=white, 255=black) */
  data: Uint8Array;
}

/**
 * Render options
 */
export interface VirtualRenderOptions {
  /** Horizontal DPI (default: 360) */
  horizontalDpi: number;
  /** Vertical DPI (default: 360) */
  verticalDpi: number;
  /** Scale factor for output (default: 1) */
  scale: number;
  /** Show margins as gray lines (default: false) */
  showMargins: boolean;
  /** Margin line color (0-255) */
  marginColor: number;
}

/**
 * Default render options
 */
export const DEFAULT_RENDER_OPTIONS: VirtualRenderOptions = {
  horizontalDpi: 360,
  verticalDpi: 360,
  scale: 1,
  showMargins: false,
  marginColor: 200,
};

/**
 * Virtual Renderer class
 * Parses ESC/P2 commands and renders to a bitmap
 */
export class VirtualRenderer {
  private state: PrinterState;
  private options: VirtualRenderOptions;
  private pages: VirtualPage[] = [];
  private currentPage: VirtualPage | null = null;

  constructor(paper: Partial<PaperConfig> = {}, options: Partial<VirtualRenderOptions> = {}) {
    this.options = { ...DEFAULT_RENDER_OPTIONS, ...options };
    this.state = createInitialState(paper);
    this.initNewPage();
  }

  /**
   * Initialize a new page
   */
  private initNewPage(): void {
    const width = Math.round(
      this.state.paper.widthInches * this.options.horizontalDpi * this.options.scale
    );
    const height = Math.round(
      this.state.paper.heightInches * this.options.verticalDpi * this.options.scale
    );

    this.currentPage = {
      number: this.pages.length,
      width,
      height,
      data: new Uint8Array(width * height).fill(0), // White background
    };

    // Draw margins if enabled
    if (this.options.showMargins) {
      this.drawMargins();
    }
  }

  /**
   * Draw margin lines on current page
   */
  private drawMargins(): void {
    if (!this.currentPage) return;

    const { width, height, data } = this.currentPage;
    const color = this.options.marginColor;

    // Convert margin dots to pixels
    const leftPx = Math.round(
      (this.state.paper.margins.left / 360) * this.options.horizontalDpi * this.options.scale
    );
    const rightPx =
      width -
      Math.round(
        (this.state.paper.margins.right / 360) * this.options.horizontalDpi * this.options.scale
      );
    const topPx = Math.round(
      (this.state.paper.margins.top / 360) * this.options.verticalDpi * this.options.scale
    );
    const bottomPx =
      height -
      Math.round(
        (this.state.paper.margins.bottom / 360) * this.options.verticalDpi * this.options.scale
      );

    // Draw horizontal lines
    for (let x = 0; x < width; x++) {
      if (topPx >= 0 && topPx < height) data[topPx * width + x] = color;
      if (bottomPx >= 0 && bottomPx < height) data[bottomPx * width + x] = color;
    }

    // Draw vertical lines
    for (let y = 0; y < height; y++) {
      if (leftPx >= 0 && leftPx < width) data[y * width + leftPx] = color;
      if (rightPx >= 0 && rightPx < width) data[y * width + rightPx] = color;
    }
  }

  /**
   * Convert dot position to pixel position
   */
  private dotToPixel(dotX: number, dotY: number): { x: number; y: number } {
    return {
      x: Math.round((dotX / 360) * this.options.horizontalDpi * this.options.scale),
      y: Math.round((dotY / 360) * this.options.verticalDpi * this.options.scale),
    };
  }

  /**
   * Set a pixel on the current page
   */
  private setPixel(x: number, y: number, value = 255): void {
    if (!this.currentPage) return;
    const { width, height, data } = this.currentPage;

    if (x >= 0 && x < width && y >= 0 && y < height) {
      data[y * width + x] = value;
    }
  }

  /**
   * Draw a character at the given position
   */
  private drawChar(charCode: number, dotX: number, dotY: number): number {
    const fontData = getGlyph(this.state.font.typeface, charCode);
    const { x: px, y: py } = this.dotToPixel(dotX, dotY);

    // Calculate character dimensions based on font settings
    const charWidthDots = this.state.font.style.proportional
      ? getProportionalWidth(charCode)
      : Math.round(360 / this.state.font.cpi);

    const scaleX = ((charWidthDots / 360) * this.options.horizontalDpi * this.options.scale) / 8;
    const scaleY =
      ((this.state.lineSpacing / 360) * this.options.verticalDpi * this.options.scale) / 16;

    if (!fontData) return charWidthDots;

    // Draw the character bitmap
    for (let row = 0; row < 16; row++) {
      const rowData = fontData[row] ?? 0;
      for (let col = 0; col < 8; col++) {
        if ((rowData >> (7 - col)) & 1) {
          // Calculate scaled position
          const startX = Math.round(px + col * scaleX);
          const endX = Math.round(px + (col + 1) * scaleX);
          const startY = Math.round(py + row * scaleY);
          const endY = Math.round(py + (row + 1) * scaleY);

          // Fill scaled pixel block
          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              this.setPixel(x, y, 255);
            }
          }
        }
      }
    }

    // Apply bold by drawing again with offset
    if (this.state.font.style.bold) {
      for (let row = 0; row < 16; row++) {
        const rowData = fontData[row] ?? 0;
        for (let col = 0; col < 8; col++) {
          if ((rowData >> (7 - col)) & 1) {
            const startX = Math.round(px + col * scaleX) + 1;
            const endX = Math.round(px + (col + 1) * scaleX) + 1;
            const startY = Math.round(py + row * scaleY);
            const endY = Math.round(py + (row + 1) * scaleY);

            for (let y = startY; y < endY; y++) {
              for (let x = startX; x < endX; x++) {
                this.setPixel(x, y, 255);
              }
            }
          }
        }
      }
    }

    // Draw underline if enabled
    if (this.state.font.style.underline) {
      const underlineY = py + Math.round(14 * scaleY);
      const charWidthPx = Math.round(
        charWidthDots * (this.options.horizontalDpi / 360) * this.options.scale
      );
      for (let x = px; x < px + charWidthPx; x++) {
        this.setPixel(x, underlineY, 255);
      }
    }

    return charWidthDots + this.state.interCharSpace;
  }

  /**
   * Render text at current position
   */
  renderText(text: string): void {
    for (const char of text) {
      const charCode = char.charCodeAt(0);
      const width = this.drawChar(charCode, this.state.x, this.state.y);
      this.state.x += width;
    }
  }

  /**
   * Carriage return
   */
  carriageReturn(): void {
    this.state.x = this.state.paper.margins.left;
  }

  /**
   * Line feed
   */
  lineFeed(): void {
    const lineHeight = calculateLineHeight(
      this.state.lineSpacing,
      this.state.font.style.doubleHeight
    );
    this.state.y += lineHeight;

    // Check for page break
    const maxY = getPageHeight(this.state.paper) - this.state.paper.margins.bottom;
    if (this.state.y >= maxY) {
      this.formFeed();
    }
  }

  /**
   * Form feed (new page)
   */
  formFeed(): void {
    if (this.currentPage) {
      this.pages.push(this.currentPage);
    }
    this.state.x = this.state.paper.margins.left;
    this.state.y = this.state.paper.margins.top;
    this.initNewPage();
  }

  /**
   * Render graphics data
   */
  renderGraphics(mode: BitImageMode, width: number, data: Uint8Array): void {
    const modeInfo = GRAPHICS_MODES[mode];
    if (!modeInfo) return;

    const bytesPerColumn = modeInfo.bytesPerColumn;

    let dataIdx = 0;
    for (let col = 0; col < width && dataIdx < data.length; col++) {
      for (let byteNum = 0; byteNum < bytesPerColumn && dataIdx < data.length; byteNum++) {
        const byte = data[dataIdx++] ?? 0;
        for (let bit = 0; bit < 8; bit++) {
          if ((byte >> (7 - bit)) & 1) {
            const pinY = byteNum * 8 + bit;
            const dotX = this.state.x + col;
            const dotY = this.state.y + pinY * 2; // 24-pin spacing

            const { x: px, y: py } = this.dotToPixel(dotX, dotY);
            this.setPixel(px, py, 255);
          }
        }
      }
    }

    this.state.x += width;
  }

  /**
   * Parse and render ESC/P2 command stream
   */
  render(data: Uint8Array): void {
    let i = 0;

    while (i < data.length) {
      const byte = data[i];
      if (byte === undefined) break;

      if (byte === ASCII.ESC && i + 1 < data.length) {
        const cmd = data[i + 1];
        i += 2;

        switch (cmd) {
          case ESC_COMMANDS.INITIALIZE: // ESC @
            this.state = createInitialState(this.state.paper);
            break;

          case ESC_COMMANDS.LINE_SPACING_1_6: // ESC 2
            this.state.lineSpacing = 60;
            break;

          case ESC_COMMANDS.LINE_SPACING_1_8: // ESC 0
            this.state.lineSpacing = 45;
            break;

          case ESC_COMMANDS.LINE_SPACING_N_180: // ESC 3 n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.lineSpacing = Math.round((n / 180) * 360);
            }
            break;

          case ESC_COMMANDS.LINE_SPACING_N_360: // ESC + n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.lineSpacing = n;
            }
            break;

          case ESC_COMMANDS.BOLD_ON: // ESC E
            this.state.font.style.bold = true;
            break;

          case ESC_COMMANDS.BOLD_OFF: // ESC F
            this.state.font.style.bold = false;
            break;

          case ESC_COMMANDS.ITALIC_ON: // ESC 4
            this.state.font.style.italic = true;
            break;

          case ESC_COMMANDS.ITALIC_OFF: // ESC 5
            this.state.font.style.italic = false;
            break;

          case ESC_COMMANDS.UNDERLINE: // ESC - n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.font.style.underline = n !== 0;
            }
            break;

          case ESC_COMMANDS.DOUBLE_WIDTH: // ESC W n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.font.style.doubleWidth = n !== 0;
            }
            break;

          case ESC_COMMANDS.DOUBLE_HEIGHT: // ESC w n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.font.style.doubleHeight = n !== 0;
            }
            break;

          case ESC_COMMANDS.PICA: // ESC P
            this.state.font.cpi = 10;
            break;

          case ESC_COMMANDS.ELITE: // ESC M
            this.state.font.cpi = 12;
            break;

          case ESC_COMMANDS.MICRON: // ESC g
            this.state.font.cpi = 15;
            break;

          case ESC_COMMANDS.PROPORTIONAL: // ESC p n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.font.style.proportional = n !== 0;
            }
            break;

          case ESC_COMMANDS.TYPEFACE: // ESC k n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.font.typeface = n as Typeface;
            }
            break;

          case ESC_COMMANDS.ABSOLUTE_HORZ_POS: // ESC $ nL nH
            if (i + 1 < data.length) {
              const nL = data[i++] ?? 0;
              const nH = data[i++] ?? 0;
              const pos = nL + nH * 256;
              // Position is absolute from page origin (0,0)
              // Units are 1/60 inch, convert to 360 DPI dots
              this.state.x = pos * 6;
            }
            break;

          case ESC_COMMANDS.ADVANCE_VERTICAL: // ESC J n
            if (i < data.length) {
              const n = data[i++] ?? 0;
              this.state.y += Math.round((n / 180) * 360);
            }
            break;

          case ESC_COMMANDS.BIT_IMAGE: // ESC * m nL nH data
            if (i + 2 < data.length) {
              const mode = data[i++] as BitImageMode;
              const nL = data[i++] ?? 0;
              const nH = data[i++] ?? 0;
              const width = nL + nH * 256;
              const modeInfo = GRAPHICS_MODES[mode];
              if (modeInfo) {
                const dataLen = width * modeInfo.bytesPerColumn;
                if (i + dataLen <= data.length) {
                  const graphicsData = data.slice(i, i + dataLen);
                  this.renderGraphics(mode, width, graphicsData);
                  i += dataLen;
                }
              }
            }
            break;

          default:
            // Unknown command, skip
            break;
        }
      } else if (byte === ASCII.CR) {
        this.carriageReturn();
        i++;
      } else if (byte === ASCII.LF) {
        this.lineFeed();
        i++;
      } else if (byte === ASCII.FF) {
        this.formFeed();
        i++;
      } else if (byte >= 32 && byte < 127) {
        // Printable ASCII
        const width = this.drawChar(byte, this.state.x, this.state.y);
        this.state.x += width;
        i++;
      } else if (byte >= 0xb3 && byte <= 0xda) {
        // CP437 box-drawing characters
        const width = this.drawChar(byte, this.state.x, this.state.y);
        this.state.x += width;
        i++;
      } else {
        // Skip other control characters
        i++;
      }
    }
  }

  /**
   * Get all rendered pages
   */
  getPages(): VirtualPage[] {
    // Include current page if it has content
    const result = [...this.pages];
    if (this.currentPage && this.state.y > this.state.paper.margins.top) {
      result.push(this.currentPage);
    }
    return result;
  }

  /**
   * Get single page (for simple documents)
   */
  getPage(index = 0): VirtualPage | null {
    const pages = this.getPages();
    return pages[index] ?? null;
  }

  /**
   * Reset renderer to initial state
   */
  reset(): void {
    this.pages = [];
    this.state = createInitialState(this.state.paper);
    this.initNewPage();
  }
}

export default VirtualRenderer;
