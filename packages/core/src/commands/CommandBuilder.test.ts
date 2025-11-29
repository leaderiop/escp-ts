import { describe, it, expect } from 'vitest';
import { CommandBuilder } from './CommandBuilder';
import { ASCII, ESC_COMMANDS, BIT_IMAGE_MODE, TYPEFACE, JUSTIFICATION } from '../core/constants';
import { EscpRangeError, EncodingError } from '../core/errors';

describe('CommandBuilder', () => {
  // ==================== PRINTER CONTROL ====================

  describe('Printer Control', () => {
    it('initialize() returns ESC @', () => {
      const result = CommandBuilder.initialize();
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.INITIALIZE]));
    });

    it('paperControl() returns correct bytes', () => {
      const result = CommandBuilder.paperControl(1);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.PAPER_LOAD, 1]));
    });
  });

  // ==================== LINE SPACING ====================

  describe('Line Spacing', () => {
    it('lineSpacing1_8() returns ESC 0', () => {
      const result = CommandBuilder.lineSpacing1_8();
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_1_8]));
    });

    it('lineSpacing7_60() returns ESC 1', () => {
      const result = CommandBuilder.lineSpacing7_60();
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_7_60]));
    });

    it('lineSpacing1_6() returns ESC 2', () => {
      const result = CommandBuilder.lineSpacing1_6();
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_1_6]));
    });

    it('lineSpacingN180(n) returns ESC 3 n', () => {
      const result = CommandBuilder.lineSpacingN180(24);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_180, 24]));
    });

    it('lineSpacingN60(n) returns ESC A n', () => {
      const result = CommandBuilder.lineSpacingN60(10);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_60, 10]));
    });

    it('lineSpacingN360(n) returns ESC + n', () => {
      const result = CommandBuilder.lineSpacingN360(48);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_360, 48]));
    });

    it('lineSpacingN180 throws for invalid values', () => {
      expect(() => CommandBuilder.lineSpacingN180(-1)).toThrow(EscpRangeError);
      expect(() => CommandBuilder.lineSpacingN180(256)).toThrow(EscpRangeError);
    });

    it('lineSpacingN60 throws for invalid values', () => {
      expect(() => CommandBuilder.lineSpacingN60(-1)).toThrow(EscpRangeError);
      expect(() => CommandBuilder.lineSpacingN60(256)).toThrow(EscpRangeError);
    });

    it('lineSpacingN360 throws for invalid values', () => {
      expect(() => CommandBuilder.lineSpacingN360(-1)).toThrow(EscpRangeError);
      expect(() => CommandBuilder.lineSpacingN360(256)).toThrow(EscpRangeError);
    });

    describe('setLineSpacingInches', () => {
      it('uses 1/360 inch for small values', () => {
        const result = CommandBuilder.setLineSpacingInches(0.1);
        // 0.1 inch * 360 = 36
        expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_360, 36]));
      });

      it('uses 1/180 inch when 1/360 overflows', () => {
        const result = CommandBuilder.setLineSpacingInches(0.8);
        // 0.8 inch * 180 = 144
        expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LINE_SPACING_N_180, 144]));
      });
    });
  });

  // ==================== PRINT POSITION ====================

  describe('Print Position', () => {
    it('absoluteHorizontalPosition encodes correctly', () => {
      const result = CommandBuilder.absoluteHorizontalPosition(300);
      // 300 = 0x012C -> nL=44, nH=1
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.ABSOLUTE_HORZ_POS, 44, 1]));
    });

    it('absoluteHorizontalPosition(0) encodes as [0, 0]', () => {
      const result = CommandBuilder.absoluteHorizontalPosition(0);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.ABSOLUTE_HORZ_POS, 0, 0]));
    });

    it('absoluteHorizontalPosition max value (65535)', () => {
      const result = CommandBuilder.absoluteHorizontalPosition(65535);
      expect(result).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.ABSOLUTE_HORZ_POS, 0xff, 0xff])
      );
    });

    it('relativeHorizontalPosition with positive offset', () => {
      const result = CommandBuilder.relativeHorizontalPosition(100);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.RELATIVE_HORZ_POS, 100, 0]));
    });

    it("relativeHorizontalPosition with negative offset (two's complement)", () => {
      const result = CommandBuilder.relativeHorizontalPosition(-100);
      // -100 in two's complement: 65536 - 100 = 65436 = 0xFF9C -> nL=156, nH=255
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.RELATIVE_HORZ_POS, 156, 255]));
    });

    it('advanceVertical(n) returns ESC J n', () => {
      const result = CommandBuilder.advanceVertical(50);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.ADVANCE_VERTICAL, 50]));
    });

    it('carriageReturn() returns CR', () => {
      expect(CommandBuilder.carriageReturn()).toEqual(new Uint8Array([ASCII.CR]));
    });

    it('lineFeed() returns LF', () => {
      expect(CommandBuilder.lineFeed()).toEqual(new Uint8Array([ASCII.LF]));
    });

    it('formFeed() returns FF', () => {
      expect(CommandBuilder.formFeed()).toEqual(new Uint8Array([ASCII.FF]));
    });
  });

  // ==================== PAGE FORMAT ====================

  describe('Page Format', () => {
    it('setPageLengthLines() sets page length', () => {
      const result = CommandBuilder.setPageLengthLines(66);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.PAGE_LENGTH_LINES, 66]));
    });

    it('setPageLengthLines() throws for invalid lines', () => {
      expect(() => CommandBuilder.setPageLengthLines(0)).toThrow(EscpRangeError);
      expect(() => CommandBuilder.setPageLengthLines(128)).toThrow(EscpRangeError);
    });

    it('setPageLengthInches() sets page length in inches', () => {
      const result = CommandBuilder.setPageLengthInches(11);
      expect(result).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.PAGE_LENGTH_LINES, ASCII.NUL, 11])
      );
    });

    it('setBottomMargin() sets bottom margin', () => {
      const result = CommandBuilder.setBottomMargin(6);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.BOTTOM_MARGIN, 6]));
    });

    it('cancelBottomMargin() returns ESC O', () => {
      expect(CommandBuilder.cancelBottomMargin()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.CANCEL_BOTTOM_MARGIN])
      );
    });

    it('setLeftMargin() sets left margin', () => {
      const result = CommandBuilder.setLeftMargin(10);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.LEFT_MARGIN, 10]));
    });

    it('setRightMargin() sets right margin', () => {
      const result = CommandBuilder.setRightMargin(80);
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.RIGHT_MARGIN, 80]));
    });
  });

  // ==================== TABS ====================

  describe('Tabs', () => {
    it('setHorizontalTabs() sets up to 32 tab stops', () => {
      const positions = [8, 16, 24, 32];
      const result = CommandBuilder.setHorizontalTabs(positions);
      expect(result).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.HORIZONTAL_TABS, 8, 16, 24, 32, ASCII.NUL])
      );
    });

    it('setHorizontalTabs() sorts positions', () => {
      const positions = [32, 8, 24, 16];
      const result = CommandBuilder.setHorizontalTabs(positions);
      expect(result).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.HORIZONTAL_TABS, 8, 16, 24, 32, ASCII.NUL])
      );
    });

    it('setVerticalTabs() sets tab stops', () => {
      const positions = [10, 20, 30];
      const result = CommandBuilder.setVerticalTabs(positions);
      expect(result).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.VERTICAL_TAB_STOPS, 10, 20, 30, ASCII.NUL])
      );
    });

    it('horizontalTab() returns HT', () => {
      expect(CommandBuilder.horizontalTab()).toEqual(new Uint8Array([ASCII.HT]));
    });

    it('verticalTab() returns VT', () => {
      expect(CommandBuilder.verticalTab()).toEqual(new Uint8Array([ASCII.VT]));
    });
  });

  // ==================== FONT SELECTION ====================

  describe('Font Selection', () => {
    it('selectPica() returns ESC P (10 CPI)', () => {
      expect(CommandBuilder.selectPica()).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.PICA]));
    });

    it('selectElite() returns ESC M (12 CPI)', () => {
      expect(CommandBuilder.selectElite()).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.ELITE]));
    });

    it('selectMicron() returns ESC g (15 CPI)', () => {
      expect(CommandBuilder.selectMicron()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.MICRON])
      );
    });

    it('selectCondensed() returns SI', () => {
      expect(CommandBuilder.selectCondensed()).toEqual(new Uint8Array([ASCII.SI]));
    });

    it('cancelCondensed() returns DC2', () => {
      expect(CommandBuilder.cancelCondensed()).toEqual(new Uint8Array([ASCII.DC2]));
    });

    it('setProportional(true) enables proportional', () => {
      expect(CommandBuilder.setProportional(true)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.PROPORTIONAL, 1])
      );
    });

    it('setProportional(false) disables proportional', () => {
      expect(CommandBuilder.setProportional(false)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.PROPORTIONAL, 0])
      );
    });

    it('selectTypeface() selects typeface', () => {
      expect(CommandBuilder.selectTypeface(TYPEFACE.COURIER)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.TYPEFACE, TYPEFACE.COURIER])
      );
    });

    it('selectQuality(0) selects draft', () => {
      expect(CommandBuilder.selectQuality(0)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.PRINT_QUALITY, 0])
      );
    });

    it('selectQuality(1) selects LQ', () => {
      expect(CommandBuilder.selectQuality(1)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.PRINT_QUALITY, 1])
      );
    });
  });

  // ==================== FONT STYLE ====================

  describe('Font Style', () => {
    it('boldOn() returns ESC E', () => {
      expect(CommandBuilder.boldOn()).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.BOLD_ON]));
    });

    it('boldOff() returns ESC F', () => {
      expect(CommandBuilder.boldOff()).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.BOLD_OFF]));
    });

    it('italicOn() returns ESC 4', () => {
      expect(CommandBuilder.italicOn()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.ITALIC_ON])
      );
    });

    it('italicOff() returns ESC 5', () => {
      expect(CommandBuilder.italicOff()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.ITALIC_OFF])
      );
    });

    it('setUnderline(true) enables underline', () => {
      expect(CommandBuilder.setUnderline(true)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.UNDERLINE, 1])
      );
    });

    it('setUnderline(false) disables underline', () => {
      expect(CommandBuilder.setUnderline(false)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.UNDERLINE, 0])
      );
    });

    it('doubleStrikeOn() returns ESC G', () => {
      expect(CommandBuilder.doubleStrikeOn()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.DOUBLE_STRIKE_ON])
      );
    });

    it('doubleStrikeOff() returns ESC H', () => {
      expect(CommandBuilder.doubleStrikeOff()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.DOUBLE_STRIKE_OFF])
      );
    });

    it('setSuperSubscript(0) selects superscript', () => {
      expect(CommandBuilder.setSuperSubscript(0)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.SUPERSCRIPT_SUBSCRIPT, 0])
      );
    });

    it('setSuperSubscript(1) selects subscript', () => {
      expect(CommandBuilder.setSuperSubscript(1)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.SUPERSCRIPT_SUBSCRIPT, 1])
      );
    });

    it('cancelSuperSubscript() returns ESC T', () => {
      expect(CommandBuilder.cancelSuperSubscript()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.CANCEL_SUPER_SUB])
      );
    });
  });

  // ==================== CHARACTER SIZE ====================

  describe('Character Size', () => {
    it('setDoubleWidth(true) enables double width', () => {
      expect(CommandBuilder.setDoubleWidth(true)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.DOUBLE_WIDTH, 1])
      );
    });

    it('setDoubleWidth(false) disables double width', () => {
      expect(CommandBuilder.setDoubleWidth(false)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.DOUBLE_WIDTH, 0])
      );
    });

    it('doubleWidthOneLine() returns SO', () => {
      expect(CommandBuilder.doubleWidthOneLine()).toEqual(new Uint8Array([ASCII.SO]));
    });

    it('cancelDoubleWidthOneLine() returns DC4', () => {
      expect(CommandBuilder.cancelDoubleWidthOneLine()).toEqual(new Uint8Array([ASCII.DC4]));
    });

    it('setDoubleHeight(true) enables double height', () => {
      expect(CommandBuilder.setDoubleHeight(true)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.DOUBLE_HEIGHT, 1])
      );
    });

    it('setInterCharSpace() sets inter-character space', () => {
      expect(CommandBuilder.setInterCharSpace(5)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.INTER_CHAR_SPACE, 5])
      );
    });

    it('setInterCharSpace() throws for invalid values', () => {
      expect(() => CommandBuilder.setInterCharSpace(-1)).toThrow(EscpRangeError);
      expect(() => CommandBuilder.setInterCharSpace(256)).toThrow(EscpRangeError);
    });
  });

  // ==================== JUSTIFICATION ====================

  describe('Justification', () => {
    it('setJustification(LEFT) aligns left', () => {
      expect(CommandBuilder.setJustification(JUSTIFICATION.LEFT)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.JUSTIFICATION, 0])
      );
    });

    it('setJustification(CENTER) centers', () => {
      expect(CommandBuilder.setJustification(JUSTIFICATION.CENTER)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.JUSTIFICATION, 1])
      );
    });

    it('setJustification(RIGHT) aligns right', () => {
      expect(CommandBuilder.setJustification(JUSTIFICATION.RIGHT)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.JUSTIFICATION, 2])
      );
    });
  });

  // ==================== GRAPHICS ====================

  describe('Graphics', () => {
    it('bitImage() creates bit image command', () => {
      const data = new Uint8Array([0xff, 0x00, 0xff]);
      const result = CommandBuilder.bitImage(BIT_IMAGE_MODE.SINGLE_DENSITY_24PIN, 1, data);
      expect(result).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.BIT_IMAGE, 32, 1, 0, 0xff, 0x00, 0xff])
      );
    });

    it('graphics60dpi() creates 60 DPI graphics', () => {
      const data = new Uint8Array([0xaa, 0x55]);
      const result = CommandBuilder.graphics60dpi(2, data);
      expect(result).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.GRAPHICS_60DPI, 2, 0, 0xaa, 0x55])
      );
    });
  });

  // ==================== UTILITY METHODS ====================

  describe('Utility Methods', () => {
    describe('encodeText', () => {
      it('encodes ASCII text correctly', () => {
        const result = CommandBuilder.encodeText('Hello');
        expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
      });

      it('handles empty string', () => {
        const result = CommandBuilder.encodeText('');
        expect(result).toEqual(new Uint8Array([]));
      });
    });

    describe('printLine', () => {
      it('adds CR LF by default', () => {
        const result = CommandBuilder.printLine('Hi');
        expect(result).toEqual(new Uint8Array([72, 105, ASCII.CR, ASCII.LF]));
      });

      it('omits CR LF when newline is false', () => {
        const result = CommandBuilder.printLine('Hi', false);
        expect(result).toEqual(new Uint8Array([72, 105]));
      });
    });

    describe('fromHex', () => {
      it('parses valid hex string', () => {
        const result = CommandBuilder.fromHex('1B40');
        expect(result).toEqual(new Uint8Array([0x1b, 0x40]));
      });

      it('handles spaces in hex string', () => {
        const result = CommandBuilder.fromHex('1B 40 45');
        expect(result).toEqual(new Uint8Array([0x1b, 0x40, 0x45]));
      });

      it('handles lowercase hex', () => {
        const result = CommandBuilder.fromHex('1b40');
        expect(result).toEqual(new Uint8Array([0x1b, 0x40]));
      });

      it('handles empty string', () => {
        const result = CommandBuilder.fromHex('');
        expect(result).toEqual(new Uint8Array([]));
      });

      it('throws for odd-length hex string', () => {
        expect(() => CommandBuilder.fromHex('1B4')).toThrow(EncodingError);
      });

      it('throws for invalid hex characters', () => {
        expect(() => CommandBuilder.fromHex('1BGG')).toThrow(EncodingError);
      });
    });

    describe('toHex', () => {
      it('converts bytes to hex string', () => {
        const result = CommandBuilder.toHex(new Uint8Array([0x1b, 0x40]));
        expect(result).toBe('1B 40');
      });

      it('uses custom separator', () => {
        const result = CommandBuilder.toHex(new Uint8Array([0x1b, 0x40]), '');
        expect(result).toBe('1B40');
      });

      it('pads single digit hex values', () => {
        const result = CommandBuilder.toHex(new Uint8Array([0x0a, 0x01]));
        expect(result).toBe('0A 01');
      });
    });

    describe('fromHex/toHex round-trip', () => {
      it('round-trips correctly', () => {
        const original = new Uint8Array([0x1b, 0x40, 0x00, 0xff, 0xab]);
        const hex = CommandBuilder.toHex(original, '');
        const result = CommandBuilder.fromHex(hex);
        expect(result).toEqual(original);
      });
    });
  });

  // ==================== CHARACTER TABLES ====================

  describe('character tables', () => {
    it('selectCharTable() selects character table', () => {
      const result = CommandBuilder.selectCharTable(1);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.CHAR_TABLE);
      expect(result[2]).toBe(1);
    });

    it('assignCharTable() assigns table and charset', () => {
      const result = CommandBuilder.assignCharTable(2, 3);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(0x28); // '('
      expect(result.length).toBeGreaterThan(5);
    });

    it('enableUpperControlCodes() enables upper control codes', () => {
      const result = CommandBuilder.enableUpperControlCodes();
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.PRINT_UPPER_CTRL);
    });

    it('enableExtendedChars() enables extended characters', () => {
      const result = CommandBuilder.enableExtendedChars();
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.PRINT_UPPER_CTRL_2);
    });
  });

  // ==================== JUSTIFICATION AND COLOR ====================

  describe('justification and color', () => {
    it('setJustification() sets left align', () => {
      const result = CommandBuilder.setJustification(JUSTIFICATION.LEFT);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.JUSTIFICATION);
      expect(result[2]).toBe(0);
    });

    it('setJustification() sets center align', () => {
      const result = CommandBuilder.setJustification(JUSTIFICATION.CENTER);
      expect(result[2]).toBe(1);
    });

    it('setJustification() sets right align', () => {
      const result = CommandBuilder.setJustification(JUSTIFICATION.RIGHT);
      expect(result[2]).toBe(2);
    });

    it('selectColor() selects color', () => {
      const result = CommandBuilder.selectColor(1);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.SELECT_COLOR);
      expect(result[2]).toBe(1);
    });
  });

  // ==================== MISCELLANEOUS ====================

  describe('Miscellaneous', () => {
    it('setUnidirectional(true) enables unidirectional', () => {
      expect(CommandBuilder.setUnidirectional(true)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.UNIDIRECTIONAL, 1])
      );
    });

    it('setSlashZero(true) enables slashed zero', () => {
      expect(CommandBuilder.setSlashZero(true)).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.SLASH_ZERO, 1])
      );
    });

    it('beep() returns BEL', () => {
      expect(CommandBuilder.beep()).toEqual(new Uint8Array([ASCII.BEL]));
    });

    it('disablePaperOut() returns ESC 8', () => {
      expect(CommandBuilder.disablePaperOut()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.PAPER_OUT_OFF])
      );
    });

    it('enablePaperOut() returns ESC 9', () => {
      expect(CommandBuilder.enablePaperOut()).toEqual(
        new Uint8Array([ASCII.ESC, ESC_COMMANDS.PAPER_OUT_ON])
      );
    });
  });

  // ==================== MASTER SELECT ====================

  describe('masterSelect', () => {
    it('creates master select with no options', () => {
      const result = CommandBuilder.masterSelect({});
      expect(result).toEqual(new Uint8Array([ASCII.ESC, ESC_COMMANDS.MASTER_SELECT, 0]));
    });

    it('sets bold bit', () => {
      const result = CommandBuilder.masterSelect({ bold: true });
      expect(result[2]).toBe(0x08);
    });

    it('sets italic bit', () => {
      const result = CommandBuilder.masterSelect({ italic: true });
      expect(result[2]).toBe(0x40);
    });

    it('sets underline bit', () => {
      const result = CommandBuilder.masterSelect({ underline: true });
      expect(result[2]).toBe(0x80);
    });

    it('sets double width bit', () => {
      const result = CommandBuilder.masterSelect({ doubleWidth: true });
      expect(result[2]).toBe(0x20);
    });

    it('combines multiple styles', () => {
      const result = CommandBuilder.masterSelect({ bold: true, italic: true, underline: true });
      expect(result[2]).toBe(0x08 | 0x40 | 0x80); // 0xC8
    });
  });

  // ==================== EXTENDED GRAPHICS ====================

  describe('extended graphics', () => {
    it('graphics120dpi() creates 120 DPI graphics command', () => {
      const data = new Uint8Array([0xff, 0xaa]);
      const result = CommandBuilder.graphics120dpi(2, data);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.GRAPHICS_120DPI);
      expect(result[2]).toBe(2); // nL
      expect(result[3]).toBe(0); // nH
      expect(result[4]).toBe(0xff);
      expect(result[5]).toBe(0xaa);
    });

    it('graphics120dpiDoubleSpeed() creates 120 DPI fast graphics', () => {
      const data = new Uint8Array([0x55]);
      const result = CommandBuilder.graphics120dpiDoubleSpeed(1, data);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.GRAPHICS_120DPI_FAST);
      expect(result[2]).toBe(1);
      expect(result[3]).toBe(0);
      expect(result[4]).toBe(0x55);
    });

    it('graphics240dpi() creates 240 DPI graphics command', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      const result = CommandBuilder.graphics240dpi(3, data);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.GRAPHICS_240DPI);
      expect(result[2]).toBe(3); // nL
      expect(result[3]).toBe(0); // nH
    });

    it('graphics24pin() delegates to bitImage', () => {
      const data = new Uint8Array([0xff, 0xff, 0xff]);
      const result = CommandBuilder.graphics24pin(32, 1, data);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.BIT_IMAGE);
      expect(result[2]).toBe(32); // mode
    });

    it('reassignBitImageMode() creates reassign command', () => {
      const result = CommandBuilder.reassignBitImageMode(0, 1);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.REASSIGN_BIT_IMAGE);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(1);
    });
  });

  // ==================== USER-DEFINED CHARACTERS ====================

  describe('user-defined characters', () => {
    it('copyRomToRam() copies ROM to RAM', () => {
      const result = CommandBuilder.copyRomToRam();
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.COPY_ROM_TO_RAM);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(0);
      expect(result[4]).toBe(0);
    });

    it('selectUserDefinedSet() enables user set', () => {
      const result = CommandBuilder.selectUserDefinedSet(true);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.SELECT_USER_SET);
      expect(result[2]).toBe(1);
    });

    it('selectUserDefinedSet() disables user set', () => {
      const result = CommandBuilder.selectUserDefinedSet(false);
      expect(result[2]).toBe(0);
    });

    it('defineUserChars() defines custom characters', () => {
      const charData = [{ proportional: 24, data: new Uint8Array([0x00, 0x7e, 0x42, 0x7e, 0x00]) }];
      const result = CommandBuilder.defineUserChars(65, 65, charData);
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.DEFINE_USER_CHARS);
      expect(result[2]).toBe(0); // NUL
      expect(result[3]).toBe(65); // startChar
      expect(result[4]).toBe(65); // endChar
      expect(result[5]).toBe(24); // proportional
    });
  });

  // ==================== MSB CONTROL ====================

  describe('MSB control', () => {
    it('unidirectionalOneLine() creates one-line unidirectional', () => {
      const result = CommandBuilder.unidirectionalOneLine();
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(0x3c);
    });

    it('cancelMsbControl() cancels MSB control', () => {
      const result = CommandBuilder.cancelMsbControl();
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.MSB_CONTROL);
    });

    it('setMsb0() sets MSB to 0', () => {
      const result = CommandBuilder.setMsb0();
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.SET_MSB_0);
    });

    it('setMsb1() sets MSB to 1', () => {
      const result = CommandBuilder.setMsb1();
      expect(result[0]).toBe(ASCII.ESC);
      expect(result[1]).toBe(ESC_COMMANDS.SET_MSB_1);
    });
  });
});
