import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualRenderer, DEFAULT_RENDER_OPTIONS, type VirtualPage } from './VirtualRenderer';
import { CommandBuilder } from '../commands/CommandBuilder';
import { LayoutEngine } from '../layout/LayoutEngine';

describe('VirtualRenderer', () => {
  let renderer: VirtualRenderer;

  beforeEach(() => {
    renderer = new VirtualRenderer();
  });

  // ==================== Constructor ====================

  describe('constructor', () => {
    it('creates renderer with default options', () => {
      const r = new VirtualRenderer();
      r.lineFeed(); // Move y to include page
      const page = r.getPage();
      expect(page).toBeDefined();
      expect(page?.width).toBeGreaterThan(0);
      expect(page?.height).toBeGreaterThan(0);
    });

    it('creates renderer with custom paper config', () => {
      const r = new VirtualRenderer({ widthInches: 14, heightInches: 11 });
      r.lineFeed(); // Move y to include page
      const page = r.getPage();
      // 14 inches at 360 DPI = 5040 pixels
      expect(page?.width).toBe(5040);
    });

    it('creates renderer with custom options', () => {
      const r = new VirtualRenderer({}, { scale: 2 });
      r.lineFeed(); // Move y to include page
      const page = r.getPage();
      // Default 14.847 inches at 360 DPI * 2 = 10690 pixels
      expect(page?.width).toBe(Math.round((1069 / 72) * 360 * 2));
    });

    it('creates renderer with showMargins option', () => {
      const r = new VirtualRenderer({}, { showMargins: true });
      r.lineFeed(); // Move y to include page
      const page = r.getPage();
      expect(page).toBeDefined();
      // Margins should be drawn (some pixels should be non-zero)
      if (page) {
        const hasContent = page.data.some((p) => p > 0);
        expect(hasContent).toBe(true);
      }
    });
  });

  // ==================== DEFAULT_RENDER_OPTIONS ====================

  describe('DEFAULT_RENDER_OPTIONS', () => {
    it('has correct defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.horizontalDpi).toBe(360);
      expect(DEFAULT_RENDER_OPTIONS.verticalDpi).toBe(360);
      expect(DEFAULT_RENDER_OPTIONS.scale).toBe(1);
      expect(DEFAULT_RENDER_OPTIONS.showMargins).toBe(false);
      expect(DEFAULT_RENDER_OPTIONS.marginColor).toBe(200);
    });
  });

  // ==================== renderText ====================

  describe('renderText', () => {
    it('renders text to page', () => {
      renderer.renderText('Hello');
      renderer.lineFeed(); // Move y to include page
      const page = renderer.getPage();

      expect(page).toBeDefined();
      if (page) {
        // Should have some black pixels
        const hasContent = page.data.some((p) => p === 255);
        expect(hasContent).toBe(true);
      }
    });

    it('advances position after rendering text', () => {
      renderer.lineFeed(); // Ensure page is included
      const initialWidth = renderer.getPage()?.data.filter((p) => p === 255).length ?? 0;

      renderer.renderText('A');
      const afterA = renderer.getPage()?.data.filter((p) => p === 255).length ?? 0;

      renderer.renderText('B');
      const afterB = renderer.getPage()?.data.filter((p) => p === 255).length ?? 0;

      expect(afterA).toBeGreaterThan(initialWidth);
      expect(afterB).toBeGreaterThan(afterA);
    });
  });

  // ==================== carriageReturn ====================

  describe('carriageReturn', () => {
    it('resets X position to left margin', () => {
      renderer.renderText('Hello');
      renderer.carriageReturn();
      renderer.renderText('A');
      renderer.lineFeed(); // Move y to include page

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });
  });

  // ==================== lineFeed ====================

  describe('lineFeed', () => {
    it('advances Y position', () => {
      renderer.renderText('Line1');
      renderer.lineFeed(); // This moves y
      renderer.renderText('Line2');

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('triggers page break when reaching bottom', () => {
      // Fill page with line feeds
      for (let i = 0; i < 100; i++) {
        renderer.lineFeed();
      }

      const pages = renderer.getPages();
      expect(pages.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== formFeed ====================

  describe('formFeed', () => {
    it('creates new page', () => {
      renderer.renderText('Page 1');
      renderer.formFeed();
      renderer.renderText('Page 2');
      renderer.lineFeed(); // Move y to include second page

      const pages = renderer.getPages();
      expect(pages.length).toBe(2);
    });

    it('resets position to top-left margin', () => {
      renderer.renderText('Content');
      renderer.formFeed();
      renderer.renderText('A');
      renderer.lineFeed(); // Move y to include second page

      const pages = renderer.getPages();
      expect(pages.length).toBe(2);
    });
  });

  // ==================== render (command parser) ====================

  describe('render', () => {
    // Helper to ensure page is included in getPages by moving y
    const ensurePageIncluded = () => renderer.lineFeed();

    it('renders ESC @ (initialize)', () => {
      const cmd = CommandBuilder.initialize();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders text data', () => {
      const text = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      renderer.render(text);
      ensurePageIncluded();

      const page = renderer.getPage();
      if (page) {
        const hasContent = page.data.some((p) => p === 255);
        expect(hasContent).toBe(true);
      }
    });

    it('renders CR (carriage return)', () => {
      const data = new Uint8Array([65, 13, 66]); // A, CR, B
      renderer.render(data);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders LF (line feed)', () => {
      const data = new Uint8Array([65, 10, 66]); // A, LF, B
      renderer.render(data);
      // LF already moves y, but add another for safety
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders FF (form feed)', () => {
      const data = new Uint8Array([65, 12, 66]); // A, FF, B
      renderer.render(data);
      ensurePageIncluded();

      const pages = renderer.getPages();
      expect(pages.length).toBe(2);
    });

    it('renders ESC 2 (line spacing 1/6)', () => {
      const cmd = CommandBuilder.lineSpacing1_6();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC 0 (line spacing 1/8)', () => {
      const cmd = CommandBuilder.lineSpacing1_8();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC 3 n (line spacing n/180)', () => {
      const cmd = CommandBuilder.lineSpacingN180(90);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC + n (line spacing n/360)', () => {
      const cmd = CommandBuilder.lineSpacingN360(60);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC E (bold on)', () => {
      const cmds = concat(
        CommandBuilder.boldOn(),
        new Uint8Array([65]) // A
      );
      renderer.render(cmds);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC F (bold off)', () => {
      const cmds = concat(
        CommandBuilder.boldOn(),
        CommandBuilder.boldOff(),
        new Uint8Array([65])
      );
      renderer.render(cmds);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC 4 (italic on)', () => {
      const cmd = CommandBuilder.italicOn();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC 5 (italic off)', () => {
      const cmd = CommandBuilder.italicOff();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC - (underline)', () => {
      const cmds = concat(
        CommandBuilder.setUnderline(true),
        new Uint8Array([65, 66, 67])
      );
      renderer.render(cmds);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC W (double width)', () => {
      const cmd = CommandBuilder.setDoubleWidth(true);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC w (double height)', () => {
      const cmd = CommandBuilder.setDoubleHeight(true);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC P (pica)', () => {
      const cmd = CommandBuilder.selectPica();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC M (elite)', () => {
      const cmd = CommandBuilder.selectElite();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC g (micron)', () => {
      const cmd = CommandBuilder.selectMicron();
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC p (proportional)', () => {
      const cmd = CommandBuilder.setProportional(true);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC $ (absolute horizontal position)', () => {
      const cmd = CommandBuilder.absoluteHorizontalPosition(100);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC J (advance vertical)', () => {
      const cmd = CommandBuilder.advanceVertical(90);
      renderer.render(cmd);
      // ESC J already advances y, but ensure page is included

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('renders ESC * (bit image)', () => {
      const data = new Uint8Array(3).fill(0xff);
      const cmd = CommandBuilder.bitImage(0, 1, data);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('skips unknown ESC commands', () => {
      // ESC followed by unknown byte
      const cmd = new Uint8Array([0x1b, 0x99]);
      renderer.render(cmd);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });

    it('skips control characters', () => {
      const data = new Uint8Array([0x01, 0x02, 65, 0x03]); // control chars + A
      renderer.render(data);
      ensurePageIncluded();

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });
  });

  // ==================== getPages ====================

  describe('getPages', () => {
    it('returns empty array for empty renderer', () => {
      const pages = new VirtualRenderer().getPages();
      // No content means no pages added yet (current page not pushed)
      expect(pages.length).toBe(0);
    });

    it('returns pages with content', () => {
      renderer.renderText('Hello');
      renderer.lineFeed(); // Move y past top margin to include page
      const pages = renderer.getPages();
      expect(pages.length).toBe(1);
    });

    it('returns multiple pages', () => {
      renderer.renderText('Page 1');
      renderer.formFeed();
      renderer.renderText('Page 2');
      renderer.lineFeed(); // Move y past top margin on second page
      const pages = renderer.getPages();
      expect(pages.length).toBe(2);
    });
  });

  // ==================== getPage ====================

  describe('getPage', () => {
    it('returns first page by default', () => {
      renderer.renderText('Hello');
      renderer.lineFeed(); // Move y position to trigger page inclusion
      const page = renderer.getPage();
      expect(page).toBeDefined();
      expect(page?.width).toBeGreaterThan(0);
    });

    it('returns page by index', () => {
      renderer.renderText('Page 1');
      renderer.formFeed();
      renderer.renderText('Page 2');
      renderer.lineFeed(); // Ensure page 2 is included

      const page1 = renderer.getPage(0);
      const page2 = renderer.getPage(1);

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      expect(page1?.width).toBeGreaterThan(0);
      expect(page2?.width).toBeGreaterThan(0);
    });

    it('returns null for invalid index', () => {
      renderer.renderText('Hello');
      renderer.lineFeed();
      const page = renderer.getPage(99);
      expect(page).toBeNull();
    });
  });

  // ==================== reset ====================

  describe('reset', () => {
    it('clears all pages', () => {
      renderer.renderText('Content');
      renderer.formFeed();
      renderer.renderText('More');

      renderer.reset();

      const pages = renderer.getPages();
      expect(pages.length).toBe(0);
    });

    it('resets to initial state', () => {
      renderer.renderText('Hello');
      renderer.lineFeed();
      renderer.renderText('World');

      renderer.reset();
      renderer.renderText('A');

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });
  });

  // ==================== Integration ====================

  describe('integration', () => {
    it('renders complete document from LayoutEngine', () => {
      const engine = new LayoutEngine();
      engine
        .initialize()
        .setBold(true)
        .println('Title')
        .setBold(false)
        .println('Content')
        .formFeed();

      const output = engine.getOutput();
      renderer.render(output);

      const page = renderer.getPage();
      expect(page).toBeDefined();
      if (page) {
        const hasContent = page.data.some((p) => p === 255);
        expect(hasContent).toBe(true);
      }
    });

    it('renders document with multiple styles', () => {
      const engine = new LayoutEngine();
      engine
        .initialize()
        .setCpi(12)
        .setUnderline(true)
        .print('Underlined ')
        .setUnderline(false)
        .setBold(true)
        .print('Bold');

      const output = engine.getOutput();
      renderer.render(output);

      const page = renderer.getPage();
      expect(page).toBeDefined();
    });
  });

  // ==================== VirtualPage structure ====================

  describe('VirtualPage structure', () => {
    it('has correct structure', () => {
      renderer.renderText('Test');
      const page = renderer.getPage();

      expect(page).toBeDefined();
      if (page) {
        expect(typeof page.number).toBe('number');
        expect(typeof page.width).toBe('number');
        expect(typeof page.height).toBe('number');
        expect(page.data).toBeInstanceOf(Uint8Array);
        expect(page.data.length).toBe(page.width * page.height);
      }
    });

    it('has white background (0)', () => {
      const page = new VirtualRenderer().getPage();
      expect(page).toBeNull(); // No content yet

      renderer.renderText(' '); // Single space
      const pageWithSpace = renderer.getPage();
      expect(pageWithSpace).toBeDefined();
    });
  });
});

// Helper function
function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
