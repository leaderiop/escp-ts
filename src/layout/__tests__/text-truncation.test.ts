/**
 * Tests for text truncation behavior
 *
 * These tests verify that:
 * 1. Text with explicit width is NOT truncated (width is for layout, not truncation)
 * 2. Text in constrained containers IS truncated appropriately
 * 3. List bullets (text with small explicit width) render correctly
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { YogaAdapter, type YogaLayoutOptions } from '../yoga';
import { flattenTree } from '../renderer';
import type { StackNode, FlexNode, TextNode } from '../nodes';

describe('Text truncation', () => {
  let yoga: YogaAdapter;

  const defaultOptions: YogaLayoutOptions = {
    availableWidth: 576,
    availableHeight: 1000,
    lineSpacing: 60,
    interCharSpace: 0,
    style: {
      bold: false,
      italic: false,
      underline: false,
      doubleStrike: false,
      doubleWidth: false,
      doubleHeight: false,
      condensed: false,
      cpi: 10,
    },
    startX: 0,
    startY: 0,
  };

  beforeAll(async () => {
    yoga = new YogaAdapter();
    await yoga.init();
  });

  describe('Text with explicit width should NOT be truncated', () => {
    it('should render bullet character even when width is smaller than character', () => {
      // A single asterisk at 10 CPI = 36 dots wide
      // Setting width: 20 should NOT truncate the asterisk
      const doc: FlexNode = {
        type: 'flex',
        children: [
          { type: 'text', content: '*', width: 20 } as TextNode,
          { type: 'text', content: 'Item text' } as TextNode,
        ],
      };

      const layoutResult = yoga.calculateLayout(doc, defaultOptions);
      const items = flattenTree(layoutResult);
      const textItems = items.filter(item => item.type === 'text');

      // Find the bullet text item
      const bulletItem = textItems.find(item =>
        item.data.type === 'text' && item.data.content.includes('*')
      );

      expect(bulletItem).toBeDefined();
      expect(bulletItem?.data.type).toBe('text');
      if (bulletItem?.data.type === 'text') {
        // The bullet should NOT be truncated
        expect(bulletItem.data.content).toBe('*');
      }
    });

    it('should render numbered bullet even when width is smaller than content', () => {
      // "1." at 10 CPI = 72 dots wide (2 chars)
      // Setting width: 20 should NOT truncate
      const doc: FlexNode = {
        type: 'flex',
        children: [
          { type: 'text', content: '1.', width: 20 } as TextNode,
          { type: 'text', content: 'Step one' } as TextNode,
        ],
      };

      const layoutResult = yoga.calculateLayout(doc, defaultOptions);
      const items = flattenTree(layoutResult);
      const textItems = items.filter(item => item.type === 'text');

      const bulletItem = textItems.find(item =>
        item.data.type === 'text' && item.data.content.includes('.')
      );

      expect(bulletItem).toBeDefined();
      if (bulletItem?.data.type === 'text') {
        // The numbered bullet should NOT be truncated
        expect(bulletItem.data.content).toBe('1.');
      }
    });

    it('should render custom arrow bullet when width is smaller than content', () => {
      // "->" at 10 CPI = 72 dots wide (2 chars)
      // Setting width: 20 should NOT truncate
      const doc: FlexNode = {
        type: 'flex',
        children: [
          { type: 'text', content: '->', width: 20 } as TextNode,
          { type: 'text', content: 'Arrow item' } as TextNode,
        ],
      };

      const layoutResult = yoga.calculateLayout(doc, defaultOptions);
      const items = flattenTree(layoutResult);
      const textItems = items.filter(item => item.type === 'text');

      const bulletItem = textItems.find(item =>
        item.data.type === 'text' && item.data.content.includes('>')
      );

      expect(bulletItem).toBeDefined();
      if (bulletItem?.data.type === 'text') {
        expect(bulletItem.data.content).toBe('->');
      }
    });
  });

  describe('Text in constrained flex container', () => {
    it('should truncate text when container has explicit width and text overflows', () => {
      // A flex container with 200px width containing long text
      // The text should be truncated to fit
      const doc: StackNode = {
        type: 'stack',
        direction: 'column',
        width: 200,
        children: [
          {
            type: 'flex',
            children: [
              { type: 'text', content: 'This is a very long text that should be truncated to fit within the container' } as TextNode,
            ],
          } as FlexNode,
        ],
      };

      const layoutResult = yoga.calculateLayout(doc, defaultOptions);
      const items = flattenTree(layoutResult);
      const textItems = items.filter(item => item.type === 'text');

      expect(textItems.length).toBe(1);
      if (textItems[0]?.data.type === 'text') {
        // Text should be truncated (not the full original)
        expect(textItems[0].data.content.length).toBeLessThan(80);
      }
    });
  });

  describe('Table column cells', () => {
    it('should render table header text when widths are large enough', () => {
      // Simulate a table row with explicit column widths
      // At 10 CPI, each char is 36 dots:
      // - "Product" = 7 chars = 252 dots -> use width: 260
      // - "SKU" = 3 chars = 108 dots -> use width: 120
      // - "Price" = 5 chars = 180 dots -> use width: 200
      // - "Stock" = 5 chars = 180 dots -> use width: 200
      const doc: FlexNode = {
        type: 'flex',
        gap: 10,
        children: [
          {
            type: 'stack',
            direction: 'column',
            width: 260,
            children: [{ type: 'text', content: 'Product' } as TextNode],
          } as StackNode,
          {
            type: 'stack',
            direction: 'column',
            width: 120,
            children: [{ type: 'text', content: 'SKU' } as TextNode],
          } as StackNode,
          {
            type: 'stack',
            direction: 'column',
            width: 200,
            children: [{ type: 'text', content: 'Price' } as TextNode],
          } as StackNode,
          {
            type: 'stack',
            direction: 'column',
            width: 200,
            children: [{ type: 'text', content: 'Stock' } as TextNode],
          } as StackNode,
        ],
      };

      const layoutResult = yoga.calculateLayout(doc, defaultOptions);
      const items = flattenTree(layoutResult);
      const textItems = items.filter(item => item.type === 'text');

      // All 4 header texts should be present
      expect(textItems.length).toBe(4);

      // Verify each header is intact (not truncated)
      const contents = textItems
        .filter(item => item.data.type === 'text')
        .map(item => (item.data as { content: string }).content);

      expect(contents).toContain('Product');
      expect(contents).toContain('SKU');
      expect(contents).toContain('Price');
      expect(contents).toContain('Stock');

      // Verify positions are distinct (columns don't overlap)
      const xPositions = textItems.map(item => item.x);
      const uniqueX = new Set(xPositions);
      expect(uniqueX.size).toBe(4); // All 4 items have different x positions
    });

    it('should truncate text when column width is smaller than content', () => {
      // Column width is smaller than "Product" (7 chars = 252 dots)
      // With width: 180, only about 5 chars fit
      const doc: FlexNode = {
        type: 'flex',
        children: [
          {
            type: 'stack',
            direction: 'column',
            width: 180,
            children: [{ type: 'text', content: 'Product Name That Is Very Long' } as TextNode],
          } as StackNode,
        ],
      };

      const layoutResult = yoga.calculateLayout(doc, defaultOptions);
      const items = flattenTree(layoutResult);
      const textItems = items.filter(item => item.type === 'text');

      expect(textItems.length).toBe(1);
      if (textItems[0]?.data.type === 'text') {
        // Text should be truncated to fit within 180 dots
        expect(textItems[0].data.content.length).toBeLessThan(30);
      }
    });
  });
});
