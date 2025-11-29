/**
 * Yoga Layout Adapter Module
 *
 * This module provides an alternative layout engine using Facebook's Yoga
 * flexbox library for the escp-ts printer layout system.
 *
 * Yoga is a cross-platform layout engine implementing Flexbox, used by
 * React Native, Litho, and other Meta frameworks.
 *
 * @module layout/yoga
 */

// Main adapter and convenience functions
export {
  YogaAdapter,
  createYogaAdapter,
  calculateYogaLayout,
  initDefaultAdapter,
  getDefaultAdapter,
  resetDefaultAdapter,
  type YogaAdapterOptions,
  type YogaLayoutOptions,
} from './YogaAdapter';

// Type definitions
export type { YogaLayoutContext, NodeMapping, LayoutResult, LayoutContext } from './types';

// Result extraction
export {
  extractLayoutResult,
  calculateTotalHeight,
  calculateTotalWidth,
} from './YogaResultExtractor';

// Node building (for advanced usage)
export { buildYogaTree, freeYogaTree } from './YogaNodeBuilder';

// Property mapping (for advanced usage)
export {
  applyWidth,
  applyHeight,
  applyPadding,
  applyMargin,
  applyGap,
  applyJustify,
  applyAlignItems,
  applyFlexDirection,
  // NOTE: applyFlexWrap was removed - incompatible with printer pagination
  applyPosition,
  applyConstraints,
  applyFlexItem,
  mapJustify,
  mapAlignItems,
  mapHAlign,
} from './YogaPropertyMapper';

// Text measurement (for advanced usage)
export {
  createTextMeasureFunc,
  createLineMeasureFunc,
  measureText,
  getTextHeight,
  type MeasureSize,
} from './TextMeasurer';
