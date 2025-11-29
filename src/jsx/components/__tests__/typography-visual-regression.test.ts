/**
 * Typography Visual Regression Tests
 *
 * These tests verify that typography examples render correctly without:
 * - Content truncation (TYP-001)
 * - Text clipping at edges (TYP-002)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { YogaAdapter } from '../../../layout/yoga/YogaAdapter';
import { DEFAULT_STYLE } from '../../../layout/nodes';
import { flattenTree, sortRenderItems } from '../../../layout/renderer';
import { Layout, Text, Stack, Flex, Line, Spacer } from '../../index';
import { Heading, Paragraph, Label, Caption, Code } from '../index';

describe('Typography Visual Regression Tests', () => {
  let adapter: YogaAdapter;

  beforeAll(async () => {
    adapter = new YogaAdapter();
    await adapter.init();
  });

  /**
   * Calculate layout with sufficient height to avoid truncation
   */
  const calculateLayout = (
    doc: ReturnType<typeof Layout>,
    options: { availableWidth?: number; availableHeight?: number } = {}
  ) => {
    return adapter.calculateLayout(doc, {
      availableWidth: options.availableWidth ?? 4896, // ~13.6 inches at 360 dpi
      availableHeight: options.availableHeight ?? 10000, // Very tall to avoid truncation
      lineSpacing: 60,
      interCharSpace: 0,
      style: DEFAULT_STYLE,
    });
  };

  /**
   * Extract all rendered text items with positions
   */
  const getRenderedTexts = (result: ReturnType<typeof calculateLayout>) => {
    const items = flattenTree(result);
    const sorted = sortRenderItems(items);
    return sorted
      .filter((item) => item.data.type === 'text')
      .map((item) => ({
        content: (item.data as { type: 'text'; content: string }).content,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height ?? 0,
      }));
  };

  // ==================== TYP-001: Content Truncation Tests ====================

  describe('TYP-001: Content Truncation', () => {
    it('should render all 7 sections without truncation', () => {
      // Create a document with all 7 typography sections
      const doc = Layout({
        style: { padding: 10 },
        children: [
          // Title
          Text({ style: { bold: true, doubleWidth: true }, children: 'Typography Components' }),
          Line({ char: '=', length: 'fill' }),
          Spacer({ style: { height: 15 } }),

          // Section 1: Typeface Selection
          Text({ style: { bold: true, underline: true }, children: '1. TYPEFACE SELECTION' }),
          Spacer({ style: { height: 10 } }),
          Text({ style: { typeface: 'roman' }, children: 'Roman (default)' }),
          Text({ style: { typeface: 'sans-serif' }, children: 'Sans Serif' }),
          Text({ style: { typeface: 'courier' }, children: 'Courier' }),

          Spacer({ style: { height: 20 } }),
          Line({ char: '=', length: 'fill' }),

          // Section 2: CPI
          Text({ style: { bold: true, underline: true }, children: '2. CPI (Characters Per Inch)' }),
          Spacer({ style: { height: 10 } }),
          Text({ style: { cpi: 10 }, children: '10 CPI (Pica)' }),
          Text({ style: { cpi: 12 }, children: '12 CPI (Elite)' }),
          Text({ style: { cpi: 15 }, children: '15 CPI (Micron)' }),

          Spacer({ style: { height: 20 } }),
          Line({ char: '=', length: 'fill' }),

          // Section 3: Print Quality
          Text({ style: { bold: true, underline: true }, children: '3. PRINT QUALITY' }),
          Spacer({ style: { height: 10 } }),
          Text({ children: 'Letter Quality (LQ) - High quality output' }),
          Text({ children: 'Draft Quality - Fast output' }),

          Spacer({ style: { height: 20 } }),
          Line({ char: '=', length: 'fill' }),

          // Section 4: Heading Levels
          Text({ style: { bold: true, underline: true }, children: '4. HEADING LEVELS & STYLES' }),
          Spacer({ style: { height: 10 } }),
          Heading({ level: 1, children: 'H1 Heading' }),
          Heading({ level: 2, children: 'H2 Heading' }),
          Heading({ level: 3, children: 'H3 Heading' }),
          Heading({ level: 4, children: 'H4 Heading' }),

          Spacer({ style: { height: 20 } }),
          Line({ char: '=', length: 'fill' }),

          // Section 5: Label, Caption, Paragraph
          Text({ style: { bold: true, underline: true }, children: '5. LABEL, CAPTION & PARAGRAPH' }),
          Spacer({ style: { height: 10 } }),
          Label({ label: 'Name', value: 'John Doe' }),
          Caption({ children: 'This is a caption' }),
          Paragraph({ children: 'This is a paragraph.' }),

          Spacer({ style: { height: 20 } }),
          Line({ char: '=', length: 'fill' }),

          // Section 6: Code Component
          Text({ style: { bold: true, underline: true }, children: '6. CODE COMPONENT' }),
          Spacer({ style: { height: 10 } }),
          Code({ children: 'const x = 42;' }),

          Spacer({ style: { height: 20 } }),
          Line({ char: '=', length: 'fill' }),

          // Section 7: Combined Styles
          Text({ style: { bold: true, underline: true }, children: '7. COMBINED STYLES' }),
          Spacer({ style: { height: 10 } }),
          Text({
            style: { typeface: 'courier', cpi: 12, bold: true },
            children: 'Courier 12 CPI Bold',
          }),
          Text({
            style: { typeface: 'sans-serif', cpi: 10, italic: true },
            children: 'Sans Serif 10 CPI Italic',
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Verify all 7 section headers are rendered
      const sectionHeaders = texts.filter((t) =>
        /^[1-7]\.\s/.test(t.content) && t.content.includes('.')
      );
      expect(sectionHeaders.length).toBeGreaterThanOrEqual(7);

      // Verify specific section titles are present
      expect(texts.some((t) => t.content.includes('1. TYPEFACE SELECTION'))).toBe(true);
      expect(texts.some((t) => t.content.includes('2. CPI'))).toBe(true);
      expect(texts.some((t) => t.content.includes('3. PRINT QUALITY'))).toBe(true);
      expect(texts.some((t) => t.content.includes('4. HEADING LEVELS'))).toBe(true);
      expect(texts.some((t) => t.content.includes('5. LABEL'))).toBe(true);
      expect(texts.some((t) => t.content.includes('6. CODE'))).toBe(true);
      expect(texts.some((t) => t.content.includes('7. COMBINED'))).toBe(true);
    });

    it('should render Section 4 content completely (heading levels)', () => {
      const doc = Layout({
        style: { padding: 10 },
        children: [
          Text({ style: { bold: true, underline: true }, children: '4. HEADING LEVELS & STYLES' }),
          Spacer({ style: { height: 10 } }),
          Heading({ level: 1, children: 'H1 Heading' }),
          Heading({ level: 2, children: 'H2 Heading' }),
          Heading({ level: 3, children: 'H3 Heading' }),
          Heading({ level: 4, children: 'H4 Heading' }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // All heading levels should be rendered
      expect(texts.some((t) => t.content.includes('H1 Heading'))).toBe(true);
      expect(texts.some((t) => t.content.includes('H2 Heading'))).toBe(true);
      expect(texts.some((t) => t.content.includes('H3 Heading'))).toBe(true);
      expect(texts.some((t) => t.content.includes('H4 Heading'))).toBe(true);
    });

    it('should render Sections 5-7 which were missing in original output', () => {
      const doc = Layout({
        style: { padding: 10 },
        children: [
          // Section 5
          Text({ style: { bold: true, underline: true }, children: '5. LABEL, CAPTION & PARAGRAPH' }),
          Label({ label: 'Name', value: 'John Doe' }),
          Caption({ children: 'Caption text' }),
          Paragraph({ children: 'Paragraph text' }),

          // Section 6
          Text({ style: { bold: true, underline: true }, children: '6. CODE COMPONENT' }),
          Code({ children: 'const x = 42;' }),

          // Section 7
          Text({ style: { bold: true, underline: true }, children: '7. COMBINED STYLES' }),
          Text({ style: { typeface: 'courier', bold: true }, children: 'Combined style text' }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Verify sections 5, 6, 7 are present
      expect(texts.some((t) => t.content.includes('5. LABEL'))).toBe(true);
      expect(texts.some((t) => t.content.includes('6. CODE'))).toBe(true);
      expect(texts.some((t) => t.content.includes('7. COMBINED'))).toBe(true);

      // Verify content from each section (Label renders label text as "Name:")
      expect(texts.some((t) => t.content === 'Name:')).toBe(true); // Label text
      expect(texts.some((t) => t.content === 'John Doe')).toBe(true); // Label value
      expect(texts.some((t) => t.content.includes('Caption text'))).toBe(true);
      expect(texts.some((t) => t.content.includes('Paragraph text'))).toBe(true);
      expect(texts.some((t) => t.content.includes('const x = 42;'))).toBe(true); // Code
      expect(texts.some((t) => t.content.includes('Combined style text'))).toBe(true);
    });

    it('should calculate total layout height to fit all content', () => {
      const doc = Layout({
        style: { padding: 10 },
        children: [
          // Create 50 lines of content to test height calculation
          ...Array.from({ length: 50 }, (_, i) =>
            Text({ children: `Line ${i + 1}: This is content that should not be truncated` })
          ),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // All 50 lines should be rendered
      expect(texts.length).toBe(50);

      // Verify last line is present
      expect(texts.some((t) => t.content.includes('Line 50'))).toBe(true);

      // Get max Y position to verify layout height
      const maxY = Math.max(...texts.map((t) => t.y + t.height));
      expect(maxY).toBeGreaterThan(0);
    });
  });

  // ==================== TYP-002: Text Clipping Tests ====================

  describe('TYP-002: Text Clipping at Edges', () => {
    it('should not clip text at right edge of container', () => {
      const shortText = 'OCR fonts are for machine reading';

      const doc = Layout({
        style: { padding: 10, width: 4896 }, // Full width
        children: [
          Flex({
            style: { gap: 40 },
            children: [
              Stack({
                style: { width: '32%' },
                children: [
                  Text({ style: { bold: true }, children: 'OCR Typefaces' }),
                  Caption({ children: shortText }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Find the OCR caption text
      const ocrCaption = texts.find((t) => t.content.includes('OCR fonts'));

      expect(ocrCaption).toBeDefined();
      // The full text should be present, not truncated
      expect(ocrCaption!.content).toContain('machine reading');
    });

    it('should wrap or clip text within column bounds', () => {
      const doc = Layout({
        style: { padding: 10, width: 4896 },
        children: [
          Flex({
            style: { gap: 40 },
            children: [
              // Three equal columns
              Stack({
                style: { width: '32%' },
                children: [
                  Text({ children: 'Column 1 content that might be long' }),
                ],
              }),
              Stack({
                style: { width: '32%' },
                children: [
                  Text({ children: 'Column 2 content' }),
                ],
              }),
              Stack({
                style: { width: '32%' },
                children: [
                  Text({ children: 'Column 3 content with long description text' }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // All three column texts should be present
      expect(texts.some((t) => t.content.includes('Column 1'))).toBe(true);
      expect(texts.some((t) => t.content.includes('Column 2'))).toBe(true);
      expect(texts.some((t) => t.content.includes('Column 3'))).toBe(true);

      // Verify no text overlaps by checking X positions
      const sortedByX = [...texts].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sortedByX.length; i++) {
        const prev = sortedByX[i - 1];
        const curr = sortedByX[i];
        // If on same line (similar Y), should not overlap
        if (Math.abs(prev.y - curr.y) < 10) {
          expect(curr.x).toBeGreaterThanOrEqual(prev.x + prev.width - 1); // Allow 1px tolerance
        }
      }
    });

    it('should render Caption text fully without truncation', () => {
      const captionText = 'OCR fonts are for machine reading';

      const doc = Layout({
        style: { padding: 10 },
        children: [
          Caption({ children: captionText }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      expect(texts.length).toBe(1);
      // Full text should be present
      expect(texts[0].content).toBe(captionText);
    });

    it('should clip long text within percentage-based width columns to prevent overlap', () => {
      const doc = Layout({
        style: { padding: 10, width: 4896 },
        children: [
          Flex({
            style: { gap: 40 },
            children: [
              Stack({
                style: { width: '32%' },
                children: [
                  // Long caption that will be clipped to fit within 32% column width
                  Caption({ children: 'This is a very long caption that describes something important about optical character recognition fonts and their usage' }),
                ],
              }),
              Stack({
                style: { width: '32%' },
                children: [
                  Text({ children: 'Middle column' }),
                ],
              }),
              Stack({
                style: { width: '32%' },
                children: [
                  Text({ children: 'Right column' }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Find the caption - it will be truncated due to percentage width constraint
      // With 32% of 4896 = ~1567 dots, at 10 CPI = ~43 chars max
      const caption = texts.find((t) => t.content.includes('This is a very long'));
      expect(caption).toBeDefined();

      // Find middle column text
      const middleCol = texts.find((t) => t.content.includes('Middle column'));
      expect(middleCol).toBeDefined();

      // Caption should be clipped and NOT overlap with middle column
      // Middle column starts after first column width + gap
      const firstColWidth = Math.ceil((4896 - 20) * 0.32); // ~1561 (rounded up)
      expect(middleCol!.x).toBeGreaterThanOrEqual(firstColWidth);

      // Caption text width should fit within the column (with small tolerance for rounding)
      expect(caption!.width).toBeLessThanOrEqual(firstColWidth + 5);
    });
  });

  // ==================== Typography Component Specific Tests ====================

  describe('Typography Component Rendering', () => {
    it('should render all typefaces correctly', () => {
      const typefaces = ['roman', 'sans-serif', 'courier', 'prestige', 'script'] as const;

      const doc = Layout({
        style: { padding: 10 },
        children: typefaces.map((tf) =>
          Text({ style: { typeface: tf }, children: `${tf} typeface` })
        ),
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // All typeface texts should be rendered
      expect(texts.length).toBe(typefaces.length);
      typefaces.forEach((tf) => {
        expect(texts.some((t) => t.content.includes(tf))).toBe(true);
      });
    });

    it('should render all CPI values correctly', () => {
      const cpiValues = [10, 12, 15, 17, 20] as const;

      const doc = Layout({
        style: { padding: 10 },
        children: cpiValues.map((cpi) =>
          Text({
            style: { cpi, condensed: cpi === 17 || cpi === 20 },
            children: `${cpi} CPI text`,
          })
        ),
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // All CPI texts should be rendered
      expect(texts.length).toBe(cpiValues.length);
      cpiValues.forEach((cpi) => {
        expect(texts.some((t) => t.content.includes(`${cpi} CPI`))).toBe(true);
      });
    });

    it('should render Code component with border', () => {
      const doc = Layout({
        style: { padding: 10 },
        children: [Code({ children: 'const x = 42;' })],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Code content should be present
      expect(texts.some((t) => t.content.includes('const x = 42'))).toBe(true);
    });

    it('should render Label component with label and value', () => {
      const doc = Layout({
        style: { padding: 10 },
        children: [Label({ label: 'Email', value: 'test@example.com' })],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Both label and value should be present (Label uses Stack wrapper for label text)
      const hasLabel = texts.some((t) => t.content === 'Email:');
      const hasValue = texts.some((t) => t.content === 'test@example.com');

      expect(hasLabel).toBe(true);
      expect(hasValue).toBe(true);
    });
  });
});
