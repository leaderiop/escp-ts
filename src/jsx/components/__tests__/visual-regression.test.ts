/**
 * Visual Regression Tests for JSX Components
 *
 * These tests verify that components render correctly through the Yoga layout
 * system and produce proper output without text truncation or overlap issues.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { YogaAdapter } from '../../../layout/yoga/YogaAdapter';
import { DEFAULT_STYLE } from '../../../layout/nodes';
import { flattenTree, sortRenderItems } from '../../../layout/renderer';
import { Layout, Text, Stack, Flex } from '../../index';
import { Label, Table, Card, Badge } from '../index';

describe('Visual Regression Tests', () => {
  let adapter: YogaAdapter;

  beforeAll(async () => {
    adapter = new YogaAdapter();
    await adapter.init();
  });

  const calculateLayout = (doc: ReturnType<typeof Layout>) => {
    return adapter.calculateLayout(doc, {
      availableWidth: 576,
      availableHeight: 2000,
      lineSpacing: 60,
      interCharSpace: 0,
      style: DEFAULT_STYLE,
    });
  };

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
      }));
  };

  // ==================== LABEL COMPONENT TESTS ====================

  describe('Label Component Rendering', () => {
    it('should render label with full colon visible', () => {
      const doc = Layout({
        style: { width: 576, padding: 20 },
        children: [
          Label({ label: 'Name', value: 'John Doe', labelWidth: 200 }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Find the label text
      const labelText = texts.find((t) => t.content.includes('Name'));
      expect(labelText).toBeDefined();
      // Label should include the colon and not be truncated
      expect(labelText!.content).toBe('Name:');
    });

    it('should render label and value without overlap', () => {
      const doc = Layout({
        style: { width: 576, padding: 20 },
        children: [
          Label({ label: 'Email', value: 'john@example.com', labelWidth: 200 }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      expect(texts).toHaveLength(2);
      const [label, value] = texts;

      // Label and value should not overlap
      // Value X position should be >= label X + label width
      expect(value.x).toBeGreaterThanOrEqual(label.x + label.width);
    });

    it('should render multiple labels on separate lines', () => {
      const doc = Layout({
        style: { width: 576, padding: 20 },
        children: [
          Label({ label: 'Name', value: 'John Doe' }),
          Label({ label: 'Email', value: 'john@example.com' }),
          Label({ label: 'Phone', value: '+1 (555) 123-4567' }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Should have 6 text items (3 labels + 3 values)
      expect(texts.length).toBe(6);

      // Get Y positions of labels
      const yPositions = [...new Set(texts.map((t) => t.y))];

      // Should be on 3 different lines
      expect(yPositions.length).toBe(3);
    });
  });

  // ==================== TABLE COMPONENT TESTS ====================

  describe('Table Component Rendering', () => {
    it('should render table columns with proper spacing', () => {
      // Use wider columns to fit text at 10 CPI (36 dots/char)
      // "Product" = 7 chars × 36 = 252 dots, need at least 260 width
      // "Price" = 5 chars × 36 = 180 dots, need at least 200 width
      const doc = Layout({
        style: { width: 576, padding: 20 },
        children: [
          Table({
            columns: [
              { header: 'Product', key: 'name', width: 280 },
              { header: 'Price', key: 'price', width: 200 },
            ],
            data: [{ name: 'Widget', price: '$10.00' }],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Find header texts
      const productHeader = texts.find((t) => t.content.includes('Product'));
      const priceHeader = texts.find((t) => t.content.includes('Price'));

      expect(productHeader).toBeDefined();
      expect(priceHeader).toBeDefined();

      // Headers should not overlap
      if (productHeader && priceHeader) {
        expect(priceHeader.x).toBeGreaterThanOrEqual(
          productHeader.x + productHeader.width
        );
      }
    });

    it('should render table data rows without text concatenation', () => {
      // Use wider columns to fit text at 10 CPI (36 dots/char)
      // "Keyboard" = 8 chars × 36 = 288 dots, need at least 300 width
      // "KB-101" = 6 chars × 36 = 216 dots, need at least 250 width
      const doc = Layout({
        style: { width: 700, padding: 20 },
        children: [
          Table({
            columns: [
              { header: 'Name', key: 'name', width: 320 },
              { header: 'SKU', key: 'sku', width: 260 },
            ],
            data: [{ name: 'Keyboard', sku: 'KB-101' }],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Find the data row texts
      const keyboardText = texts.find((t) => t.content.includes('Keyboard'));
      const skuText = texts.find((t) => t.content.includes('KB'));

      expect(keyboardText).toBeDefined();
      expect(skuText).toBeDefined();

      // Texts should be separate, not concatenated
      expect(keyboardText!.content).not.toContain('KB');
      expect(skuText!.content).not.toContain('Keyboard');
    });
  });

  // ==================== CARD COMPONENT TESTS ====================

  describe('Card Component Rendering', () => {
    it('should render card content on separate lines', () => {
      const doc = Layout({
        style: { width: 720, padding: 20 }, // Wider container to prevent text clipping
        children: [
          Card({
            title: 'Customer Info',
            children: Stack({
              children: [
                Text({ children: 'John Doe' }),
                Text({ children: 'john@example.com' }),
              ],
            }),
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Find the content texts
      const johnText = texts.find((t) => t.content === 'John Doe');
      const emailText = texts.find((t) => t.content === 'john@example.com');

      expect(johnText).toBeDefined();
      expect(emailText).toBeDefined();

      // They should be on different Y positions (different lines)
      expect(emailText!.y).toBeGreaterThan(johnText!.y);
    });

    it('should render multiple cards without vertical overlap', () => {
      const doc = Layout({
        style: { width: 576, padding: 20 },
        children: [
          Stack({
            style: { gap: 20 },
            children: [
              Card({
                title: 'Card 1',
                children: Text({ children: 'Content 1' }),
              }),
              Card({
                title: 'Card 2',
                children: Text({ children: 'Content 2' }),
              }),
            ],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      const card1Title = texts.find((t) => t.content === 'Card 1');
      const card2Title = texts.find((t) => t.content === 'Card 2');
      const content1 = texts.find((t) => t.content === 'Content 1');
      const content2 = texts.find((t) => t.content === 'Content 2');

      expect(card1Title).toBeDefined();
      expect(card2Title).toBeDefined();
      expect(content1).toBeDefined();
      expect(content2).toBeDefined();

      // Card 2 should be below Card 1 content
      expect(card2Title!.y).toBeGreaterThan(content1!.y);
    });
  });

  // ==================== BADGE COMPONENT TESTS ====================

  describe('Badge Component Rendering', () => {
    it('should render badge with visible text', () => {
      const doc = Layout({
        style: { width: 576, padding: 20 },
        children: [
          Flex({
            style: { gap: 20 },
            children: [
              Text({ children: 'Status:' }),
              Badge({ variant: 'success', children: 'PAID' }),
            ],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      // Find the badge text - it should contain PAID with brackets
      const badgeText = texts.find((t) => t.content.includes('PAID'));
      expect(badgeText).toBeDefined();
      // Badge should render with brackets
      expect(badgeText!.content).toMatch(/\[.*PAID.*\]/);
    });
  });

  // ==================== FLEX ROW TEXT DISTRIBUTION ====================

  describe('Flex Row Text Distribution', () => {
    it('should distribute text items across flex row without overlap', () => {
      const doc = Layout({
        style: { width: 576, padding: 20 },
        children: [
          Flex({
            style: { gap: 20 },
            children: [
              Text({ children: 'Left' }),
              Text({ children: 'Center' }),
              Text({ children: 'Right' }),
            ],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      expect(texts).toHaveLength(3);

      // Sort by X position
      const sorted = [...texts].sort((a, b) => a.x - b.x);

      // Each item should start after the previous item ends (plus gap)
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        // Current item X should be >= previous item end
        expect(curr.x).toBeGreaterThanOrEqual(prev.x + prev.width);
      }
    });

    it('should clip text in constrained flex row rather than overlap', () => {
      // Create a scenario where text doesn't fit
      const doc = Layout({
        style: { width: 300, padding: 10 }, // Narrow container
        children: [
          Flex({
            children: [
              Text({ children: 'VeryLongTextThatShouldBeClipped' }),
              Text({ children: 'AnotherLongText' }),
            ],
          }),
        ],
      });

      const result = calculateLayout(doc);
      const texts = getRenderedTexts(result);

      expect(texts).toHaveLength(2);

      // Texts should not overlap
      const [first, second] = texts.sort((a, b) => a.x - b.x);
      expect(second.x).toBeGreaterThanOrEqual(first.x + first.width);
    });
  });
});
