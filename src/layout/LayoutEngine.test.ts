import { describe, it, expect } from 'vitest';
import { LayoutEngine, DEFAULT_ENGINE_OPTIONS, LQ_2090II_PROFILE } from './LayoutEngine';
import { ValidationError } from '../core/errors';
import { stack, flex } from './builders';
import { TYPEFACE, PRINT_QUALITY, JUSTIFICATION } from '../core/constants';

describe('LayoutEngine', () => {
  // ==================== INITIALIZATION ====================

  describe('constructor', () => {
    it('creates engine with default options', () => {
      const engine = new LayoutEngine();
      const state = engine.getState();

      expect(state.font.cpi).toBe(10);
      expect(state.paper.widthInches).toBeCloseTo(1069 / 72); // 14.847 inches
    });

    it('creates engine with custom options', () => {
      const engine = new LayoutEngine({
        defaultFont: { cpi: 12 },
      });
      const state = engine.getState();

      expect(state.font.cpi).toBe(12);
    });
  });

  describe('initialize', () => {
    it('emits initialize command', () => {
      const engine = new LayoutEngine();
      engine.initialize();

      const output = engine.getOutput();
      // ESC @ (initialize) = 0x1B 0x40
      expect(output[0]).toBe(0x1b);
      expect(output[1]).toBe(0x40);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      expect(engine.initialize()).toBe(engine);
    });
  });

  // ==================== PAGE SETUP ====================

  describe('setupPage', () => {
    it('accepts valid margins', () => {
      const engine = new LayoutEngine();
      expect(() => {
        engine.setupPage({ margins: { top: 90, bottom: 90, left: 90, right: 90 } });
      }).not.toThrow();
    });

    it('throws on negative top margin', () => {
      const engine = new LayoutEngine();
      expect(() => {
        engine.setupPage({ margins: { top: -10 } });
      }).toThrow(ValidationError);
    });

    it('throws on negative bottom margin', () => {
      const engine = new LayoutEngine();
      expect(() => {
        engine.setupPage({ margins: { bottom: -5 } });
      }).toThrow(ValidationError);
    });

    it('throws on negative left margin', () => {
      const engine = new LayoutEngine();
      expect(() => {
        engine.setupPage({ margins: { left: -1 } });
      }).toThrow(ValidationError);
    });

    it('throws on negative right margin', () => {
      const engine = new LayoutEngine();
      expect(() => {
        engine.setupPage({ margins: { right: -100 } });
      }).toThrow(ValidationError);
    });

    it('accepts zero margins', () => {
      const engine = new LayoutEngine();
      expect(() => {
        engine.setupPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      }).not.toThrow();
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      expect(engine.setupPage({})).toBe(engine);
    });
  });

  // ==================== LINE SPACING ====================

  describe('line spacing', () => {
    it('setLineSpacing1_6 updates state', () => {
      const engine = new LayoutEngine();
      engine.setLineSpacing1_6();
      expect(engine.getState().lineSpacing).toBe(60);
    });

    it('setLineSpacing1_8 updates state', () => {
      const engine = new LayoutEngine();
      engine.setLineSpacing1_8();
      expect(engine.getState().lineSpacing).toBe(45);
    });

    it('setLineSpacingN180 updates state', () => {
      const engine = new LayoutEngine();
      engine.setLineSpacingN180(90);
      // 90/180 * 360 = 180
      expect(engine.getState().lineSpacing).toBe(180);
    });

    it('setLineSpacingN360 updates state', () => {
      const engine = new LayoutEngine();
      engine.setLineSpacingN360(120);
      expect(engine.getState().lineSpacing).toBe(120);
    });

    it('setLineSpacing converts inches to dots', () => {
      const engine = new LayoutEngine();
      engine.setLineSpacing(0.5);
      // 0.5 * 360 = 180
      expect(engine.getState().lineSpacing).toBe(180);
    });
  });

  // ==================== FONT SELECTION ====================

  describe('setCpi', () => {
    it('accepts supported CPI values', () => {
      const engine = new LayoutEngine();

      engine.setCpi(10);
      expect(engine.getState().font.cpi).toBe(10);

      engine.setCpi(12);
      expect(engine.getState().font.cpi).toBe(12);

      engine.setCpi(15);
      expect(engine.getState().font.cpi).toBe(15);
    });

    it('throws on unsupported CPI', () => {
      const engine = new LayoutEngine();
      expect(() => engine.setCpi(11)).toThrow(ValidationError);
      expect(() => engine.setCpi(99)).toThrow(ValidationError);
    });
  });

  describe('setTypeface', () => {
    it('updates font typeface', () => {
      const engine = new LayoutEngine();
      engine.setTypeface(TYPEFACE.COURIER);
      expect(engine.getState().font.typeface).toBe(TYPEFACE.COURIER);
    });
  });

  describe('setQuality', () => {
    it('updates print quality', () => {
      const engine = new LayoutEngine();
      engine.setQuality(PRINT_QUALITY.LQ);
      expect(engine.getState().font.quality).toBe(PRINT_QUALITY.LQ);
    });
  });

  // ==================== FONT STYLE ====================

  describe('font style methods', () => {
    it('setBold updates state', () => {
      const engine = new LayoutEngine();
      engine.setBold(true);
      expect(engine.getState().font.style.bold).toBe(true);
      engine.setBold(false);
      expect(engine.getState().font.style.bold).toBe(false);
    });

    it('setItalic updates state', () => {
      const engine = new LayoutEngine();
      engine.setItalic(true);
      expect(engine.getState().font.style.italic).toBe(true);
    });

    it('setUnderline updates state', () => {
      const engine = new LayoutEngine();
      engine.setUnderline(true);
      expect(engine.getState().font.style.underline).toBe(true);
    });

    it('setDoubleStrike updates state', () => {
      const engine = new LayoutEngine();
      engine.setDoubleStrike(true);
      expect(engine.getState().font.style.doubleStrike).toBe(true);
    });

    it('setDoubleWidth updates state', () => {
      const engine = new LayoutEngine();
      engine.setDoubleWidth(true);
      expect(engine.getState().font.style.doubleWidth).toBe(true);
    });

    it('setDoubleHeight updates state', () => {
      const engine = new LayoutEngine();
      engine.setDoubleHeight(true);
      expect(engine.getState().font.style.doubleHeight).toBe(true);
    });

    it('setCondensed updates state', () => {
      const engine = new LayoutEngine();
      engine.setCondensed(true);
      expect(engine.getState().font.style.condensed).toBe(true);
    });

    it('setProportional updates state', () => {
      const engine = new LayoutEngine();
      engine.setProportional(true);
      expect(engine.getState().font.style.proportional).toBe(true);
    });

    it('setSuperscript updates state', () => {
      const engine = new LayoutEngine();
      engine.setSuperscript(true);
      expect(engine.getState().font.style.superscript).toBe(true);
      expect(engine.getState().font.style.subscript).toBe(false);
    });

    it('setSubscript updates state', () => {
      const engine = new LayoutEngine();
      engine.setSubscript(true);
      expect(engine.getState().font.style.subscript).toBe(true);
      expect(engine.getState().font.style.superscript).toBe(false);
    });

    it('setFontStyle applies multiple styles', () => {
      const engine = new LayoutEngine();
      engine.setFontStyle({ bold: true, italic: true, underline: true });
      const style = engine.getState().font.style;
      expect(style.bold).toBe(true);
      expect(style.italic).toBe(true);
      expect(style.underline).toBe(true);
    });
  });

  // ==================== JUSTIFICATION ====================

  describe('justification', () => {
    it('setJustification updates state', () => {
      const engine = new LayoutEngine();
      engine.setJustification(JUSTIFICATION.CENTER);
      expect(engine.getState().justification).toBe(JUSTIFICATION.CENTER);
    });

    it('leftAlign sets left justification', () => {
      const engine = new LayoutEngine();
      engine.leftAlign();
      expect(engine.getState().justification).toBe(JUSTIFICATION.LEFT);
    });

    it('centerAlign sets center justification', () => {
      const engine = new LayoutEngine();
      engine.centerAlign();
      expect(engine.getState().justification).toBe(JUSTIFICATION.CENTER);
    });

    it('rightAlign sets right justification', () => {
      const engine = new LayoutEngine();
      engine.rightAlign();
      expect(engine.getState().justification).toBe(JUSTIFICATION.RIGHT);
    });

    it('fullJustify sets full justification', () => {
      const engine = new LayoutEngine();
      engine.fullJustify();
      expect(engine.getState().justification).toBe(JUSTIFICATION.FULL);
    });
  });

  // ==================== POSITIONING ====================

  describe('positioning', () => {
    it('carriageReturn emits CR', () => {
      const engine = new LayoutEngine();
      engine.print('Test');
      engine.carriageReturn();
      expect(engine.getState().x).toBe(engine.getState().paper.margins.left);
    });

    it('lineFeed advances vertical position', () => {
      const engine = new LayoutEngine();
      const initialY = engine.getState().y;
      engine.lineFeed();
      expect(engine.getState().y).toBeGreaterThan(initialY);
    });

    it('newLine combines CR and LF', () => {
      const engine = new LayoutEngine();
      engine.print('Test');
      const initialY = engine.getState().y;
      engine.newLine();
      expect(engine.getState().x).toBe(engine.getState().paper.margins.left);
      expect(engine.getState().y).toBeGreaterThan(initialY);
    });

    it('formFeed creates new page', () => {
      const engine = new LayoutEngine();
      engine.print('Test');
      engine.formFeed();
      const doc = engine.getDocument();
      expect(doc.pages.length).toBe(1);
    });

    it('tab advances horizontal position', () => {
      const engine = new LayoutEngine();
      const initialX = engine.getState().x;
      engine.tab();
      expect(engine.getState().x).toBeGreaterThan(initialX);
    });
  });

  // ==================== TEXT PRINTING ====================

  describe('print', () => {
    it('advances horizontal position', () => {
      const engine = new LayoutEngine();
      const initialX = engine.getState().x;
      engine.print('Hello');
      expect(engine.getState().x).toBeGreaterThan(initialX);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      expect(engine.print('Test')).toBe(engine);
    });
  });

  describe('println', () => {
    it('prints text and moves to next line', () => {
      const engine = new LayoutEngine();
      const initialY = engine.getState().y;
      engine.println('Test');
      expect(engine.getState().y).toBeGreaterThan(initialY);
      expect(engine.getState().x).toBe(engine.getState().paper.margins.left);
    });

    it('handles empty string', () => {
      const engine = new LayoutEngine();
      expect(() => engine.println('')).not.toThrow();
    });
  });

  // ==================== OUTPUT ====================

  describe('getOutput', () => {
    it('returns accumulated output', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const output = engine.getOutput();
      expect(output).toBeInstanceOf(Uint8Array);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('clearOutput', () => {
    it('clears output buffer', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      expect(engine.getOutput().length).toBeGreaterThan(0);
      engine.clearOutput();
      expect(engine.getOutput().length).toBe(0);
    });
  });

  describe('toHex', () => {
    it('converts output to hex string', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const hex = engine.toHex();
      expect(hex).toContain('1B');
      expect(hex).toContain('40');
    });

    it('uses custom separator', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const hex = engine.toHex('-');
      expect(hex).toContain('1B-40');
    });
  });

  describe('toBase64', () => {
    it('converts output to base64', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const base64 = engine.toBase64();
      expect(base64).toBe('G0A='); // ESC @ in base64
    });
  });

  describe('finalize', () => {
    it('adds form feed if content exists', () => {
      const engine = new LayoutEngine();
      engine.print('Test');
      engine.finalize();
      const doc = engine.getDocument();
      expect(doc.pages.length).toBe(1);
    });

    it('returns output bytes', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const output = engine.finalize();
      expect(output).toBeInstanceOf(Uint8Array);
    });
  });

  // ==================== LAYOUT SYSTEM ====================

  describe('render', () => {
    it('renders a simple stack layout', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = stack().text('Hello').text('World').build();

      expect(() => engine.render(layout)).not.toThrow();
      expect(engine.getOutput().length).toBeGreaterThan(2);
    });

    it('renders a flex layout', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = flex().text('Left').text('Right').build();

      expect(() => engine.render(layout)).not.toThrow();
    });

    it('returns this for chaining', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      const result = engine.render(stack().text('Test').build());
      expect(result).toBe(engine);
    });

    it('throws error if Yoga is not initialized', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const layout = stack().text('Test').build();

      expect(() => engine.render(layout)).toThrow('Yoga must be initialized');
    });
  });

  describe('createStack', () => {
    it('returns a StackBuilder', () => {
      const engine = new LayoutEngine();
      const builder = engine.createStack();
      expect(builder.build().type).toBe('stack');
    });
  });

  describe('createFlex', () => {
    it('returns a FlexBuilder', () => {
      const engine = new LayoutEngine();
      const builder = engine.createFlex();
      expect(builder.build().type).toBe('flex');
    });
  });

  // ==================== RAW COMMANDS ====================

  describe('raw', () => {
    it('accepts Uint8Array', () => {
      const engine = new LayoutEngine();
      engine.raw(new Uint8Array([0x1b, 0x40]));
      const output = engine.getOutput();
      expect(output[0]).toBe(0x1b);
      expect(output[1]).toBe(0x40);
    });

    it('accepts number array', () => {
      const engine = new LayoutEngine();
      engine.raw([0x1b, 0x40]);
      const output = engine.getOutput();
      expect(output[0]).toBe(0x1b);
      expect(output[1]).toBe(0x40);
    });
  });

  describe('rawHex', () => {
    it('parses and emits hex string', () => {
      const engine = new LayoutEngine();
      engine.rawHex('1B 40');
      const output = engine.getOutput();
      expect(output[0]).toBe(0x1b);
      expect(output[1]).toBe(0x40);
    });
  });

  // ==================== MISCELLANEOUS ====================

  describe('beep', () => {
    it('emits beep command', () => {
      const engine = new LayoutEngine();
      engine.beep();
      const output = engine.getOutput();
      // BEL = 0x07
      expect(Array.from(output)).toContain(0x07);
    });
  });

  describe('setUnidirectional', () => {
    it('updates state', () => {
      const engine = new LayoutEngine();
      engine.setUnidirectional(true);
      expect(engine.getState().unidirectional).toBe(true);
    });
  });

  // ==================== DEFAULT OPTIONS ====================

  describe('DEFAULT_ENGINE_OPTIONS', () => {
    it('has correct defaults', () => {
      expect(DEFAULT_ENGINE_OPTIONS.profile).toBe(LQ_2090II_PROFILE);
      expect(DEFAULT_ENGINE_OPTIONS.defaultPaper.widthInches).toBeCloseTo(1069 / 72); // 14.847 inches
      expect(DEFAULT_ENGINE_OPTIONS.defaultPaper.heightInches).toBeCloseTo(615 / 72); // 8.542 inches
      expect(DEFAULT_ENGINE_OPTIONS.autoWrap).toBe(true);
      expect(DEFAULT_ENGINE_OPTIONS.strict).toBe(false);
    });
  });

  describe('LQ_2090II_PROFILE', () => {
    it('has correct printer specs', () => {
      expect(LQ_2090II_PROFILE.name).toBe('EPSON LQ-2090II');
      expect(LQ_2090II_PROFILE.pins).toBe(24);
      expect(LQ_2090II_PROFILE.escP2).toBe(true);
      expect(LQ_2090II_PROFILE.scalableFonts).toBe(true);
      expect(LQ_2090II_PROFILE.color).toBe(false);
      expect(LQ_2090II_PROFILE.supportedCpi).toContain(10);
      expect(LQ_2090II_PROFILE.supportedCpi).toContain(12);
      expect(LQ_2090II_PROFILE.supportedCpi).toContain(15);
    });
  });

  // ==================== METHOD CHAINING ====================

  describe('method chaining', () => {
    it('supports full chain of operations', () => {
      const engine = new LayoutEngine();

      engine
        .initialize()
        .setupPage({ margins: { top: 50, bottom: 50, left: 90, right: 90 } })
        .setLineSpacing1_6()
        .setCpi(12)
        .setBold(true)
        .centerAlign()
        .println('Title')
        .setBold(false)
        .leftAlign()
        .println('Content')
        .formFeed();

      expect(engine.getDocument().pages.length).toBe(1);
      expect(engine.getOutput().length).toBeGreaterThan(0);
    });
  });

  // ==================== TEXT FORMATTING ====================

  describe('printWrapped', () => {
    it('wraps text across lines', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.printWrapped('This is a long text that should be wrapped across multiple lines when it exceeds the printable width of the page');

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.printWrapped('Test');
      expect(result).toBe(engine);
    });
  });

  describe('printCentered', () => {
    it('centers text on line', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.printCentered('Centered');

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.printCentered('Test');
      expect(result).toBe(engine);
    });
  });

  describe('printRightAligned', () => {
    it('right aligns text on line', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.printRightAligned('Right');

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.printRightAligned('Test');
      expect(result).toBe(engine);
    });
  });

  // ==================== GRAPHICS ====================

  describe('printGraphics', () => {
    it('prints graphics data', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      const data = {
        mode: 0 as const, // 8-pin single density
        width: 8,
        data: new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
      };

      engine.printGraphics(data);

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('throws for unsupported mode', () => {
      const engine = new LayoutEngine();
      const data = {
        mode: 99 as never,
        width: 8,
        data: new Uint8Array(8),
      };

      expect(() => engine.printGraphics(data)).toThrow();
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const data = { mode: 0 as const, width: 1, data: new Uint8Array([0]) };
      const result = engine.printGraphics(data);
      expect(result).toBe(engine);
    });
  });

  describe('printImage', () => {
    it('prints grayscale image', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      const image = {
        width: 8,
        height: 24,
        data: new Uint8Array(8 * 24).fill(0),
      };

      engine.printImage(image);

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('throws for unsupported mode option', () => {
      const engine = new LayoutEngine();
      const image = { width: 8, height: 8, data: new Uint8Array(64) };

      expect(() => engine.printImage(image, { mode: 99 as never })).toThrow();
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const image = { width: 8, height: 8, data: new Uint8Array(64) };
      const result = engine.printImage(image);
      expect(result).toBe(engine);
    });
  });

  // ==================== BARCODE ====================

  describe('printBarcode', () => {
    it('prints barcode with default config', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.printBarcode('12345');

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('prints barcode with custom config', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.printBarcode('ABC123', {
        type: 5,
        moduleWidth: 3,
        height: 100,
        hriPosition: 1,
        hriFont: 1,
      });

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.printBarcode('TEST');
      expect(result).toBe(engine);
    });
  });

  // ==================== MISCELLANEOUS ====================

  describe('beep', () => {
    it('emits beep command', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.beep();

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.beep();
      expect(result).toBe(engine);
    });
  });

  describe('raw', () => {
    it('emits raw Uint8Array', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.raw(new Uint8Array([0x1b, 0x40]));

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('emits raw number array', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.raw([0x1b, 0x40, 0x0d]);

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.raw([0x00]);
      expect(result).toBe(engine);
    });
  });

  describe('rawHex', () => {
    it('emits raw hex string', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.rawHex('1B 40 0D 0A');

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.rawHex('1B40');
      expect(result).toBe(engine);
    });
  });

  describe('setUnidirectional', () => {
    it('enables unidirectional printing', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      const initialLen = engine.getOutput().length;

      engine.setUnidirectional(true);

      expect(engine.getOutput().length).toBeGreaterThan(initialLen);
      expect(engine.getState().unidirectional).toBe(true);
    });

    it('disables unidirectional printing', () => {
      const engine = new LayoutEngine();
      engine.setUnidirectional(true);
      engine.setUnidirectional(false);

      expect(engine.getState().unidirectional).toBe(false);
    });

    it('returns this for chaining', () => {
      const engine = new LayoutEngine();
      const result = engine.setUnidirectional(true);
      expect(result).toBe(engine);
    });
  });
});
