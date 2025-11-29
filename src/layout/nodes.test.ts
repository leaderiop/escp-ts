import { describe, it, expect } from 'vitest';
import {
  isPercentage,
  parsePercentage,
  resolvePercentage,
} from './nodes';
import {
  isContainerNode,
  isTextNode,
  isSpacerNode,
  resolvePadding,
  resolveStyle,
  DEFAULT_STYLE,
  type StackNode,
  type FlexNode,
  type TextNode,
  type SpacerNode,
  type LineNode,
  type ResolvedStyle,
} from './nodes';

describe('nodes', () => {
  // ==================== TYPE GUARDS ====================

  describe('isContainerNode', () => {
    it('returns true for stack nodes', () => {
      const node: StackNode = { type: 'stack', children: [] };
      expect(isContainerNode(node)).toBe(true);
    });

    it('returns true for flex nodes', () => {
      const node: FlexNode = { type: 'flex', children: [] };
      expect(isContainerNode(node)).toBe(true);
    });

    it('returns false for text nodes', () => {
      const node: TextNode = { type: 'text', content: 'hello' };
      expect(isContainerNode(node)).toBe(false);
    });

    it('returns false for spacer nodes', () => {
      const node: SpacerNode = { type: 'spacer' };
      expect(isContainerNode(node)).toBe(false);
    });

    it('returns false for line nodes', () => {
      const node: LineNode = { type: 'line', direction: 'horizontal' };
      expect(isContainerNode(node)).toBe(false);
    });
  });

  describe('isTextNode', () => {
    it('returns true for text nodes', () => {
      const node: TextNode = { type: 'text', content: 'hello' };
      expect(isTextNode(node)).toBe(true);
    });

    it('returns false for other nodes', () => {
      const stack: StackNode = { type: 'stack', children: [] };
      const spacer: SpacerNode = { type: 'spacer' };
      expect(isTextNode(stack)).toBe(false);
      expect(isTextNode(spacer)).toBe(false);
    });
  });

  describe('isSpacerNode', () => {
    it('returns true for spacer nodes', () => {
      const node: SpacerNode = { type: 'spacer' };
      expect(isSpacerNode(node)).toBe(true);
    });

    it('returns false for other nodes', () => {
      const text: TextNode = { type: 'text', content: 'hello' };
      expect(isSpacerNode(text)).toBe(false);
    });
  });

  // ==================== RESOLVE PADDING ====================

  describe('resolvePadding', () => {
    it('returns zero padding when undefined', () => {
      const result = resolvePadding(undefined);
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('expands number to all sides', () => {
      const result = resolvePadding(10);
      expect(result).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    });

    it('handles object with all sides specified', () => {
      const result = resolvePadding({ top: 1, right: 2, bottom: 3, left: 4 });
      expect(result).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
    });

    it('defaults missing sides to 0', () => {
      const result = resolvePadding({ top: 10 });
      expect(result).toEqual({ top: 10, right: 0, bottom: 0, left: 0 });
    });

    it('handles partial object with some sides', () => {
      const result = resolvePadding({ top: 5, bottom: 15 });
      expect(result).toEqual({ top: 5, right: 0, bottom: 15, left: 0 });
    });
  });

  // ==================== RESOLVE STYLE ====================

  describe('resolveStyle', () => {
    const parentStyle: ResolvedStyle = {
      bold: false,
      italic: false,
      underline: false,
      doubleStrike: false,
      doubleWidth: false,
      doubleHeight: false,
      condensed: false,
      cpi: 10,
    };

    it('inherits all values from parent when node has no styles', () => {
      const result = resolveStyle({}, parentStyle);
      expect(result).toEqual(parentStyle);
    });

    it('overrides specific styles from node', () => {
      const result = resolveStyle({ bold: true, cpi: 12 }, parentStyle);
      expect(result.bold).toBe(true);
      expect(result.cpi).toBe(12);
      expect(result.italic).toBe(false); // inherited
    });

    it('preserves parent styles for unset properties', () => {
      const customParent: ResolvedStyle = {
        ...parentStyle,
        bold: true,
        italic: true,
        cpi: 15,
      };
      const result = resolveStyle({ underline: true }, customParent);
      expect(result.bold).toBe(true); // inherited
      expect(result.italic).toBe(true); // inherited
      expect(result.underline).toBe(true); // overridden
      expect(result.cpi).toBe(15); // inherited
    });

    it('handles all style properties', () => {
      const result = resolveStyle(
        {
          bold: true,
          italic: true,
          underline: true,
          doubleStrike: true,
          doubleWidth: true,
          doubleHeight: true,
          condensed: true,
          cpi: 20,
        },
        parentStyle
      );
      expect(result).toEqual({
        bold: true,
        italic: true,
        underline: true,
        doubleStrike: true,
        doubleWidth: true,
        doubleHeight: true,
        condensed: true,
        cpi: 20,
      });
    });
  });

  // ==================== DEFAULT STYLE ====================

  describe('DEFAULT_STYLE', () => {
    it('has correct default values', () => {
      expect(DEFAULT_STYLE.bold).toBe(false);
      expect(DEFAULT_STYLE.italic).toBe(false);
      expect(DEFAULT_STYLE.underline).toBe(false);
      expect(DEFAULT_STYLE.doubleStrike).toBe(false);
      expect(DEFAULT_STYLE.doubleWidth).toBe(false);
      expect(DEFAULT_STYLE.doubleHeight).toBe(false);
      expect(DEFAULT_STYLE.condensed).toBe(false);
      expect(DEFAULT_STYLE.cpi).toBe(10);
    });
  });

  // ==================== PERCENTAGE HELPERS ====================

  describe('isPercentage', () => {
    it('returns true for valid percentage strings', () => {
      expect(isPercentage('50%')).toBe(true);
      expect(isPercentage('100%')).toBe(true);
      expect(isPercentage('0%')).toBe(true);
      expect(isPercentage('33.33%')).toBe(true);
    });

    it('returns false for non-percentage values', () => {
      expect(isPercentage('auto')).toBe(false);
      expect(isPercentage('fill')).toBe(false);
      expect(isPercentage(100)).toBe(false);
      expect(isPercentage('100')).toBe(false);
      expect(isPercentage('%50')).toBe(false);
      expect(isPercentage(null)).toBe(false);
      expect(isPercentage(undefined)).toBe(false);
    });
  });

  describe('parsePercentage', () => {
    it('extracts numeric value from percentage string', () => {
      expect(parsePercentage('50%')).toBe(50);
      expect(parsePercentage('100%')).toBe(100);
      expect(parsePercentage('0%')).toBe(0);
      expect(parsePercentage('33.33%')).toBe(33.33);
    });
  });

  describe('resolvePercentage', () => {
    it('calculates percentage of available size', () => {
      expect(resolvePercentage(50, 1000)).toBe(500);
      expect(resolvePercentage(100, 1000)).toBe(1000);
      expect(resolvePercentage(25, 800)).toBe(200);
      expect(resolvePercentage(33.33, 300)).toBe(99); // floor(99.99)
    });

    it('floors the result', () => {
      expect(resolvePercentage(50, 101)).toBe(50); // floor(50.5)
      expect(resolvePercentage(33, 100)).toBe(33);
    });
  });
});
