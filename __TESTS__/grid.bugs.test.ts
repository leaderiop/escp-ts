import { describe, it, expect } from 'vitest';
import { layoutNode, type LayoutContext } from '../src/layout/layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from '../src/layout/measure';
import { grid } from '../src/layout/builders';
import { DEFAULT_STYLE } from '../src/layout/nodes';

/**
 * Grid Bug Tests (TDD)
 */

describe('grid bugs', () => {
  const ctx: LayoutContext = {
    x: 0,
    y: 0,
    width: 1000,
    height: 500,
  };

  describe('grid fill columns', () => {
    // VERIFIED: Grid fill columns work correctly - equal widths
    it('grid with 5 fill columns should have equal widths', () => {
      const node = grid(['fill', 'fill', 'fill', 'fill', 'fill'])
        .cell('1').cell('2').cell('3').cell('4').cell('5').row()
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);

      // All column widths should be equal (200 each for 1000/5)
      const widths = measured.columnWidths!;
      expect(widths[0]).toBeCloseTo(widths[1], 0);
      expect(widths[1]).toBeCloseTo(widths[2], 0);
      expect(widths[2]).toBeCloseTo(widths[3], 0);
      expect(widths[3]).toBeCloseTo(widths[4], 0);
    });
  });
});
