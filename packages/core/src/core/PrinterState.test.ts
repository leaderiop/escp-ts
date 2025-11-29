import { describe, it, expect, beforeEach } from 'vitest';
import {
  PrinterStateManager,
  createInitialState,
  calculateHMI,
  calculateCharWidth,
  calculateLineHeight,
  getPrintableWidth,
  getPrintableHeight,
  getPageWidth,
  getPageHeight,
  isInPrintableArea,
  getMaxX,
  getMaxY,
  inchesToDots,
  dotsToInches,
  mmToDots,
  dotsToMm,
  columnsToDots,
  linesToDots,
  DEFAULT_FONT_STYLE,
  DEFAULT_FONT_CONFIG,
  DEFAULT_MARGINS,
  DEFAULT_PAPER_CONFIG,
} from './PrinterState';
import type { FontConfig, PaperConfig } from './types';

describe('PrinterState', () => {
  // ==================== DEFAULTS ====================

  describe('defaults', () => {
    it('DEFAULT_FONT_STYLE has all styles disabled', () => {
      expect(DEFAULT_FONT_STYLE.bold).toBe(false);
      expect(DEFAULT_FONT_STYLE.italic).toBe(false);
      expect(DEFAULT_FONT_STYLE.underline).toBe(false);
      expect(DEFAULT_FONT_STYLE.doubleStrike).toBe(false);
      expect(DEFAULT_FONT_STYLE.superscript).toBe(false);
      expect(DEFAULT_FONT_STYLE.subscript).toBe(false);
      expect(DEFAULT_FONT_STYLE.doubleWidth).toBe(false);
      expect(DEFAULT_FONT_STYLE.doubleHeight).toBe(false);
      expect(DEFAULT_FONT_STYLE.condensed).toBe(false);
      expect(DEFAULT_FONT_STYLE.proportional).toBe(false);
    });

    it('DEFAULT_FONT_CONFIG has correct values', () => {
      expect(DEFAULT_FONT_CONFIG.typeface).toBe(0); // ROMAN
      expect(DEFAULT_FONT_CONFIG.cpi).toBe(10);
      expect(DEFAULT_FONT_CONFIG.quality).toBe(0); // DRAFT
    });

    it('DEFAULT_MARGINS has correct values', () => {
      expect(DEFAULT_MARGINS.top).toBe(90);
      expect(DEFAULT_MARGINS.bottom).toBe(90);
      expect(DEFAULT_MARGINS.left).toBe(225);
      expect(DEFAULT_MARGINS.right).toBe(225);
    });

    it('DEFAULT_PAPER_CONFIG has custom wide format dimensions', () => {
      expect(DEFAULT_PAPER_CONFIG.widthInches).toBeCloseTo(1069 / 72); // 14.847 inches
      expect(DEFAULT_PAPER_CONFIG.heightInches).toBeCloseTo(615 / 72); // 8.542 inches
      expect(DEFAULT_PAPER_CONFIG.linesPerPage).toBe(51);
    });
  });

  // ==================== createInitialState ====================

  describe('createInitialState', () => {
    it('creates state with defaults', () => {
      const state = createInitialState();

      expect(state.x).toBe(225); // Left margin
      expect(state.y).toBe(90); // Top margin
      expect(state.page).toBe(0);
      expect(state.font.cpi).toBe(10);
      expect(state.lineSpacing).toBe(60); // 1/6 inch
      expect(state.interCharSpace).toBe(0);
    });

    it('merges custom paper config', () => {
      const state = createInitialState({
        widthInches: 14,
        heightInches: 11,
        margins: { top: 50, left: 50 },
      });

      expect(state.paper.widthInches).toBe(14);
      expect(state.paper.margins.top).toBe(50);
      expect(state.paper.margins.left).toBe(50);
      expect(state.paper.margins.bottom).toBe(90); // Default
      expect(state.paper.margins.right).toBe(225); // Default
    });

    it('merges custom font config', () => {
      const state = createInitialState(
        {},
        {
          cpi: 12,
          style: { bold: true },
        }
      );

      expect(state.font.cpi).toBe(12);
      expect(state.font.style.bold).toBe(true);
      expect(state.font.style.italic).toBe(false); // Default
    });

    it('calculates correct HMI', () => {
      const state = createInitialState();
      expect(state.hmi).toBe(36); // 360/10 = 36 dots per char at 10 CPI
    });

    it('sets default tabs', () => {
      const state = createInitialState();
      expect(state.horizontalTabs.length).toBeGreaterThan(0);
      expect(state.horizontalTabs[0]).toBe(8);
      expect(state.verticalTabs).toEqual([]);
    });

    it('sets default units', () => {
      const state = createInitialState();
      expect(state.units.base).toBe(1440);
      expect(state.units.horizontal).toBe(4);
      expect(state.units.vertical).toBe(4);
    });

    it('initializes graphics state', () => {
      const state = createInitialState();
      expect(state.graphics.mode).toBeDefined();
      expect(state.graphics.reassignedModes).toBeInstanceOf(Map);
    });
  });

  // ==================== calculateHMI ====================

  describe('calculateHMI', () => {
    it('calculates HMI for 10 CPI', () => {
      expect(calculateHMI(10, false)).toBe(36); // 360/10
    });

    it('calculates HMI for 12 CPI', () => {
      expect(calculateHMI(12, false)).toBe(30); // 360/12
    });

    it('calculates HMI for 15 CPI', () => {
      expect(calculateHMI(15, false)).toBe(24); // 360/15
    });

    it('applies condensed reduction', () => {
      const normal = calculateHMI(10, false);
      const condensed = calculateHMI(10, true);
      expect(condensed).toBe(Math.round(normal * 0.6));
    });
  });

  // ==================== calculateCharWidth ====================

  describe('calculateCharWidth', () => {
    const baseFont: FontConfig = {
      typeface: 0,
      cpi: 10,
      quality: 1,
      style: { ...DEFAULT_FONT_STYLE },
    };

    it('calculates normal character width', () => {
      expect(calculateCharWidth(baseFont, 0)).toBe(36);
    });

    it('doubles width for double-width mode', () => {
      const font = { ...baseFont, style: { ...baseFont.style, doubleWidth: true } };
      expect(calculateCharWidth(font, 0)).toBe(72);
    });

    it('adds intercharacter space', () => {
      expect(calculateCharWidth(baseFont, 5)).toBe(41);
    });

    it('combines modifiers correctly', () => {
      const font = { ...baseFont, style: { ...baseFont.style, doubleWidth: true } };
      expect(calculateCharWidth(font, 10)).toBe(82); // 72 + 10
    });

    it('handles condensed mode', () => {
      const font = { ...baseFont, style: { ...baseFont.style, condensed: true } };
      const width = calculateCharWidth(font, 0);
      expect(width).toBe(22); // Condensed reduces width
    });
  });

  // ==================== calculateLineHeight ====================

  describe('calculateLineHeight', () => {
    it('returns line spacing for normal height', () => {
      expect(calculateLineHeight(60, false)).toBe(60);
    });

    it('doubles height for double-height mode', () => {
      expect(calculateLineHeight(60, true)).toBe(120);
    });

    it('works with different line spacings', () => {
      expect(calculateLineHeight(45, false)).toBe(45);
      expect(calculateLineHeight(45, true)).toBe(90);
    });
  });

  // ==================== Page dimensions ====================

  describe('page dimension functions', () => {
    const paper: PaperConfig = {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 90, bottom: 90, left: 90, right: 90 },
      linesPerPage: 66,
    };

    it('getPageWidth returns total width in dots', () => {
      expect(getPageWidth(paper)).toBe(3060); // 8.5 * 360
    });

    it('getPageHeight returns total height in dots', () => {
      expect(getPageHeight(paper)).toBe(3960); // 11 * 360
    });

    it('getPrintableWidth subtracts margins', () => {
      expect(getPrintableWidth(paper)).toBe(2880); // 3060 - 90 - 90
    });

    it('getPrintableHeight subtracts margins', () => {
      expect(getPrintableHeight(paper)).toBe(3780); // 3960 - 90 - 90
    });

    it('getMaxX returns right edge minus margin', () => {
      expect(getMaxX(paper)).toBe(2970); // 3060 - 90
    });

    it('getMaxY returns bottom edge minus margin', () => {
      expect(getMaxY(paper)).toBe(3870); // 3960 - 90
    });
  });

  // ==================== isInPrintableArea ====================

  describe('isInPrintableArea', () => {
    const paper: PaperConfig = {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 90, bottom: 90, left: 90, right: 90 },
      linesPerPage: 66,
    };

    it('returns true for position within printable area', () => {
      expect(isInPrintableArea(100, 100, paper)).toBe(true);
      expect(isInPrintableArea(1500, 2000, paper)).toBe(true);
    });

    it('returns false for position left of left margin', () => {
      expect(isInPrintableArea(50, 100, paper)).toBe(false);
    });

    it('returns false for position above top margin', () => {
      expect(isInPrintableArea(100, 50, paper)).toBe(false);
    });

    it('returns false for position right of right margin', () => {
      expect(isInPrintableArea(3000, 100, paper)).toBe(false);
    });

    it('returns false for position below bottom margin', () => {
      expect(isInPrintableArea(100, 3900, paper)).toBe(false);
    });

    it('returns true at exact boundary', () => {
      expect(isInPrintableArea(90, 90, paper)).toBe(true); // Top-left corner
      expect(isInPrintableArea(2970, 3870, paper)).toBe(true); // Bottom-right corner
    });
  });

  // ==================== Unit conversions ====================

  describe('unit conversions', () => {
    describe('inchesToDots', () => {
      it('converts 1 inch to 360 dots', () => {
        expect(inchesToDots(1)).toBe(360);
      });

      it('converts fractional inches', () => {
        expect(inchesToDots(0.5)).toBe(180);
        expect(inchesToDots(0.25)).toBe(90);
      });
    });

    describe('dotsToInches', () => {
      it('converts 360 dots to 1 inch', () => {
        expect(dotsToInches(360)).toBe(1);
      });

      it('converts other values', () => {
        expect(dotsToInches(180)).toBe(0.5);
        expect(dotsToInches(90)).toBe(0.25);
      });
    });

    describe('mmToDots', () => {
      it('converts millimeters to dots', () => {
        // 25.4mm = 1 inch = 360 dots
        expect(mmToDots(25.4)).toBe(360);
      });

      it('converts 10mm', () => {
        expect(mmToDots(10)).toBe(142); // ~10/25.4 * 360
      });
    });

    describe('dotsToMm', () => {
      it('converts dots to millimeters', () => {
        expect(dotsToMm(360)).toBeCloseTo(25.4);
      });

      it('converts 180 dots', () => {
        expect(dotsToMm(180)).toBeCloseTo(12.7);
      });
    });

    describe('columnsToDots', () => {
      it('converts columns at 10 CPI', () => {
        expect(columnsToDots(1, 10)).toBe(36);
        expect(columnsToDots(10, 10)).toBe(360);
      });

      it('converts columns at 12 CPI', () => {
        expect(columnsToDots(12, 12)).toBe(360);
      });
    });

    describe('linesToDots', () => {
      it('converts lines to dots', () => {
        expect(linesToDots(1, 60)).toBe(60);
        expect(linesToDots(6, 60)).toBe(360);
      });

      it('works with different line spacings', () => {
        expect(linesToDots(8, 45)).toBe(360); // 1/8 inch spacing
      });
    });
  });

  // ==================== PrinterStateManager ====================

  describe('PrinterStateManager', () => {
    let manager: PrinterStateManager;

    beforeEach(() => {
      manager = new PrinterStateManager();
    });

    describe('constructor', () => {
      it('creates with default state', () => {
        const state = manager.getState();
        expect(state.x).toBe(225); // Left margin
        expect(state.y).toBe(90); // Top margin
      });

      it('accepts initial state overrides', () => {
        const customManager = new PrinterStateManager({
          x: 200,
          y: 300,
          lineSpacing: 45,
        });
        const state = customManager.getState();
        expect(state.x).toBe(200);
        expect(state.y).toBe(300);
        expect(state.lineSpacing).toBe(45);
      });
    });

    describe('getState', () => {
      it('returns current state', () => {
        const state = manager.getState();
        expect(state).toBeDefined();
        expect(state.font).toBeDefined();
        expect(state.paper).toBeDefined();
      });
    });

    describe('getMutableState', () => {
      it('returns mutable reference', () => {
        const state = manager.getMutableState();
        state.x = 500;
        expect(manager.getState().x).toBe(500);
      });
    });

    describe('updateState', () => {
      it('updates state properties', () => {
        manager.updateState({ lineSpacing: 45 });
        expect(manager.getState().lineSpacing).toBe(45);
      });

      it('saves history', () => {
        manager.updateState({ lineSpacing: 45 });
        expect(manager.undo()).toBe(true);
        expect(manager.getState().lineSpacing).toBe(60);
      });
    });

    describe('updateFont', () => {
      it('updates font properties', () => {
        manager.updateFont({ cpi: 12 });
        expect(manager.getState().font.cpi).toBe(12);
      });

      it('recalculates HMI when CPI changes', () => {
        manager.updateFont({ cpi: 12 });
        expect(manager.getState().hmi).toBe(30); // 360/12
      });

      it('preserves existing style when updating font', () => {
        manager.updateFontStyle({ bold: true });
        manager.updateFont({ cpi: 12 });
        expect(manager.getState().font.style.bold).toBe(true);
      });

      it('recalculates HMI when condensed style changes via updateFont', () => {
        manager.updateFont({ style: { condensed: true } });
        expect(manager.getState().hmi).toBe(22); // Condensed 10 CPI
      });
    });

    describe('updateFontStyle', () => {
      it('updates font style', () => {
        manager.updateFontStyle({ bold: true, italic: true });
        expect(manager.getState().font.style.bold).toBe(true);
        expect(manager.getState().font.style.italic).toBe(true);
      });

      it('recalculates HMI when condensed changes', () => {
        manager.updateFontStyle({ condensed: true });
        expect(manager.getState().hmi).toBe(22);
      });
    });

    describe('moveTo', () => {
      it('moves to absolute position', () => {
        manager.moveTo(500, 600);
        expect(manager.getState().x).toBe(500);
        expect(manager.getState().y).toBe(600);
      });

      it('clamps to left margin', () => {
        manager.moveTo(0, 100);
        expect(manager.getState().x).toBe(225); // Left margin
      });

      it('clamps to top margin', () => {
        manager.moveTo(100, 0);
        expect(manager.getState().y).toBe(90); // Top margin
      });
    });

    describe('moveBy', () => {
      it('moves by relative offset', () => {
        const initialX = manager.getState().x;
        const initialY = manager.getState().y;
        manager.moveBy(100, 50);
        expect(manager.getState().x).toBe(initialX + 100);
        expect(manager.getState().y).toBe(initialY + 50);
      });
    });

    describe('advanceX', () => {
      it('advances by character width', () => {
        const initialX = manager.getState().x;
        manager.advanceX(1);
        expect(manager.getState().x).toBe(initialX + 36); // 10 CPI = 36 dots
      });

      it('advances by multiple characters', () => {
        const initialX = manager.getState().x;
        manager.advanceX(5);
        expect(manager.getState().x).toBe(initialX + 180);
      });
    });

    describe('carriageReturn', () => {
      it('moves to left margin', () => {
        manager.moveTo(500, 200);
        manager.carriageReturn();
        expect(manager.getState().x).toBe(225); // Left margin
        expect(manager.getState().y).toBe(200); // Y unchanged
      });
    });

    describe('lineFeed', () => {
      it('advances by line spacing', () => {
        const initialY = manager.getState().y;
        manager.lineFeed();
        expect(manager.getState().y).toBe(initialY + 60);
      });

      it('triggers page break when needed', () => {
        manager.moveTo(100, 3900); // Near bottom
        manager.lineFeed();
        expect(manager.getState().page).toBe(1);
        expect(manager.getState().y).toBe(90); // Reset to top margin
      });
    });

    describe('newLine', () => {
      it('performs CR + LF', () => {
        manager.moveTo(500, 200);
        manager.newLine();
        expect(manager.getState().x).toBe(225); // Left margin
        expect(manager.getState().y).toBe(260);
      });
    });

    describe('formFeed', () => {
      it('increments page counter', () => {
        expect(manager.getState().page).toBe(0);
        manager.formFeed();
        expect(manager.getState().page).toBe(1);
      });

      it('resets position to top-left margin', () => {
        manager.moveTo(500, 2000);
        manager.formFeed();
        expect(manager.getState().x).toBe(225); // Left margin
        expect(manager.getState().y).toBe(90); // Top margin
      });
    });

    describe('checkPageBreak', () => {
      it('returns false when not at page break', () => {
        expect(manager.checkPageBreak()).toBe(false);
      });

      it('returns true and feeds page when past bottom margin', () => {
        manager.moveTo(100, 4000); // Past bottom
        expect(manager.checkPageBreak()).toBe(true);
        expect(manager.getState().page).toBe(1);
      });
    });

    describe('checkLineWrap', () => {
      it('returns false when within margins', () => {
        expect(manager.checkLineWrap()).toBe(false);
      });

      it('returns true when at right margin', () => {
        // Paper width: 1069/72 * 360 = 5345 dots, right margin: 225 dots
        // Right edge: 5345 - 225 = 5120 dots
        manager.moveTo(5050, 100); // Near right edge
        expect(manager.checkLineWrap(100)).toBe(true);
      });
    });

    describe('wrapLine', () => {
      it('returns false when no wrap needed', () => {
        expect(manager.wrapLine()).toBe(false);
      });

      it('wraps and returns true when needed', () => {
        manager.moveTo(5500, 100); // Past right edge
        expect(manager.wrapLine()).toBe(true);
        expect(manager.getState().x).toBe(225); // Left margin
        expect(manager.getState().y).toBe(160);
      });
    });

    describe('horizontalTab', () => {
      it('moves to next tab stop', () => {
        manager.moveTo(225, 100); // At left margin
        manager.horizontalTab();
        expect(manager.getState().x).toBe(225 + 8 * 36); // First tab at column 8
      });

      it('does nothing when no more tabs', () => {
        manager.moveTo(225 + 130 * 36, 100); // Past all tabs
        const x = manager.getState().x;
        manager.horizontalTab();
        expect(manager.getState().x).toBe(x);
      });
    });

    describe('verticalTab', () => {
      it('moves to next vertical tab when set', () => {
        manager.updateState({ verticalTabs: [10, 20, 30] });
        manager.moveTo(100, 90);
        manager.verticalTab();
        expect(manager.getState().y).toBe(90 + 10 * 60);
      });

      it('does nothing when no vertical tabs', () => {
        const y = manager.getState().y;
        manager.verticalTab();
        expect(manager.getState().y).toBe(y);
      });
    });

    describe('getNextHorizontalTab', () => {
      it('returns next tab position', () => {
        manager.moveTo(225, 100); // At left margin
        const nextTab = manager.getNextHorizontalTab();
        expect(nextTab).toBe(225 + 8 * 36);
      });

      it('returns null when no more tabs', () => {
        manager.moveTo(225 + 130 * 36, 100); // Past all tabs
        expect(manager.getNextHorizontalTab()).toBeNull();
      });
    });

    describe('getNextVerticalTab', () => {
      it('returns next tab position when set', () => {
        manager.updateState({ verticalTabs: [10, 20] });
        manager.moveTo(100, 90);
        expect(manager.getNextVerticalTab()).toBe(90 + 10 * 60);
      });

      it('returns null when no tabs set', () => {
        expect(manager.getNextVerticalTab()).toBeNull();
      });
    });

    describe('reset', () => {
      it('resets to initial state', () => {
        manager.moveTo(500, 500);
        manager.updateFontStyle({ bold: true });
        manager.reset();
        expect(manager.getState().x).toBe(225); // Left margin
        expect(manager.getState().y).toBe(90); // Top margin
        expect(manager.getState().font.style.bold).toBe(false);
      });

      it('preserves paper configuration', () => {
        const customManager = new PrinterStateManager({
          paper: { widthInches: 14 },
        });
        customManager.reset();
        expect(customManager.getState().paper.widthInches).toBe(14);
      });
    });

    describe('undo', () => {
      it('restores previous state', () => {
        manager.updateState({ lineSpacing: 45 });
        expect(manager.getState().lineSpacing).toBe(45);
        expect(manager.undo()).toBe(true);
        expect(manager.getState().lineSpacing).toBe(60);
      });

      it('returns false when no history', () => {
        expect(manager.undo()).toBe(false);
      });

      it('handles multiple undos', () => {
        manager.updateState({ lineSpacing: 45 });
        manager.updateState({ lineSpacing: 30 });
        expect(manager.getState().lineSpacing).toBe(30);
        manager.undo();
        expect(manager.getState().lineSpacing).toBe(45);
        manager.undo();
        expect(manager.getState().lineSpacing).toBe(60);
      });
    });

    describe('clone', () => {
      it('creates independent copy', () => {
        manager.moveTo(500, 500);
        const cloned = manager.clone();

        expect(cloned.getState().x).toBe(500);
        expect(cloned.getState().y).toBe(500);

        // Modify original
        manager.moveTo(100, 100);
        expect(cloned.getState().x).toBe(500); // Clone unchanged
      });

      it('preserves graphics reassignedModes map', () => {
        manager.getMutableState().graphics.reassignedModes.set(1, 33);
        const cloned = manager.clone();
        expect(cloned.getState().graphics.reassignedModes.get(1)).toBe(33);
      });
    });
  });
});
