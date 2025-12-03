/**
 * Tests for Label Component
 *
 * These tests verify that the Label component:
 * 1. Creates correct Flex layout structure
 * 2. Does NOT set explicit width that would trigger text clipping
 * 3. Properly formats label text with/without colon
 * 4. Handles value prop and children correctly
 */

import { describe, it, expect } from 'vitest';
import { Label } from '../Label';
import type { FlexNode, TextNode, LayoutNode } from '../../../../layout/nodes';

describe('Label Component', () => {
  describe('node structure', () => {
    it('should return a flex node', () => {
      const result = Label({ label: 'Name', value: 'John' });
      expect(result.type).toBe('flex');
    });

    it('should have two children (label text and value)', () => {
      const result = Label({ label: 'Name', value: 'John' }) as FlexNode;
      expect(result.children).toHaveLength(2);
    });

    it('should have text nodes as children', () => {
      const result = Label({ label: 'Name', value: 'John' }) as FlexNode;
      expect(result.children[0].type).toBe('text');
      expect(result.children[1].type).toBe('text');
    });
  });

  describe('label text formatting', () => {
    it('should add colon to label by default', () => {
      const result = Label({ label: 'Name', value: 'John' }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      expect(labelText.content).toBe('Name:');
    });

    it('should not add colon when colon=false', () => {
      const result = Label({ label: 'Name', value: 'John', colon: false }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      expect(labelText.content).toBe('Name');
    });

    it('should handle empty label', () => {
      const result = Label({ label: '', value: 'Value' }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      expect(labelText.content).toBe(':');
    });

    it('should handle label with special characters', () => {
      const result = Label({ label: 'Tax (8%)', value: '$68.00' }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      expect(labelText.content).toBe('Tax (8%):');
    });
  });

  describe('value handling', () => {
    it('should render string value', () => {
      const result = Label({ label: 'Name', value: 'John Smith' }) as FlexNode;
      const valueText = result.children[1] as TextNode;
      expect(valueText.content).toBe('John Smith');
    });

    it('should convert number value to string', () => {
      const result = Label({ label: 'Count', value: 42 }) as FlexNode;
      const valueText = result.children[1] as TextNode;
      expect(valueText.content).toBe('42');
    });

    it('should use children when value not provided', () => {
      const childNode: TextNode = { type: 'text', content: 'Child Value' };
      const result = Label({ label: 'Test', children: childNode }) as FlexNode;
      expect(result.children[1]).toBe(childNode);
    });

    it('should use first child from array', () => {
      const childNode: TextNode = { type: 'text', content: 'First' };
      const result = Label({ label: 'Test', children: [childNode] }) as FlexNode;
      expect(result.children[1]).toBe(childNode);
    });

    it('should prefer value over children', () => {
      const childNode: TextNode = { type: 'text', content: 'Child' };
      const result = Label({ label: 'Test', value: 'Value', children: childNode }) as FlexNode;
      const valueText = result.children[1] as TextNode;
      expect(valueText.content).toBe('Value');
    });
  });

  describe('no text clipping (critical fix)', () => {
    it('should NOT have explicit width on flex container', () => {
      const result = Label({ label: 'Subtotal', value: '$850.00' }) as FlexNode;
      // The flex container should NOT have a numeric or percentage width
      // that would trigger shouldClipText
      expect(result.width).toBeUndefined();
    });

    it('should NOT have explicit width on label text', () => {
      const result = Label({ label: 'Subtotal', value: '$850.00' }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      expect(labelText.width).toBeUndefined();
    });

    it('should NOT have explicit width on value text', () => {
      const result = Label({ label: 'Subtotal', value: '$850.00' }) as FlexNode;
      const valueText = result.children[1] as TextNode;
      expect(valueText.width).toBeUndefined();
    });

    it('should have gap for spacing instead of explicit width', () => {
      const result = Label({ label: 'Test', value: 'Value' }) as FlexNode;
      expect(result.gap).toBe(18);
    });
  });

  describe('style application', () => {
    it('should apply style prop to flex container', () => {
      const result = Label({
        label: 'Test',
        value: 'Value',
        style: { bold: true },
      }) as FlexNode;
      expect(result.bold).toBe(true);
    });

    it('should apply typeface prop', () => {
      const result = Label({
        label: 'Test',
        value: 'Value',
        typeface: 'roman',
      }) as FlexNode;
      expect(result.typeface).toBe('roman');
    });

    it('should merge style and typeface', () => {
      const result = Label({
        label: 'Test',
        value: 'Value',
        style: { bold: true },
        typeface: 'sans-serif',
      }) as FlexNode;
      expect(result.bold).toBe(true);
      expect(result.typeface).toBe('sans-serif');
    });
  });

  describe('real-world label examples', () => {
    it('should handle invoice subtotal label', () => {
      const result = Label({ label: 'Subtotal', value: '$850.00' }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      const valueText = result.children[1] as TextNode;

      expect(labelText.content).toBe('Subtotal:');
      expect(valueText.content).toBe('$850.00');
      expect(result.width).toBeUndefined(); // No clipping width
    });

    it('should handle order tracking label', () => {
      const result = Label({ label: 'Tracking', value: '1Z999AA10...' }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      const valueText = result.children[1] as TextNode;

      expect(labelText.content).toBe('Tracking:');
      expect(valueText.content).toBe('1Z999AA10...');
      expect(result.width).toBeUndefined(); // No clipping width
    });

    it('should handle date label', () => {
      const result = Label({ label: 'Estimated', value: 'Dec 20, 2024' }) as FlexNode;
      const labelText = result.children[0] as TextNode;
      const valueText = result.children[1] as TextNode;

      expect(labelText.content).toBe('Estimated:');
      expect(valueText.content).toBe('Dec 20, 2024');
      expect(result.width).toBeUndefined(); // No clipping width
    });
  });
});
