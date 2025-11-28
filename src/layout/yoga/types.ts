/**
 * Type definitions for Yoga Layout Adapter
 *
 * These types define the internal structures used by the Yoga adapter
 * to map escp-ts layout nodes to Yoga nodes and extract results.
 */

import type { Node as YogaNode } from 'yoga-layout';
import type {
  LayoutNode,
  ResolvedStyle,
  ResolvedPadding,
  ResolvedMargin,
} from '../nodes';

// ==================== LAYOUT RESULT ====================

/**
 * Result of layout calculation for a node
 */
export interface LayoutResult {
  /** Original node reference */
  node: LayoutNode;
  /** Absolute X position in dots */
  x: number;
  /** Absolute Y position in dots */
  y: number;
  /** Final width in dots */
  width: number;
  /** Final height in dots */
  height: number;
  /** Layout results for children */
  children: LayoutResult[];
  /** Resolved style (copied from measured node) */
  style: ResolvedStyle;
  /** Relative offset to apply at render time (not used for pagination) */
  relativeOffset?: { x: number; y: number };
}

/**
 * Context passed during layout
 */
export interface LayoutContext {
  /** Starting X position */
  x: number;
  /** Starting Y position */
  y: number;
  /** Available width */
  width: number;
  /** Available height */
  height: number;
}

/**
 * Context for Yoga layout calculations
 * Contains all the information needed to measure and layout nodes
 */
export interface YogaLayoutContext {
  /** Available width for layout in dots */
  availableWidth: number;
  /** Available height for layout in dots */
  availableHeight: number;
  /** Line spacing in dots (default text height) */
  lineSpacing: number;
  /** Inter-character spacing in dots */
  interCharSpace: number;
  /** Current resolved style (inherited from parent) */
  style: ResolvedStyle;
}

/**
 * Mapping between an escp-ts layout node and its corresponding Yoga node
 * This is the internal structure used during layout calculation
 */
export interface NodeMapping {
  /** Original escp-ts layout node */
  node: LayoutNode;
  /** Corresponding Yoga node */
  yogaNode: YogaNode;
  /** Child mappings (for container nodes) */
  children: NodeMapping[];
  /** Resolved style for this node */
  resolvedStyle: ResolvedStyle;
  /** Resolved padding for this node */
  padding: ResolvedPadding;
  /** Resolved margin for this node */
  margin: ResolvedMargin;
  /** Explicit width if specified (for text nodes with explicit width) */
  explicitWidth?: number;
}

