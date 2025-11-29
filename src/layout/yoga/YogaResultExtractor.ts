/**
 * Yoga Result Extractor
 *
 * Extracts layout results from computed Yoga nodes and converts them
 * to the escp-ts LayoutResult format for use by pagination and rendering.
 */

import type { LayoutNodeBase } from '../nodes';
import type { NodeMapping, LayoutResult } from './types';

/**
 * Extract layout results from a computed Yoga tree
 *
 * After Yoga has calculated layout, this function walks the node mapping tree
 * and extracts the computed positions and sizes into LayoutResult format.
 *
 * @param mapping - The root node mapping with computed Yoga layout
 * @param offsetX - X offset from parent (for nested extraction)
 * @param offsetY - Y offset from parent (for nested extraction)
 * @returns LayoutResult tree compatible with pagination/render
 */
export function extractLayoutResult(
  mapping: NodeMapping,
  offsetX: number = 0,
  offsetY: number = 0
): LayoutResult {
  const yogaNode = mapping.yogaNode;

  // Get computed values from Yoga
  const computedLeft = yogaNode.getComputedLeft();
  const computedTop = yogaNode.getComputedTop();
  const computedWidth = yogaNode.getComputedWidth();
  const computedHeight = yogaNode.getComputedHeight();

  // Calculate absolute position
  const x = offsetX + computedLeft;
  const y = offsetY + computedTop;

  // Extract children results
  const children: LayoutResult[] = [];

  // Regular container: extract children recursively
  for (const childMapping of mapping.children) {
    const childResult = extractLayoutResult(childMapping, x, y);
    children.push(childResult);
  }

  // Build the result
  const result: LayoutResult = {
    node: mapping.node,
    x,
    y,
    width: computedWidth,
    height: computedHeight,
    children,
    style: mapping.resolvedStyle,
  };

  // Handle relative positioning offsets
  // Store for render-time application (not used for pagination)
  const nodeBase = mapping.node as LayoutNodeBase;
  if (nodeBase.position === 'relative') {
    result.relativeOffset = {
      x: nodeBase.offsetX ?? 0,
      y: nodeBase.offsetY ?? 0,
    };
  }

  // Pass through text clipping flag
  if (mapping.shouldClipText !== undefined) {
    result.isWidthConstrained = mapping.shouldClipText;
  }

  return result;
}

/**
 * Calculate total layout height from a LayoutResult tree
 *
 * Useful for checking if content fits within available height.
 *
 * @param result - The root layout result
 * @returns Total height including all descendants
 */
export function calculateTotalHeight(result: LayoutResult): number {
  let maxY = result.y + result.height;

  for (const child of result.children) {
    const childMaxY = calculateTotalHeight(child);
    maxY = Math.max(maxY, childMaxY);
  }

  return maxY;
}

/**
 * Calculate total layout width from a LayoutResult tree
 *
 * Useful for checking if content fits within available width.
 *
 * @param result - The root layout result
 * @returns Total width including all descendants
 */
export function calculateTotalWidth(result: LayoutResult): number {
  let maxX = result.x + result.width;

  for (const child of result.children) {
    const childMaxX = calculateTotalWidth(child);
    maxX = Math.max(maxX, childMaxX);
  }

  return maxX;
}
