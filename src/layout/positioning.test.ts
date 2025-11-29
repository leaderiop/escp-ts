import { describe, it, expect, beforeAll } from 'vitest';
import { YogaAdapter } from './yoga';
import { stack, flex, text } from './builders';
import { DEFAULT_STYLE, type LayoutNode } from './nodes';

// Initialize Yoga adapter for tests
let yogaAdapter: YogaAdapter;

beforeAll(async () => {
  yogaAdapter = new YogaAdapter();
  await yogaAdapter.init();
});

// Helper to get layout result from a node
function layoutFromNode(node: LayoutNode, options?: { availableWidth?: number; availableHeight?: number }) {
  return yogaAdapter.calculateLayout(node, {
    availableWidth: options?.availableWidth ?? 1000,
    availableHeight: options?.availableHeight ?? 500,
    lineSpacing: 60,
    interCharSpace: 0,
    style: DEFAULT_STYLE,
    startX: 0,
    startY: 0,
  });
}

describe('positioning', () => {
  // ==================== Absolute Positioning ====================

  describe('absolute positioning', () => {
    it('positions element at explicit x, y coordinates', () => {
      const layout = layoutFromNode(
        stack()
          .add(
            stack()
              .absolutePosition(100, 50)
              .text('Absolute')
          )
          .build()
      );

      // Find the absolute positioned child
      const absoluteChild = layout.children?.[0];
      expect(absoluteChild).toBeDefined();
      expect(absoluteChild?.x).toBe(100);
      expect(absoluteChild?.y).toBe(50);
    });

    it('absolute positioned items do not affect sibling flow', () => {
      const layout = layoutFromNode(
        stack()
          .gap(10)
          .add(stack().text('First'))
          .add(
            stack()
              .absolutePosition(200, 200)
              .text('Absolute')
          )
          .add(stack().text('Second'))
          .build()
      );

      // First and Second should be positioned as if Absolute doesn't exist
      const children = layout.children ?? [];
      expect(children.length).toBe(3);

      // First item at y=0
      expect(children[0].y).toBe(0);

      // Second item should follow First, not be pushed down by Absolute
      // The gap between them should be 10
      const firstHeight = children[0].height;
      expect(children[2].y).toBe(firstHeight + 10);
    });

    it('positions at (0, 0) correctly', () => {
      const layout = layoutFromNode(
        stack()
          .padding(50)
          .add(
            stack()
              .absolutePosition(0, 0)
              .text('Origin')
          )
          .build()
      );

      const absoluteChild = layout.children?.[0];
      expect(absoluteChild?.x).toBe(0);
      expect(absoluteChild?.y).toBe(0);
    });
  });

  // ==================== Relative Positioning ====================

  describe('relative positioning', () => {
    it('stores relative offset in relativeOffset property', () => {
      const layout = layoutFromNode(
        stack()
          .add(
            stack()
              .relativePosition(30, 20)
              .text('Relative')
          )
          .build()
      );

      const relativeChild = layout.children?.[0];
      expect(relativeChild).toBeDefined();

      // Relative offset should be stored in relativeOffset
      expect(relativeChild?.relativeOffset?.x).toBe(30);
      expect(relativeChild?.relativeOffset?.y).toBe(20);
    });

    it('relative positioning does not affect sibling positions', () => {
      const layout = layoutFromNode(
        stack()
          .gap(10)
          .add(stack().text('First'))
          .add(
            stack()
              .relativePosition(0, 100)
              .text('Shifted')
          )
          .add(stack().text('Third'))
          .build()
      );

      const children = layout.children ?? [];
      expect(children.length).toBe(3);

      // Third item should be positioned based on Second's original position,
      // not its visually shifted position
      const firstHeight = children[0].height;
      const secondHeight = children[1].height;

      // Third's Y should be: First height + gap + Second height + gap
      expect(children[2].y).toBe(firstHeight + 10 + secondHeight + 10);
    });

    it('supports negative relative offsets', () => {
      const layout = layoutFromNode(
        stack()
          .add(stack().height(50).text('Spacer'))
          .add(
            stack()
              .relativePosition(0, -20)
              .text('Overlapping')
          )
          .build()
      );

      const relativeChild = layout.children?.[1];
      expect(relativeChild?.relativeOffset?.y).toBe(-20);
    });
  });

  // ==================== Auto Margin Centering ====================

  describe('auto margin centering', () => {
    it('centers element horizontally with margin auto', () => {
      const layout = layoutFromNode(
        stack()
          .width(1000)
          .add(
            stack()
              .width(200)
              .margin('auto')
              .text('Centered')
          )
          .build()
      );

      const centeredChild = layout.children?.[0];
      expect(centeredChild).toBeDefined();

      // Element should be centered: (1000 - 200) / 2 = 400
      expect(centeredChild?.x).toBeCloseTo(400, 0);
    });

    it('centers element with explicit left/right auto margins', () => {
      const layout = layoutFromNode(
        stack()
          .width(800)
          .add(
            stack()
              .width(200)
              .margin({ left: 'auto', right: 'auto' })
              .text('Centered')
          )
          .build()
      );

      const centeredChild = layout.children?.[0];
      // Element should be centered: (800 - 200) / 2 = 300
      expect(centeredChild?.x).toBeCloseTo(300, 0);
    });
  });

  // ==================== Combined Positioning ====================

  describe('combined positioning scenarios', () => {
    it('relative offset combined with margins', () => {
      const layout = layoutFromNode(
        stack()
          .add(
            stack()
              .relativePosition(20, 10)
              .margin(30)
              .text('Combined')
          )
          .build()
      );

      const child = layout.children?.[0];
      expect(child).toBeDefined();

      // Margin should affect layout position
      expect(child?.x).toBeGreaterThanOrEqual(30);
      expect(child?.y).toBeGreaterThanOrEqual(30);

      // Relative offset should be stored separately
      expect(child?.relativeOffset?.y).toBe(10);
      expect(child?.relativeOffset?.x).toBe(20);
    });

    it('multiple absolute elements can overlap', () => {
      const layout = layoutFromNode(
        stack()
          .width(500)
          .height(500)
          .add(
            stack()
              .absolutePosition(100, 100)
              .width(200)
              .height(200)
              .text('First')
          )
          .add(
            stack()
              .absolutePosition(150, 150)
              .width(200)
              .height(200)
              .text('Second (overlapping)')
          )
          .build()
      );

      const children = layout.children ?? [];
      expect(children.length).toBe(2);

      // Both should be at their specified positions (overlapping)
      expect(children[0].x).toBe(100);
      expect(children[0].y).toBe(100);
      expect(children[1].x).toBe(150);
      expect(children[1].y).toBe(150);
    });
  });
});
