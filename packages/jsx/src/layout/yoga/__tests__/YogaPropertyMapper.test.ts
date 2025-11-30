/**
 * Tests for YogaPropertyMapper
 *
 * Comprehensive tests covering all property mapping functions that translate
 * escp-ts layout properties to Yoga node properties.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyWidth,
  applyHeight,
  applyPadding,
  applyMargin,
  applyGap,
  mapJustify,
  applyJustify,
  mapAlignItems,
  applyAlignItems,
  mapHAlign,
  applyFlexDirection,
  applyPosition,
  applyConstraints,
  applyFlexItem,
} from '../YogaPropertyMapper';
import { Edge, FlexDirection, Justify, Align, PositionType, Gutter } from 'yoga-layout/load';
import type { Node as YogaNode } from 'yoga-layout/load';
import type { LayoutNodeBase } from '../../nodes';

/**
 * Creates a mock YogaNode that tracks all method calls
 */
function createMockYogaNode(): YogaNode & {
  _calls: Record<string, unknown[][]>;
} {
  const calls: Record<string, unknown[][]> = {};

  const trackCall = (method: string) => {
    return (...args: unknown[]) => {
      if (!calls[method]) {
        calls[method] = [];
      }
      calls[method].push(args);
    };
  };

  return {
    _calls: calls,
    // Width methods
    setWidth: trackCall('setWidth'),
    setWidthAuto: trackCall('setWidthAuto'),
    setWidthPercent: trackCall('setWidthPercent'),
    // Height methods
    setHeight: trackCall('setHeight'),
    setHeightAuto: trackCall('setHeightAuto'),
    setHeightPercent: trackCall('setHeightPercent'),
    // Padding methods
    setPadding: trackCall('setPadding'),
    // Margin methods
    setMargin: trackCall('setMargin'),
    setMarginAuto: trackCall('setMarginAuto'),
    // Gap methods
    setGap: trackCall('setGap'),
    // Justify and alignment
    setJustifyContent: trackCall('setJustifyContent'),
    setAlignItems: trackCall('setAlignItems'),
    // Flex direction
    setFlexDirection: trackCall('setFlexDirection'),
    // Position
    setPositionType: trackCall('setPositionType'),
    setPosition: trackCall('setPosition'),
    // Constraints
    setMinWidth: trackCall('setMinWidth'),
    setMaxWidth: trackCall('setMaxWidth'),
    setMinHeight: trackCall('setMinHeight'),
    setMaxHeight: trackCall('setMaxHeight'),
    // Flex item properties
    setFlexGrow: trackCall('setFlexGrow'),
    setFlexShrink: trackCall('setFlexShrink'),
    setFlexBasis: trackCall('setFlexBasis'),
  } as unknown as YogaNode & { _calls: Record<string, unknown[][]> };
}

describe('YogaPropertyMapper', () => {
  let mockNode: ReturnType<typeof createMockYogaNode>;

  beforeEach(() => {
    mockNode = createMockYogaNode();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyWidth', () => {
    describe('when width is undefined', () => {
      it('should set width to auto', () => {
        applyWidth(mockNode, undefined, 500);

        expect(mockNode._calls['setWidthAuto']).toHaveLength(1);
        expect(mockNode._calls['setWidth']).toBeUndefined();
        expect(mockNode._calls['setWidthPercent']).toBeUndefined();
      });
    });

    describe('when width is "auto"', () => {
      it('should set width to auto', () => {
        applyWidth(mockNode, 'auto', 500);

        expect(mockNode._calls['setWidthAuto']).toHaveLength(1);
      });
    });

    describe('when width is "fill"', () => {
      it('should set width to 100 percent', () => {
        applyWidth(mockNode, 'fill', 500);

        expect(mockNode._calls['setWidthPercent']).toHaveLength(1);
        expect(mockNode._calls['setWidthPercent'][0]).toEqual([100]);
      });
    });

    describe('when width is a percentage string', () => {
      it('should set width percent for "50%"', () => {
        applyWidth(mockNode, '50%', 500);

        expect(mockNode._calls['setWidthPercent']).toHaveLength(1);
        expect(mockNode._calls['setWidthPercent'][0]).toEqual([50]);
      });

      it('should set width percent for "25%"', () => {
        applyWidth(mockNode, '25%', 500);

        expect(mockNode._calls['setWidthPercent']).toHaveLength(1);
        expect(mockNode._calls['setWidthPercent'][0]).toEqual([25]);
      });

      it('should set width percent for "100%"', () => {
        applyWidth(mockNode, '100%', 500);

        expect(mockNode._calls['setWidthPercent']).toHaveLength(1);
        expect(mockNode._calls['setWidthPercent'][0]).toEqual([100]);
      });

      it('should handle decimal percentages like "33.5%"', () => {
        applyWidth(mockNode, '33.5%', 500);

        expect(mockNode._calls['setWidthPercent']).toHaveLength(1);
        expect(mockNode._calls['setWidthPercent'][0]).toEqual([33.5]);
      });
    });

    describe('when width is a fixed number', () => {
      it('should set width to the fixed value', () => {
        applyWidth(mockNode, 200, 500);

        expect(mockNode._calls['setWidth']).toHaveLength(1);
        expect(mockNode._calls['setWidth'][0]).toEqual([200]);
      });

      it('should handle zero width', () => {
        applyWidth(mockNode, 0, 500);

        expect(mockNode._calls['setWidth']).toHaveLength(1);
        expect(mockNode._calls['setWidth'][0]).toEqual([0]);
      });

      it('should handle large width values', () => {
        applyWidth(mockNode, 2880, 500);

        expect(mockNode._calls['setWidth']).toHaveLength(1);
        expect(mockNode._calls['setWidth'][0]).toEqual([2880]);
      });
    });
  });

  describe('applyHeight', () => {
    describe('when height is undefined', () => {
      it('should set height to auto', () => {
        applyHeight(mockNode, undefined);

        expect(mockNode._calls['setHeightAuto']).toHaveLength(1);
        expect(mockNode._calls['setHeight']).toBeUndefined();
        expect(mockNode._calls['setHeightPercent']).toBeUndefined();
      });
    });

    describe('when height is "auto"', () => {
      it('should set height to auto', () => {
        applyHeight(mockNode, 'auto');

        expect(mockNode._calls['setHeightAuto']).toHaveLength(1);
      });
    });

    describe('when height is a percentage string', () => {
      it('should set height percent for "50%"', () => {
        applyHeight(mockNode, '50%');

        expect(mockNode._calls['setHeightPercent']).toHaveLength(1);
        expect(mockNode._calls['setHeightPercent'][0]).toEqual([50]);
      });

      it('should set height percent for "75%"', () => {
        applyHeight(mockNode, '75%');

        expect(mockNode._calls['setHeightPercent']).toHaveLength(1);
        expect(mockNode._calls['setHeightPercent'][0]).toEqual([75]);
      });
    });

    describe('when height is a fixed number', () => {
      it('should set height to the fixed value', () => {
        applyHeight(mockNode, 100);

        expect(mockNode._calls['setHeight']).toHaveLength(1);
        expect(mockNode._calls['setHeight'][0]).toEqual([100]);
      });

      it('should handle zero height', () => {
        applyHeight(mockNode, 0);

        expect(mockNode._calls['setHeight']).toHaveLength(1);
        expect(mockNode._calls['setHeight'][0]).toEqual([0]);
      });
    });
  });

  describe('applyPadding', () => {
    describe('when padding is undefined', () => {
      it('should return resolved padding with all zeros', () => {
        const result = applyPadding(mockNode, undefined);

        expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
        expect(mockNode._calls['setPadding']).toBeUndefined();
      });
    });

    describe('when padding is a number', () => {
      it('should apply same padding to all sides', () => {
        const result = applyPadding(mockNode, 10);

        expect(result).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
        expect(mockNode._calls['setPadding']).toHaveLength(4);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Top, 10]);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Right, 10]);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Bottom, 10]);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Left, 10]);
      });

      it('should not apply padding when value is zero', () => {
        const result = applyPadding(mockNode, 0);

        expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
        expect(mockNode._calls['setPadding']).toBeUndefined();
      });
    });

    describe('when padding is an object with all sides', () => {
      it('should apply each side independently', () => {
        const result = applyPadding(mockNode, {
          top: 5,
          right: 10,
          bottom: 15,
          left: 20,
        });

        expect(result).toEqual({ top: 5, right: 10, bottom: 15, left: 20 });
        expect(mockNode._calls['setPadding']).toHaveLength(4);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Top, 5]);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Right, 10]);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Bottom, 15]);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Left, 20]);
      });
    });

    describe('when padding is an object with partial sides', () => {
      it('should apply only specified sides and default others to zero', () => {
        const result = applyPadding(mockNode, { top: 10, left: 5 });

        expect(result).toEqual({ top: 10, right: 0, bottom: 0, left: 5 });
        expect(mockNode._calls['setPadding']).toHaveLength(2);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Top, 10]);
        expect(mockNode._calls['setPadding']).toContainEqual([Edge.Left, 5]);
      });

      it('should skip sides with zero value', () => {
        const result = applyPadding(mockNode, { top: 10, right: 0 });

        expect(result).toEqual({ top: 10, right: 0, bottom: 0, left: 0 });
        expect(mockNode._calls['setPadding']).toHaveLength(1);
        expect(mockNode._calls['setPadding'][0]).toEqual([Edge.Top, 10]);
      });
    });
  });

  describe('applyMargin', () => {
    describe('when margin is undefined', () => {
      it('should return resolved margin with all zeros', () => {
        const result = applyMargin(mockNode, undefined);

        expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
        expect(mockNode._calls['setMargin']).toBeUndefined();
        expect(mockNode._calls['setMarginAuto']).toBeUndefined();
      });
    });

    describe('when margin is a number', () => {
      it('should apply same margin to all sides', () => {
        const result = applyMargin(mockNode, 10);

        expect(result).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
        expect(mockNode._calls['setMargin']).toHaveLength(4);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Top, 10]);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Right, 10]);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Bottom, 10]);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Left, 10]);
      });

      it('should not apply margin when value is zero', () => {
        const result = applyMargin(mockNode, 0);

        expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
        expect(mockNode._calls['setMargin']).toBeUndefined();
      });
    });

    describe('when margin is "auto"', () => {
      it('should set auto margin on both horizontal sides for centering', () => {
        const result = applyMargin(mockNode, 'auto');

        expect(result.autoLeft).toBe(true);
        expect(result.autoRight).toBe(true);
        expect(result.autoHorizontal).toBe(true);
        expect(result.top).toBe(0);
        expect(result.bottom).toBe(0);
        expect(mockNode._calls['setMarginAuto']).toHaveLength(2);
        expect(mockNode._calls['setMarginAuto']).toContainEqual([Edge.Left]);
        expect(mockNode._calls['setMarginAuto']).toContainEqual([Edge.Right]);
      });
    });

    describe('when margin has single auto side', () => {
      it('should set auto margin on left only to push element right', () => {
        const result = applyMargin(mockNode, { left: 'auto' });

        expect(result.autoLeft).toBe(true);
        expect(result.autoRight).toBeUndefined();
        expect(result.autoHorizontal).toBeUndefined();
        expect(mockNode._calls['setMarginAuto']).toHaveLength(1);
        expect(mockNode._calls['setMarginAuto'][0]).toEqual([Edge.Left]);
      });

      it('should set auto margin on right only to push element left', () => {
        const result = applyMargin(mockNode, { right: 'auto' });

        expect(result.autoRight).toBe(true);
        expect(result.autoLeft).toBeUndefined();
        expect(mockNode._calls['setMarginAuto']).toHaveLength(1);
        expect(mockNode._calls['setMarginAuto'][0]).toEqual([Edge.Right]);
      });
    });

    describe('when margin has both auto sides', () => {
      it('should set auto on both horizontal sides for centering', () => {
        const result = applyMargin(mockNode, { left: 'auto', right: 'auto' });

        expect(result.autoLeft).toBe(true);
        expect(result.autoRight).toBe(true);
        expect(result.autoHorizontal).toBe(true);
        expect(mockNode._calls['setMarginAuto']).toHaveLength(2);
        expect(mockNode._calls['setMarginAuto']).toContainEqual([Edge.Left]);
        expect(mockNode._calls['setMarginAuto']).toContainEqual([Edge.Right]);
      });
    });

    describe('when margin has mixed values', () => {
      it('should handle mix of numeric and auto values', () => {
        const result = applyMargin(mockNode, {
          top: 10,
          right: 'auto',
          bottom: 5,
          left: 20,
        });

        expect(result.top).toBe(10);
        expect(result.right).toBe(0);
        expect(result.bottom).toBe(5);
        expect(result.left).toBe(20);
        expect(result.autoRight).toBe(true);

        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Top, 10]);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Bottom, 5]);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Left, 20]);
        expect(mockNode._calls['setMarginAuto']).toContainEqual([Edge.Right]);
      });

      it('should handle object with only vertical margins', () => {
        const result = applyMargin(mockNode, { top: 15, bottom: 25 });

        expect(result).toEqual({ top: 15, right: 0, bottom: 25, left: 0 });
        expect(mockNode._calls['setMargin']).toHaveLength(2);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Top, 15]);
        expect(mockNode._calls['setMargin']).toContainEqual([Edge.Bottom, 25]);
      });
    });
  });

  describe('applyGap', () => {
    describe('when gap is undefined', () => {
      it('should not set any gap', () => {
        applyGap(mockNode, undefined);

        expect(mockNode._calls['setGap']).toBeUndefined();
      });
    });

    describe('when gap is zero', () => {
      it('should not set any gap', () => {
        applyGap(mockNode, 0);

        expect(mockNode._calls['setGap']).toBeUndefined();
      });
    });

    describe('when direction is "column"', () => {
      it('should set column gap', () => {
        applyGap(mockNode, 10, 'column');

        expect(mockNode._calls['setGap']).toHaveLength(1);
        expect(mockNode._calls['setGap'][0]).toEqual([Gutter.Column, 10]);
      });
    });

    describe('when direction is "row"', () => {
      it('should set row gap', () => {
        applyGap(mockNode, 15, 'row');

        expect(mockNode._calls['setGap']).toHaveLength(1);
        expect(mockNode._calls['setGap'][0]).toEqual([Gutter.Row, 15]);
      });
    });

    describe('when direction is "all"', () => {
      it('should set gap for all directions', () => {
        applyGap(mockNode, 20, 'all');

        expect(mockNode._calls['setGap']).toHaveLength(1);
        expect(mockNode._calls['setGap'][0]).toEqual([Gutter.All, 20]);
      });
    });

    describe('when direction is not specified', () => {
      it('should default to "all" direction', () => {
        applyGap(mockNode, 25);

        expect(mockNode._calls['setGap']).toHaveLength(1);
        expect(mockNode._calls['setGap'][0]).toEqual([Gutter.All, 25]);
      });
    });
  });

  describe('mapJustify', () => {
    describe('when mapping all JustifyContent values', () => {
      it('should map "start" to Justify.FlexStart', () => {
        expect(mapJustify('start')).toBe(Justify.FlexStart);
      });

      it('should map "center" to Justify.Center', () => {
        expect(mapJustify('center')).toBe(Justify.Center);
      });

      it('should map "end" to Justify.FlexEnd', () => {
        expect(mapJustify('end')).toBe(Justify.FlexEnd);
      });

      it('should map "space-between" to Justify.SpaceBetween', () => {
        expect(mapJustify('space-between')).toBe(Justify.SpaceBetween);
      });

      it('should map "space-around" to Justify.SpaceAround', () => {
        expect(mapJustify('space-around')).toBe(Justify.SpaceAround);
      });

      it('should map "space-evenly" to Justify.SpaceEvenly', () => {
        expect(mapJustify('space-evenly')).toBe(Justify.SpaceEvenly);
      });
    });

    describe('when justify is undefined', () => {
      it('should default to Justify.FlexStart', () => {
        expect(mapJustify(undefined)).toBe(Justify.FlexStart);
      });
    });
  });

  describe('applyJustify', () => {
    it('should call setJustifyContent with mapped value', () => {
      applyJustify(mockNode, 'center');

      expect(mockNode._calls['setJustifyContent']).toHaveLength(1);
      expect(mockNode._calls['setJustifyContent'][0]).toEqual([Justify.Center]);
    });

    it('should use default when justify is undefined', () => {
      applyJustify(mockNode, undefined);

      expect(mockNode._calls['setJustifyContent']).toHaveLength(1);
      expect(mockNode._calls['setJustifyContent'][0]).toEqual([Justify.FlexStart]);
    });

    it('should apply space-between correctly', () => {
      applyJustify(mockNode, 'space-between');

      expect(mockNode._calls['setJustifyContent'][0]).toEqual([Justify.SpaceBetween]);
    });
  });

  describe('mapAlignItems', () => {
    describe('when mapping all VAlign values', () => {
      it('should map "top" to Align.FlexStart', () => {
        expect(mapAlignItems('top')).toBe(Align.FlexStart);
      });

      it('should map "center" to Align.Center', () => {
        expect(mapAlignItems('center')).toBe(Align.Center);
      });

      it('should map "bottom" to Align.FlexEnd', () => {
        expect(mapAlignItems('bottom')).toBe(Align.FlexEnd);
      });
    });

    describe('when align is undefined', () => {
      it('should default to Align.FlexStart', () => {
        expect(mapAlignItems(undefined)).toBe(Align.FlexStart);
      });
    });
  });

  describe('applyAlignItems', () => {
    it('should call setAlignItems with mapped value', () => {
      applyAlignItems(mockNode, 'center');

      expect(mockNode._calls['setAlignItems']).toHaveLength(1);
      expect(mockNode._calls['setAlignItems'][0]).toEqual([Align.Center]);
    });

    it('should use default when alignItems is undefined', () => {
      applyAlignItems(mockNode, undefined);

      expect(mockNode._calls['setAlignItems']).toHaveLength(1);
      expect(mockNode._calls['setAlignItems'][0]).toEqual([Align.FlexStart]);
    });

    it('should apply bottom alignment correctly', () => {
      applyAlignItems(mockNode, 'bottom');

      expect(mockNode._calls['setAlignItems'][0]).toEqual([Align.FlexEnd]);
    });
  });

  describe('mapHAlign', () => {
    describe('when mapping all HAlign values', () => {
      it('should map "left" to Align.FlexStart', () => {
        expect(mapHAlign('left')).toBe(Align.FlexStart);
      });

      it('should map "center" to Align.Center', () => {
        expect(mapHAlign('center')).toBe(Align.Center);
      });

      it('should map "right" to Align.FlexEnd', () => {
        expect(mapHAlign('right')).toBe(Align.FlexEnd);
      });
    });

    describe('when align is undefined', () => {
      it('should default to Align.FlexStart', () => {
        expect(mapHAlign(undefined)).toBe(Align.FlexStart);
      });
    });
  });

  describe('applyFlexDirection', () => {
    describe('when direction is "column"', () => {
      it('should set flex direction to Column', () => {
        applyFlexDirection(mockNode, 'column');

        expect(mockNode._calls['setFlexDirection']).toHaveLength(1);
        expect(mockNode._calls['setFlexDirection'][0]).toEqual([FlexDirection.Column]);
      });
    });

    describe('when direction is "row"', () => {
      it('should set flex direction to Row', () => {
        applyFlexDirection(mockNode, 'row');

        expect(mockNode._calls['setFlexDirection']).toHaveLength(1);
        expect(mockNode._calls['setFlexDirection'][0]).toEqual([FlexDirection.Row]);
      });
    });

    describe('when direction is undefined', () => {
      it('should default to Column', () => {
        applyFlexDirection(mockNode, undefined);

        expect(mockNode._calls['setFlexDirection']).toHaveLength(1);
        expect(mockNode._calls['setFlexDirection'][0]).toEqual([FlexDirection.Column]);
      });
    });
  });

  describe('applyPosition', () => {
    describe('when position is "static"', () => {
      it('should set position type to Static', () => {
        const node: LayoutNodeBase = { position: 'static' };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPositionType']).toHaveLength(1);
        expect(mockNode._calls['setPositionType'][0]).toEqual([PositionType.Static]);
        expect(mockNode._calls['setPosition']).toBeUndefined();
      });
    });

    describe('when position is undefined', () => {
      it('should set position type to Static (default)', () => {
        const node: LayoutNodeBase = {};
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPositionType']).toHaveLength(1);
        expect(mockNode._calls['setPositionType'][0]).toEqual([PositionType.Static]);
      });
    });

    describe('when position is "relative"', () => {
      it('should set position type to Relative', () => {
        const node: LayoutNodeBase = { position: 'relative' };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPositionType']).toHaveLength(1);
        expect(mockNode._calls['setPositionType'][0]).toEqual([PositionType.Relative]);
      });

      it('should not set position offsets in Yoga for relative positioning', () => {
        // Relative offsets are handled at render time, not in Yoga
        const node: LayoutNodeBase = {
          position: 'relative',
          offsetX: 10,
          offsetY: 20,
        };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPositionType'][0]).toEqual([PositionType.Relative]);
        expect(mockNode._calls['setPosition']).toBeUndefined();
      });
    });

    describe('when position is "absolute"', () => {
      it('should set position type to Absolute', () => {
        const node: LayoutNodeBase = { position: 'absolute' };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPositionType']).toHaveLength(1);
        expect(mockNode._calls['setPositionType'][0]).toEqual([PositionType.Absolute]);
      });

      it('should set posX as left position', () => {
        const node: LayoutNodeBase = {
          position: 'absolute',
          posX: 50,
        };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPosition']).toHaveLength(1);
        expect(mockNode._calls['setPosition'][0]).toEqual([Edge.Left, 50]);
      });

      it('should set posY as top position', () => {
        const node: LayoutNodeBase = {
          position: 'absolute',
          posY: 100,
        };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPosition']).toHaveLength(1);
        expect(mockNode._calls['setPosition'][0]).toEqual([Edge.Top, 100]);
      });

      it('should set both posX and posY', () => {
        const node: LayoutNodeBase = {
          position: 'absolute',
          posX: 30,
          posY: 60,
        };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPosition']).toHaveLength(2);
        expect(mockNode._calls['setPosition']).toContainEqual([Edge.Left, 30]);
        expect(mockNode._calls['setPosition']).toContainEqual([Edge.Top, 60]);
      });

      it('should handle zero posX and posY', () => {
        const node: LayoutNodeBase = {
          position: 'absolute',
          posX: 0,
          posY: 0,
        };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPosition']).toHaveLength(2);
        expect(mockNode._calls['setPosition']).toContainEqual([Edge.Left, 0]);
        expect(mockNode._calls['setPosition']).toContainEqual([Edge.Top, 0]);
      });

      it('should not set position when posX and posY are undefined', () => {
        const node: LayoutNodeBase = { position: 'absolute' };
        applyPosition(mockNode, node);

        expect(mockNode._calls['setPositionType'][0]).toEqual([PositionType.Absolute]);
        expect(mockNode._calls['setPosition']).toBeUndefined();
      });
    });
  });

  describe('applyConstraints', () => {
    describe('when minWidth is set', () => {
      it('should set min width on the yoga node', () => {
        const node: LayoutNodeBase = { minWidth: 100 };
        applyConstraints(mockNode, node);

        expect(mockNode._calls['setMinWidth']).toHaveLength(1);
        expect(mockNode._calls['setMinWidth'][0]).toEqual([100]);
      });
    });

    describe('when maxWidth is set', () => {
      it('should set max width on the yoga node', () => {
        const node: LayoutNodeBase = { maxWidth: 500 };
        applyConstraints(mockNode, node);

        expect(mockNode._calls['setMaxWidth']).toHaveLength(1);
        expect(mockNode._calls['setMaxWidth'][0]).toEqual([500]);
      });
    });

    describe('when minHeight is set', () => {
      it('should set min height on the yoga node', () => {
        const node: LayoutNodeBase = { minHeight: 50 };
        applyConstraints(mockNode, node);

        expect(mockNode._calls['setMinHeight']).toHaveLength(1);
        expect(mockNode._calls['setMinHeight'][0]).toEqual([50]);
      });
    });

    describe('when maxHeight is set', () => {
      it('should set max height on the yoga node', () => {
        const node: LayoutNodeBase = { maxHeight: 300 };
        applyConstraints(mockNode, node);

        expect(mockNode._calls['setMaxHeight']).toHaveLength(1);
        expect(mockNode._calls['setMaxHeight'][0]).toEqual([300]);
      });
    });

    describe('when all constraints are set', () => {
      it('should set all constraint properties', () => {
        const node: LayoutNodeBase = {
          minWidth: 100,
          maxWidth: 500,
          minHeight: 50,
          maxHeight: 300,
        };
        applyConstraints(mockNode, node);

        expect(mockNode._calls['setMinWidth'][0]).toEqual([100]);
        expect(mockNode._calls['setMaxWidth'][0]).toEqual([500]);
        expect(mockNode._calls['setMinHeight'][0]).toEqual([50]);
        expect(mockNode._calls['setMaxHeight'][0]).toEqual([300]);
      });
    });

    describe('when no constraints are set', () => {
      it('should not call any constraint methods', () => {
        const node: LayoutNodeBase = {};
        applyConstraints(mockNode, node);

        expect(mockNode._calls['setMinWidth']).toBeUndefined();
        expect(mockNode._calls['setMaxWidth']).toBeUndefined();
        expect(mockNode._calls['setMinHeight']).toBeUndefined();
        expect(mockNode._calls['setMaxHeight']).toBeUndefined();
      });
    });

    describe('when constraints have zero values', () => {
      it('should set zero constraints', () => {
        // Zero is a valid constraint value
        const node: LayoutNodeBase = { minWidth: 0, minHeight: 0 };
        applyConstraints(mockNode, node);

        expect(mockNode._calls['setMinWidth'][0]).toEqual([0]);
        expect(mockNode._calls['setMinHeight'][0]).toEqual([0]);
      });
    });
  });

  describe('applyFlexItem', () => {
    describe('when flex is true', () => {
      it('should set flex grow to 1', () => {
        applyFlexItem(mockNode, true);

        expect(mockNode._calls['setFlexGrow']).toHaveLength(1);
        expect(mockNode._calls['setFlexGrow'][0]).toEqual([1]);
      });

      it('should set flex shrink to 1', () => {
        applyFlexItem(mockNode, true);

        expect(mockNode._calls['setFlexShrink']).toHaveLength(1);
        expect(mockNode._calls['setFlexShrink'][0]).toEqual([1]);
      });

      it('should set flex basis to 0', () => {
        applyFlexItem(mockNode, true);

        expect(mockNode._calls['setFlexBasis']).toHaveLength(1);
        expect(mockNode._calls['setFlexBasis'][0]).toEqual([0]);
      });
    });

    describe('when flex is false', () => {
      it('should not set any flex properties', () => {
        applyFlexItem(mockNode, false);

        expect(mockNode._calls['setFlexGrow']).toBeUndefined();
        expect(mockNode._calls['setFlexShrink']).toBeUndefined();
        expect(mockNode._calls['setFlexBasis']).toBeUndefined();
      });
    });

    describe('when flex is undefined', () => {
      it('should not set any flex properties', () => {
        applyFlexItem(mockNode, undefined);

        expect(mockNode._calls['setFlexGrow']).toBeUndefined();
        expect(mockNode._calls['setFlexShrink']).toBeUndefined();
        expect(mockNode._calls['setFlexBasis']).toBeUndefined();
      });
    });
  });
});
