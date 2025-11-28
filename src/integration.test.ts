import { describe, it, expect } from 'vitest';
import {
  LayoutEngine,
  CommandBuilder,
  stack,
  flex,
  text,
  spacer,
  line,
  VirtualRenderer,
  ASCII,
  PRINT_QUALITY,
} from './index';

describe('Integration: Full Document Pipeline', () => {
  describe('Simple Document Generation', () => {
    it('should generate valid ESC/P2 for a simple text document', () => {
      const engine = new LayoutEngine();

      engine
        .initialize()
        .setQuality(PRINT_QUALITY.LQ)
        .setBold(true)
        .println('Hello, World!')
        .setBold(false)
        .println('This is a test.')
        .formFeed();

      const output = engine.getOutput();

      // Should contain initialization sequence
      expect(output[0]).toBe(ASCII.ESC);
      expect(output[1]).toBe(0x40); // @

      // Should contain some text bytes
      expect(output.length).toBeGreaterThan(10);

      // Should end with form feed
      expect(output[output.length - 1]).toBe(ASCII.FF);
    });

    it('should track state correctly through operations', () => {
      const engine = new LayoutEngine();

      engine.initialize();
      const initialState = engine.getState();
      expect(initialState.font.style.bold).toBe(false);

      engine.setBold(true);
      const boldState = engine.getState();
      expect(boldState.font.style.bold).toBe(true);

      engine.setBold(false);
      const finalState = engine.getState();
      expect(finalState.font.style.bold).toBe(false);
    });

    it('should maintain position tracking', () => {
      const engine = new LayoutEngine();
      engine.initialize();

      const startState = engine.getState();
      const startX = startState.x;
      const startY = startState.y;

      engine.print('Test');
      const afterPrint = engine.getState();
      expect(afterPrint.x).toBeGreaterThan(startX);

      engine.newLine();
      const afterNewline = engine.getState();
      expect(afterNewline.y).toBeGreaterThan(startY);
    });
  });

  describe('Layout System Integration', () => {
    it('should render a stack layout correctly', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = stack()
        .gap(10)
        .text('Line 1', { bold: true })
        .text('Line 2')
        .text('Line 3')
        .build();

      engine.render(layout);
      const output = engine.getOutput();

      // Should contain initialization and some content
      expect(output.length).toBeGreaterThan(10);
    });

    it('should render a flex layout with space-between', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = flex()
        .justify('space-between')
        .text('Left')
        .text('Right')
        .build();

      engine.render(layout);
      const output = engine.getOutput();
      expect(output.length).toBeGreaterThan(10);
    });

    it('should handle nested layouts', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const innerFlex = flex()
        .text('Inner 1')
        .text('Inner 2')
        .build();

      const outerStack = stack()
        .text('Header')
        .child(innerFlex)
        .text('Footer')
        .build();

      engine.render(outerStack);
      const output = engine.getOutput();
      expect(output.length).toBeGreaterThan(10);
    });

    it('should handle deeply nested layouts (5+ levels)', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      // Build a deeply nested structure
      const level5 = text('Deep content');
      const level4 = stack().child(level5).build();
      const level3 = flex().child(level4).build();
      const level2 = stack().child(level3).build();
      const level1 = flex().child(level2).build();
      const root = stack()
        .text('Top')
        .child(level1)
        .text('Bottom')
        .build();

      expect(() => engine.render(root)).not.toThrow();
      const output = engine.getOutput();
      expect(output.length).toBeGreaterThan(10);
    });
  });

  describe('Graphics Integration', () => {
    it('should generate graphics commands for test patterns', () => {
      const engine = new LayoutEngine();
      engine.initialize();

      // Create a simple test pattern
      const width = 100;
      const height = 24;
      const data = new Uint8Array(width * height);

      // Create a gradient pattern
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          data[y * width + x] = Math.floor((x / width) * 255);
        }
      }

      engine.printImage(
        { width, height, data },
        { dithering: 'floyd-steinberg' }
      );

      const output = engine.getOutput();
      // Should contain graphics data
      expect(output.length).toBeGreaterThan(100);
    });
  });

  describe('Barcode Integration', () => {
    it('should generate barcode commands', () => {
      const engine = new LayoutEngine();
      engine.initialize();

      engine.printBarcode('12345', {
        type: 5, // Code 39
        moduleWidth: 2,
        height: 50,
        hriPosition: 2,
        hriFont: 0,
      });

      const output = engine.getOutput();
      // Should contain barcode command sequence
      expect(output.length).toBeGreaterThan(10);
    });
  });

  describe('Virtual Renderer Integration', () => {
    it('should render ESC/P2 commands to virtual pages', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = stack()
        .text('Test Document')
        .text('Line 2')
        .build();

      engine.render(layout);
      const output = engine.getOutput();

      const renderer = new VirtualRenderer();
      renderer.render(output);
      const pages = renderer.getPages();

      expect(pages.length).toBe(1);
      expect(pages[0].width).toBeGreaterThan(0);
      expect(pages[0].height).toBeGreaterThan(0);
      expect(pages[0].data.length).toBeGreaterThan(0);
    });

    it('should handle multi-line content', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = stack()
        .gap(20)
        .text('Line 1')
        .text('Line 2')
        .text('Line 3')
        .text('Line 4')
        .text('Line 5')
        .build();

      engine.render(layout);
      const output = engine.getOutput();

      const renderer = new VirtualRenderer();
      renderer.render(output);
      const pages = renderer.getPages();
      expect(pages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Command Builder Integration', () => {
    it('should generate consistent command sequences', () => {
      // Test that combining commands produces expected results
      const init = CommandBuilder.initialize();
      const bold = CommandBuilder.boldOn();
      const text = CommandBuilder.encodeText('Hello');
      const boldOff = CommandBuilder.boldOff();
      const newline = CommandBuilder.printLine('', true);

      expect(init).toEqual(new Uint8Array([0x1b, 0x40]));
      expect(bold).toEqual(new Uint8Array([0x1b, 0x45]));
      expect(boldOff).toEqual(new Uint8Array([0x1b, 0x46]));
    });

    it('should handle hex conversion round-trip', () => {
      const original = new Uint8Array([0x1b, 0x40, 0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const hex = CommandBuilder.toHex(original, '');
      const restored = CommandBuilder.fromHex(hex);

      expect(restored).toEqual(original);
    });
  });

  describe('State Management Integration', () => {
    it('should properly reset state on initialize', () => {
      const engine = new LayoutEngine();

      // Set some state
      engine.setBold(true);
      engine.setItalic(true);
      engine.setCpi(12);

      // Verify state was set
      let state = engine.getState();
      expect(state.font.style.bold).toBe(true);
      expect(state.font.style.italic).toBe(true);
      expect(state.font.cpi).toBe(12);

      // Initialize should reset
      engine.initialize();
      state = engine.getState();
      expect(state.font.style.bold).toBe(false);
      expect(state.font.style.italic).toBe(false);
      expect(state.font.cpi).toBe(10);
    });

    it('should maintain separate output buffers', () => {
      const engine = new LayoutEngine();

      engine.initialize();
      engine.println('First');
      const output1 = engine.getOutput();

      engine.clearOutput();
      engine.println('Second');
      const output2 = engine.getOutput();

      // Outputs should be different
      expect(output1.length).toBeGreaterThan(output2.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty layouts', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const emptyStack = stack().build();
      expect(() => engine.render(emptyStack)).not.toThrow();
    });

    it('should handle empty text', () => {
      const engine = new LayoutEngine();
      engine.initialize();

      expect(() => engine.println('')).not.toThrow();
      expect(() => engine.print('')).not.toThrow();
    });

    it('should handle single character text', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = text('X');
      expect(() => engine.render(layout)).not.toThrow();
    });

    it('should handle very long text', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const longText = 'A'.repeat(1000);
      const layout = text(longText);
      expect(() => engine.render(layout)).not.toThrow();
    });

    it('should handle mixed content types', async () => {
      const engine = new LayoutEngine();
      await engine.initYoga();
      engine.initialize();

      const layout = stack()
        .text('Text content')
        .child(spacer(undefined, 20))
        .child(line('horizontal'))
        .child(
          flex()
            .text('Left')
            .child(spacer())
            .text('Right')
            .build()
        )
        .build();

      expect(() => engine.render(layout)).not.toThrow();
    });
  });

  describe('Output Formats', () => {
    it('should convert output to hex string', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      engine.println('Test');

      const hex = engine.toHex(' ');
      expect(hex).toMatch(/^[0-9A-F ]+$/);
      expect(hex).toContain('1B 40'); // ESC @
    });

    it('should convert output to base64', () => {
      const engine = new LayoutEngine();
      engine.initialize();
      engine.println('Test');

      const base64 = engine.toBase64();
      expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });
});
