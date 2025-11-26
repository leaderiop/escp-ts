import { describe, it, expect } from 'vitest';
import * as escp from './index';

describe('index exports', () => {
  // ==================== Core Exports ====================

  describe('core exports', () => {
    it('exports error classes', () => {
      expect(escp.EscpError).toBeDefined();
      expect(escp.ValidationError).toBeDefined();
      expect(escp.EscpRangeError).toBeDefined();
      expect(escp.GraphicsError).toBeDefined();
      expect(escp.EncodingError).toBeDefined();
      expect(escp.ConfigurationError).toBeDefined();
    });

    it('exports validation utilities', () => {
      expect(escp.assertByte).toBeDefined();
      expect(escp.assertRange).toBeDefined();
      expect(escp.assertUint16).toBeDefined();
      expect(escp.assertValidHex).toBeDefined();
      expect(escp.assertPositiveDimensions).toBeDefined();
      expect(escp.assertNonNegative).toBeDefined();
      expect(escp.assertOneOf).toBeDefined();
    });

    it('exports constants', () => {
      expect(escp.TYPEFACE).toBeDefined();
      expect(escp.PRINT_QUALITY).toBeDefined();
      expect(escp.JUSTIFICATION).toBeDefined();
      expect(escp.BIT_IMAGE_MODE).toBeDefined();
      expect(escp.CHAR_TABLE).toBeDefined();
      expect(escp.INTERNATIONAL_CHARSET).toBeDefined();
    });
  });

  // ==================== PrinterState Exports ====================

  describe('PrinterState exports', () => {
    it('exports PrinterStateManager', () => {
      expect(escp.PrinterStateManager).toBeDefined();
      const manager = new escp.PrinterStateManager();
      expect(manager.getState()).toBeDefined();
    });

    it('exports state utility functions', () => {
      expect(escp.createInitialState).toBeDefined();
      expect(escp.calculateCharWidth).toBeDefined();
      expect(escp.calculateLineHeight).toBeDefined();
      expect(escp.calculateHMI).toBeDefined();
      expect(escp.getPrintableWidth).toBeDefined();
      expect(escp.getPrintableHeight).toBeDefined();
      expect(escp.getPageWidth).toBeDefined();
      expect(escp.getPageHeight).toBeDefined();
      expect(escp.getMaxX).toBeDefined();
      expect(escp.getMaxY).toBeDefined();
      expect(escp.isInPrintableArea).toBeDefined();
    });

    it('exports unit conversion functions', () => {
      expect(escp.inchesToDots).toBeDefined();
      expect(escp.dotsToInches).toBeDefined();
      expect(escp.mmToDots).toBeDefined();
      expect(escp.dotsToMm).toBeDefined();
      expect(escp.columnsToDots).toBeDefined();
      expect(escp.linesToDots).toBeDefined();
    });

    it('exports default configurations', () => {
      expect(escp.DEFAULT_FONT_STYLE).toBeDefined();
      expect(escp.DEFAULT_FONT_CONFIG).toBeDefined();
      expect(escp.DEFAULT_MARGINS).toBeDefined();
      expect(escp.DEFAULT_PAPER_CONFIG).toBeDefined();
    });
  });

  // ==================== CommandBuilder ====================

  describe('CommandBuilder export', () => {
    it('exports CommandBuilder', () => {
      expect(escp.CommandBuilder).toBeDefined();
    });

    it('CommandBuilder has static methods', () => {
      expect(escp.CommandBuilder.initialize).toBeDefined();
      expect(escp.CommandBuilder.boldOn).toBeDefined();
      expect(escp.CommandBuilder.selectPica).toBeDefined();
    });
  });

  // ==================== CharacterSet Exports ====================

  describe('CharacterSet exports', () => {
    it('exports width tables', () => {
      expect(escp.PROPORTIONAL_WIDTHS).toBeDefined();
      expect(escp.INTERNATIONAL_CHAR_MAPS).toBeDefined();
    });

    it('exports character functions', () => {
      expect(escp.getProportionalWidth).toBeDefined();
      expect(escp.getCharacterWidth).toBeDefined();
      expect(escp.mapInternationalChar).toBeDefined();
      expect(escp.encodeText).toBeDefined();
      expect(escp.calculateTextWidth).toBeDefined();
      expect(escp.wordWrap).toBeDefined();
      expect(escp.getTypefaceName).toBeDefined();
      expect(escp.isScalableTypeface).toBeDefined();
    });
  });

  // ==================== Graphics Exports ====================

  describe('graphics exports', () => {
    it('exports graphics constants', () => {
      expect(escp.GRAPHICS_MODES).toBeDefined();
      expect(escp.DEFAULT_CONVERSION_OPTIONS).toBeDefined();
    });

    it('exports image processing functions', () => {
      expect(escp.applyDithering).toBeDefined();
      expect(escp.scaleImageNearest).toBeDefined();
      expect(escp.scaleImageBilinear).toBeDefined();
      expect(escp.convertToColumnFormat24Pin).toBeDefined();
      expect(escp.convertToColumnFormat8Pin).toBeDefined();
      expect(escp.convertToBitImage).toBeDefined();
      expect(escp.splitIntoStripes).toBeDefined();
      expect(escp.createTestPattern).toBeDefined();
      expect(escp.createCheckerboard).toBeDefined();
    });
  });

  // ==================== Layout Engine ====================

  describe('LayoutEngine exports', () => {
    it('exports LayoutEngine', () => {
      expect(escp.LayoutEngine).toBeDefined();
    });

    it('exports default as LayoutEngine', () => {
      expect(escp.default).toBe(escp.LayoutEngine);
    });

    it('exports engine configuration', () => {
      expect(escp.LQ_2090II_PROFILE).toBeDefined();
      expect(escp.DEFAULT_ENGINE_OPTIONS).toBeDefined();
    });

    it('can create LayoutEngine instance', () => {
      const engine = new escp.LayoutEngine();
      expect(engine.getState()).toBeDefined();
      expect(engine.getOutput()).toBeInstanceOf(Uint8Array);
    });
  });

  // ==================== Layout Nodes ====================

  describe('layout nodes exports', () => {
    it('exports DEFAULT_STYLE', () => {
      expect(escp.DEFAULT_STYLE).toBeDefined();
      expect(escp.DEFAULT_STYLE.bold).toBe(false);
      expect(escp.DEFAULT_STYLE.cpi).toBe(10);
    });

    it('exports type guards', () => {
      expect(escp.isContainerNode).toBeDefined();
      expect(escp.isTextNode).toBeDefined();
      expect(escp.isSpacerNode).toBeDefined();
    });

    it('exports utility functions', () => {
      expect(escp.resolvePadding).toBeDefined();
      expect(escp.resolveStyle).toBeDefined();
    });
  });

  // ==================== Layout Builders ====================

  describe('layout builders exports', () => {
    it('exports builder classes', () => {
      expect(escp.StackBuilder).toBeDefined();
      expect(escp.FlexBuilder).toBeDefined();
      expect(escp.GridBuilder).toBeDefined();
    });

    it('exports factory functions', () => {
      expect(escp.stack).toBeDefined();
      expect(escp.flex).toBeDefined();
      expect(escp.grid).toBeDefined();
      expect(escp.text).toBeDefined();
      expect(escp.spacer).toBeDefined();
      expect(escp.line).toBeDefined();
    });

    it('factory functions work correctly', () => {
      const stackNode = escp.stack().text('Hello').build();
      expect(stackNode.type).toBe('stack');

      const flexNode = escp.flex().text('World').build();
      expect(flexNode.type).toBe('flex');

      const gridNode = escp.grid([100]).cell('Cell').row().build();
      expect(gridNode.type).toBe('grid');
    });
  });

  // ==================== Layout System ====================

  describe('layout system exports', () => {
    it('exports measure phase functions', () => {
      expect(escp.measureNode).toBeDefined();
      expect(escp.DEFAULT_MEASURE_CONTEXT).toBeDefined();
    });

    it('exports layout phase functions', () => {
      expect(escp.layoutNode).toBeDefined();
      expect(escp.performLayout).toBeDefined();
    });

    it('exports renderer functions', () => {
      expect(escp.flattenTree).toBeDefined();
      expect(escp.sortRenderItems).toBeDefined();
      expect(escp.renderLayout).toBeDefined();
    });
  });

  // ==================== Virtual Renderer ====================

  describe('VirtualRenderer exports', () => {
    it('exports VirtualRenderer', () => {
      expect(escp.VirtualRenderer).toBeDefined();
    });

    it('exports DEFAULT_RENDER_OPTIONS', () => {
      expect(escp.DEFAULT_RENDER_OPTIONS).toBeDefined();
    });
  });

  // ==================== Integration ====================

  describe('integration', () => {
    it('can build and render a complete document', () => {
      const engine = new escp.LayoutEngine();
      engine
        .initialize()
        .setBold(true)
        .println('Test')
        .setBold(false);

      const output = engine.getOutput();
      expect(output.length).toBeGreaterThan(0);
    });

    it('can use layout builders with engine', () => {
      const engine = new escp.LayoutEngine();
      engine.initialize();

      const layout = escp.stack()
        .text('Title')
        .text('Content')
        .build();

      engine.render(layout);
      expect(engine.getOutput().length).toBeGreaterThan(0);
    });
  });
});
