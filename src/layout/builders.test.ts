import { describe, it, expect } from 'vitest';
import {
  StackBuilder,
  FlexBuilder,
  stack,
  flex,
  text,
  spacer,
  line,
} from './builders';
import type { SpaceQuery } from './nodes';

describe('builders', () => {
  // ==================== STACK BUILDER ====================

  describe('StackBuilder', () => {
    it('creates a default stack node', () => {
      const node = stack().build();
      expect(node.type).toBe('stack');
      expect(node.direction).toBe('column');
      expect(node.children).toEqual([]);
    });

    it('sets direction', () => {
      const node = stack().direction('row').build();
      expect(node.direction).toBe('row');
    });

    it('sets gap', () => {
      const node = stack().gap(10).build();
      expect(node.gap).toBe(10);
    });

    it('sets alignment', () => {
      const node = stack().align('center').build();
      expect(node.align).toBe('center');
    });

    it('sets vertical alignment', () => {
      const node = stack().vAlign('bottom').build();
      expect(node.vAlign).toBe('bottom');
    });

    it('sets dimensions', () => {
      const node = stack().width(100).height(200).build();
      expect(node.width).toBe(100);
      expect(node.height).toBe(200);
    });

    it('sets padding', () => {
      const node = stack().padding(10).build();
      expect(node.padding).toBe(10);
    });

    it('sets margin as uniform number', () => {
      const node = stack().margin(15).build();
      expect(node.margin).toBe(15);
    });

    it('sets margin as object', () => {
      const node = stack().margin({ top: 10, right: 20, bottom: 30, left: 40 }).build();
      expect(node.margin).toEqual({ top: 10, right: 20, bottom: 30, left: 40 });
    });

    it('sets style properties', () => {
      const node = stack()
        .bold()
        .italic()
        .underline()
        .doubleWidth()
        .doubleHeight()
        .cpi(12)
        .build();
      expect(node.bold).toBe(true);
      expect(node.italic).toBe(true);
      expect(node.underline).toBe(true);
      expect(node.doubleWidth).toBe(true);
      expect(node.doubleHeight).toBe(true);
      expect(node.cpi).toBe(12);
    });

    it('adds text children', () => {
      const node = stack().text('Hello').text('World', { bold: true }).build();
      expect(node.children.length).toBe(2);
      expect(node.children[0]).toEqual({ type: 'text', content: 'Hello' });
      expect(node.children[1]).toEqual({ type: 'text', content: 'World', bold: true });
    });

    it('adds spacer children', () => {
      const node = stack().spacer(20).spacer().build();
      expect(node.children.length).toBe(2);
      expect(node.children[0]).toEqual({ type: 'spacer', height: 20 });
      expect(node.children[1]).toEqual({ type: 'spacer', height: undefined });
    });

    it('adds line children', () => {
      const node = stack().line('-', 'fill').line('=', 100).build();
      expect(node.children.length).toBe(2);
      expect(node.children[0]).toEqual({
        type: 'line',
        direction: 'horizontal',
        char: '-',
        length: 'fill',
      });
      expect(node.children[1]).toEqual({
        type: 'line',
        direction: 'horizontal',
        char: '=',
        length: 100,
      });
    });

    it('adds child nodes via add()', () => {
      const textNode = text('Test');
      const node = stack().add(textNode).build();
      expect(node.children.length).toBe(1);
      expect(node.children[0]).toEqual(textNode);
    });

    it('adds nested builders via add()', () => {
      const nested = stack().text('Nested');
      const node = stack().add(nested).build();
      expect(node.children.length).toBe(1);
      expect(node.children[0].type).toBe('stack');
    });

    it('supports nested stack via callback', () => {
      const node = stack()
        .stack((b) => b.text('Inner'))
        .build();
      expect(node.children.length).toBe(1);
      expect(node.children[0].type).toBe('stack');
    });

    it('supports nested flex via callback', () => {
      const node = stack()
        .flex((b) => b.text('Left').text('Right'))
        .build();
      expect(node.children.length).toBe(1);
      expect(node.children[0].type).toBe('flex');
    });

    it('chains multiple methods', () => {
      const node = stack()
        .direction('column')
        .gap(5)
        .align('center')
        .bold()
        .text('Title')
        .text('Subtitle')
        .build();

      expect(node.direction).toBe('column');
      expect(node.gap).toBe(5);
      expect(node.align).toBe('center');
      expect(node.bold).toBe(true);
      expect(node.children.length).toBe(2);
    });

    it('sets minWidth and maxWidth', () => {
      const node = stack().minWidth(100).maxWidth(500).build();
      expect(node.minWidth).toBe(100);
      expect(node.maxWidth).toBe(500);
    });

    it('sets minHeight and maxHeight', () => {
      const node = stack().minHeight(50).maxHeight(200).build();
      expect(node.minHeight).toBe(50);
      expect(node.maxHeight).toBe(200);
    });

    it('sets absolute position', () => {
      const node = stack().absolutePosition(100, 200).build();
      expect(node.position).toBe('absolute');
      expect(node.posX).toBe(100);
      expect(node.posY).toBe(200);
    });

    it('sets when condition with callback', () => {
      const condition = (ctx: { availableWidth: number }) => ctx.availableWidth > 500;
      const node = stack().when(condition).build();
      expect(node.when).toBe(condition);
    });

    it('sets when condition with SpaceQuery', () => {
      const query: SpaceQuery = { minWidth: 500, maxHeight: 1000 };
      const node = stack().when(query).build();
      expect(node.when).toEqual(query);
    });

    it('sets fallback node', () => {
      const fallbackNode = text('Fallback');
      const node = stack().when((ctx) => ctx.availableWidth > 5000).fallback(fallbackNode).build();
      expect(node.fallback).toBe(fallbackNode);
    });
  });

  // ==================== FLEX BUILDER ====================

  describe('FlexBuilder', () => {
    it('creates a default flex node', () => {
      const node = flex().build();
      expect(node.type).toBe('flex');
      expect(node.children).toEqual([]);
    });

    it('sets gap', () => {
      const node = flex().gap(15).build();
      expect(node.gap).toBe(15);
    });

    it('sets justify content', () => {
      const node = flex().justify('space-between').build();
      expect(node.justify).toBe('space-between');
    });

    it('sets align items', () => {
      const node = flex().alignItems('center').build();
      expect(node.alignItems).toBe('center');
    });

    it('sets dimensions', () => {
      const node = flex().width('fill').height(50).build();
      expect(node.width).toBe('fill');
      expect(node.height).toBe(50);
    });

    it('sets padding', () => {
      const node = flex().padding({ top: 5, bottom: 5 }).build();
      expect(node.padding).toEqual({ top: 5, bottom: 5 });
    });

    it('sets margin', () => {
      const node = flex().margin({ left: 20, right: 20 }).build();
      expect(node.margin).toEqual({ left: 20, right: 20 });
    });

    it('sets style properties', () => {
      const node = flex().bold().italic().underline().doubleWidth().doubleHeight().cpi(15).build();
      expect(node.bold).toBe(true);
      expect(node.italic).toBe(true);
      expect(node.underline).toBe(true);
      expect(node.doubleWidth).toBe(true);
      expect(node.doubleHeight).toBe(true);
      expect(node.cpi).toBe(15);
    });

    it('adds text children', () => {
      const node = flex().text('Left').text('Right', { align: 'right' }).build();
      expect(node.children.length).toBe(2);
    });

    it('adds flexible spacers', () => {
      const node = flex().text('Left').spacer().text('Right').build();
      expect(node.children.length).toBe(3);
      expect(node.children[1]).toEqual({ type: 'spacer', width: undefined, flex: true });
    });

    it('adds fixed width spacers', () => {
      const node = flex().spacer(50).build();
      expect(node.children[0]).toEqual({ type: 'spacer', width: 50, flex: false });
    });

    it('adds child nodes via add()', () => {
      const node = flex().add(text('Test')).build();
      expect(node.children.length).toBe(1);
    });

    it('adds nested builders via add()', () => {
      const nested = flex().text('Inner');
      const node = flex().add(nested).build();
      expect(node.children.length).toBe(1);
      expect(node.children[0].type).toBe('flex');
    });

    it('supports nested builders via callbacks', () => {
      const node = flex()
        .stack((b) => b.text('Line 1').text('Line 2'))
        .flex((b) => b.text('A').text('B'))
        .build();
      expect(node.children.length).toBe(2);
    });
  });

  // ==================== FACTORY FUNCTIONS ====================

  describe('factory functions', () => {
    describe('stack()', () => {
      it('returns a StackBuilder', () => {
        expect(stack()).toBeInstanceOf(StackBuilder);
      });
    });

    describe('flex()', () => {
      it('returns a FlexBuilder', () => {
        expect(flex()).toBeInstanceOf(FlexBuilder);
      });
    });

    describe('text()', () => {
      it('creates a text node', () => {
        const node = text('Hello');
        expect(node.type).toBe('text');
        expect(node.content).toBe('Hello');
      });

      it('applies options', () => {
        const node = text('Hello', { bold: true, align: 'center' });
        expect(node.bold).toBe(true);
        expect(node.align).toBe('center');
      });
    });

    describe('spacer()', () => {
      it('creates a flexible spacer by default', () => {
        const node = spacer();
        expect(node.type).toBe('spacer');
        expect(node.flex).toBe(true);
        expect(node.width).toBeUndefined();
        expect(node.height).toBeUndefined();
      });

      it('creates a fixed size spacer', () => {
        const node = spacer(20);
        expect(node.width).toBe(20);
        expect(node.height).toBe(20);
        expect(node.flex).toBe(false);
      });

      it('allows overriding flex behavior', () => {
        const node = spacer(20, true);
        expect(node.width).toBe(20);
        expect(node.flex).toBe(true);
      });
    });

    describe('line()', () => {
      it('creates a horizontal line with defaults', () => {
        const node = line();
        expect(node.type).toBe('line');
        expect(node.direction).toBe('horizontal');
        expect(node.char).toBe('-');
        expect(node.length).toBeUndefined();
      });

      it('creates a line with custom character', () => {
        const node = line('=');
        expect(node.char).toBe('=');
      });

      it('creates a line with specified length', () => {
        const node = line('-', 'fill');
        expect(node.length).toBe('fill');
      });

      it('creates a line with fixed length', () => {
        const node = line('*', 100);
        expect(node.length).toBe(100);
      });
    });

  });

  // ==================== INTEGRATION TESTS ====================

  describe('integration', () => {
    it('builds a complete receipt-like layout using flex', () => {
      const receipt = stack()
        .align('center')
        .text('STORE NAME', { bold: true, doubleWidth: true })
        .text('123 Main Street')
        .line('-', 'fill')
        .add(flex().justify('space-between').text('Widget x 2').text('$10.00'))
        .add(flex().justify('space-between').text('Gadget x 1').text('$25.00'))
        .line('-', 'fill')
        .add(flex().justify('space-between').text('Total:').text('$45.00', { bold: true }))
        .spacer(20)
        .text('Thank you!')
        .build();

      expect(receipt.type).toBe('stack');
      expect(receipt.align).toBe('center');
      expect(receipt.children.length).toBe(9);
    });

    it('builds a form-like layout', () => {
      const form = stack()
        .gap(10)
        .add(
          flex().justify('start').gap(20).text('Name:').text('________________', { width: 'fill' })
        )
        .add(
          flex().justify('start').gap(20).text('Email:').text('________________', { width: 'fill' })
        )
        .build();

      expect(form.type).toBe('stack');
      expect(form.gap).toBe(10);
      expect(form.children.length).toBe(2);
    });
  });
});
