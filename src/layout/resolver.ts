/**
 * Node Resolver for ESC/P2 Layout System
 *
 * Transforms dynamic nodes (TemplateNode, ConditionalNode, SwitchNode, EachNode)
 * into static nodes before measurement. This is called at the start of the
 * layout pipeline when a data context is available.
 */

import type {
  LayoutNode,
  TextNode,
  StackNode,
  FlexNode,
  GridNode,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
  DataContext,
  SpaceContext,
} from './nodes';
import {
  isTemplateNode,
  isConditionalNode,
  isSwitchNode,
  isEachNode,
  isStackNode,
  isFlexNode,
  isGridNode,
  isTextNode,
} from './nodes';
import { interpolate, resolvePath, defaultFilters, type FilterRegistry } from './interpolation';
import { evaluateCondition, matchesCaseValue } from './conditionals';

// ==================== RESOLVER OPTIONS ====================

/**
 * Options for the node resolver
 */
export interface ResolverOptions {
  /** Filter registry for template interpolation */
  filters?: FilterRegistry;
}

// ==================== TEMPLATE NODE RESOLUTION ====================

/**
 * Resolve a TemplateNode to a TextNode by interpolating the template
 */
function resolveTemplateNode(
  node: TemplateNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): TextNode {
  const filters = options.filters ?? defaultFilters;

  // Merge local data with context data
  const data = node.data
    ? { ...(ctx.data as Record<string, unknown>), ...node.data }
    : (ctx.data as Record<string, unknown>);

  // Interpolate the template
  const content = interpolate(node.template, data, filters);

  // Create TextNode with resolved content
  // Use conditional spread to avoid undefined values (for exactOptionalPropertyTypes)
  const textNode: TextNode = {
    type: 'text',
    content,
    ...(node.align !== undefined && { align: node.align }),
    // Copy style properties from template node
    ...(node.bold !== undefined && { bold: node.bold }),
    ...(node.italic !== undefined && { italic: node.italic }),
    ...(node.underline !== undefined && { underline: node.underline }),
    ...(node.doubleStrike !== undefined && { doubleStrike: node.doubleStrike }),
    ...(node.doubleWidth !== undefined && { doubleWidth: node.doubleWidth }),
    ...(node.doubleHeight !== undefined && { doubleHeight: node.doubleHeight }),
    ...(node.condensed !== undefined && { condensed: node.condensed }),
    ...(node.cpi !== undefined && { cpi: node.cpi }),
    // Copy layout properties
    ...(node.width !== undefined && { width: node.width }),
    ...(node.height !== undefined && { height: node.height }),
    ...(node.padding !== undefined && { padding: node.padding }),
    ...(node.margin !== undefined && { margin: node.margin }),
    ...(node.minWidth !== undefined && { minWidth: node.minWidth }),
    ...(node.maxWidth !== undefined && { maxWidth: node.maxWidth }),
    ...(node.minHeight !== undefined && { minHeight: node.minHeight }),
    ...(node.maxHeight !== undefined && { maxHeight: node.maxHeight }),
    // Copy positioning
    ...(node.position !== undefined && { position: node.position }),
    ...(node.posX !== undefined && { posX: node.posX }),
    ...(node.posY !== undefined && { posY: node.posY }),
    ...(node.offsetX !== undefined && { offsetX: node.offsetX }),
    ...(node.offsetY !== undefined && { offsetY: node.offsetY }),
  };

  return textNode;
}

// ==================== CONDITIONAL NODE RESOLUTION ====================

/**
 * Resolve a ConditionalNode by evaluating conditions and returning the matching branch
 * Returns null if no conditions match and no else clause exists
 */
function resolveConditionalNode(
  node: ConditionalNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): LayoutNode | null {
  // Check primary condition
  if (evaluateCondition(node.condition, ctx)) {
    return resolveNode(node.then, ctx, options);
  }

  // Check else-if chains
  if (node.elseIf) {
    for (const branch of node.elseIf) {
      if (evaluateCondition(branch.condition, ctx)) {
        return resolveNode(branch.then, ctx, options);
      }
    }
  }

  // Check else clause
  if (node.else) {
    return resolveNode(node.else, ctx, options);
  }

  // No match and no else - return null (will be filtered out)
  return null;
}

// ==================== SWITCH NODE RESOLUTION ====================

/**
 * Resolve a SwitchNode by finding the matching case
 * Returns null if no cases match and no default exists
 */
function resolveSwitchNode(
  node: SwitchNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): LayoutNode | null {
  // Get the value to switch on
  const value = resolvePath(ctx.data as Record<string, unknown>, node.path);

  // Find matching case
  for (const caseItem of node.cases) {
    if (matchesCaseValue(value, caseItem.value)) {
      return resolveNode(caseItem.then, ctx, options);
    }
  }

  // No match - try default
  if (node.default) {
    return resolveNode(node.default, ctx, options);
  }

  // No match and no default - return null
  return null;
}

// ==================== EACH NODE RESOLUTION ====================

/**
 * Resolve an EachNode by iterating over the array and creating nodes for each item
 * Returns a StackNode containing all rendered items
 */
function resolveEachNode(
  node: EachNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): LayoutNode {
  // Get the items array
  const items = resolvePath(ctx.data as Record<string, unknown>, node.items);

  // If not an array or empty, return empty node
  if (!Array.isArray(items) || items.length === 0) {
    if (node.empty) {
      return resolveNode(node.empty, ctx, options) ?? createEmptyNode();
    }
    return createEmptyNode();
  }

  const itemName = node.as ?? 'item';
  const indexName = node.indexAs ?? 'index';
  const total = items.length;

  // Render each item
  const children: LayoutNode[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Create scoped context with item and index
    const scopedCtx: DataContext = {
      ...ctx,
      data: {
        ...(ctx.data as Record<string, unknown>),
        [itemName]: item,
        [indexName]: i,
      },
      index: i,
      total,
    };

    // Resolve the render template
    const resolved = resolveNode(node.render, scopedCtx, options);
    if (resolved) {
      children.push(resolved);
    }

    // Add separator if not last item
    if (node.separator && i < items.length - 1) {
      const separator = resolveNode(node.separator, scopedCtx, options);
      if (separator) {
        children.push(separator);
      }
    }
  }

  // Create a stack containing all children
  // Use conditional spread to avoid undefined values (for exactOptionalPropertyTypes)
  const stackNode: StackNode = {
    type: 'stack',
    direction: 'column',
    children,
    // Copy style properties from each node
    ...(node.bold !== undefined && { bold: node.bold }),
    ...(node.italic !== undefined && { italic: node.italic }),
    ...(node.underline !== undefined && { underline: node.underline }),
    ...(node.doubleStrike !== undefined && { doubleStrike: node.doubleStrike }),
    ...(node.doubleWidth !== undefined && { doubleWidth: node.doubleWidth }),
    ...(node.doubleHeight !== undefined && { doubleHeight: node.doubleHeight }),
    ...(node.condensed !== undefined && { condensed: node.condensed }),
    ...(node.cpi !== undefined && { cpi: node.cpi }),
    // Copy layout properties
    ...(node.width !== undefined && { width: node.width }),
    ...(node.height !== undefined && { height: node.height }),
    ...(node.padding !== undefined && { padding: node.padding }),
    ...(node.margin !== undefined && { margin: node.margin }),
    ...(node.minWidth !== undefined && { minWidth: node.minWidth }),
    ...(node.maxWidth !== undefined && { maxWidth: node.maxWidth }),
    ...(node.minHeight !== undefined && { minHeight: node.minHeight }),
    ...(node.maxHeight !== undefined && { maxHeight: node.maxHeight }),
    // Copy pagination hints
    ...(node.breakBefore !== undefined && { breakBefore: node.breakBefore }),
    ...(node.breakAfter !== undefined && { breakAfter: node.breakAfter }),
    ...(node.keepTogether !== undefined && { keepTogether: node.keepTogether }),
    ...(node.minBeforeBreak !== undefined && { minBeforeBreak: node.minBeforeBreak }),
    ...(node.minAfterBreak !== undefined && { minAfterBreak: node.minAfterBreak }),
  };

  return stackNode;
}

// ==================== CONTAINER NODE RESOLUTION ====================

/**
 * Resolve children of a StackNode
 */
function resolveStackNode(
  node: StackNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): StackNode {
  const resolvedChildren: LayoutNode[] = [];

  for (const child of node.children) {
    const resolved = resolveNode(child, ctx, options);
    if (resolved) {
      resolvedChildren.push(resolved);
    }
  }

  return {
    ...node,
    children: resolvedChildren,
  };
}

/**
 * Resolve children of a FlexNode
 */
function resolveFlexNode(
  node: FlexNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): FlexNode {
  const resolvedChildren: LayoutNode[] = [];

  for (const child of node.children) {
    const resolved = resolveNode(child, ctx, options);
    if (resolved) {
      resolvedChildren.push(resolved);
    }
  }

  return {
    ...node,
    children: resolvedChildren,
  };
}

/**
 * Resolve cells in a GridNode
 */
function resolveGridNode(
  node: GridNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): GridNode {
  const resolvedRows = node.rows.map((row) => ({
    ...row,
    cells: row.cells.map((cell) => {
      const resolved = resolveNode(cell, ctx, options);
      return resolved ?? createEmptyNode();
    }),
  }));

  return {
    ...node,
    rows: resolvedRows,
  };
}

/**
 * Resolve TextNode with contentResolver
 */
function resolveTextNode(
  node: TextNode,
  ctx: DataContext
): TextNode {
  if (!node.contentResolver) {
    return node;
  }

  // Call the content resolver to get dynamic content
  let content: string;
  try {
    content = node.contentResolver(ctx);
  } catch {
    // If resolver throws, use the static content as fallback
    content = node.content;
  }

  // Destructure to remove contentResolver and return resolved node
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contentResolver: _, ...rest } = node;
  return {
    ...rest,
    content,
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create an empty spacer node (used when resolution returns null)
 */
function createEmptyNode(): LayoutNode {
  return {
    type: 'spacer',
    height: 0,
    width: 0,
  };
}

// ==================== MAIN RESOLVER ====================

/**
 * Resolve a layout node and all its children
 *
 * This transforms dynamic nodes (TemplateNode, ConditionalNode, SwitchNode, EachNode)
 * into static nodes that can be measured and rendered.
 *
 * @param node - The layout node to resolve
 * @param ctx - The data context for resolution
 * @param options - Resolver options (filters, etc.)
 * @returns Resolved node, or null if the node should be removed
 *
 * @example
 * ```typescript
 * const ctx: DataContext = {
 *   data: { name: 'John', isPremium: true },
 *   space: { availableWidth: 1000, ... }
 * };
 *
 * const templateNode: TemplateNode = {
 *   type: 'template',
 *   template: 'Hello {{name}}!'
 * };
 *
 * const resolved = resolveNode(templateNode, ctx);
 * // Returns: { type: 'text', content: 'Hello John!' }
 * ```
 */
export function resolveNode(
  node: LayoutNode,
  ctx: DataContext,
  options: ResolverOptions = {}
): LayoutNode | null {
  // Handle dynamic node types
  if (isTemplateNode(node)) {
    return resolveTemplateNode(node, ctx, options);
  }

  if (isConditionalNode(node)) {
    return resolveConditionalNode(node, ctx, options);
  }

  if (isSwitchNode(node)) {
    return resolveSwitchNode(node, ctx, options);
  }

  if (isEachNode(node)) {
    return resolveEachNode(node, ctx, options);
  }

  // Handle container nodes (resolve their children)
  if (isStackNode(node)) {
    return resolveStackNode(node, ctx, options);
  }

  if (isFlexNode(node)) {
    return resolveFlexNode(node, ctx, options);
  }

  if (isGridNode(node)) {
    return resolveGridNode(node, ctx, options);
  }

  // Handle TextNode with contentResolver
  if (isTextNode(node) && node.contentResolver) {
    return resolveTextNode(node, ctx);
  }

  // Other node types (spacer, line) - return as-is
  return node;
}

/**
 * Create a default SpaceContext for testing/standalone use
 */
export function createDefaultSpaceContext(): SpaceContext {
  return {
    availableWidth: 2880, // ~8 inches at 360 DPI
    availableHeight: 3600, // ~10 inches at 360 DPI
    remainingWidth: 2880,
    remainingHeight: 3600,
    pageNumber: 0,
  };
}

/**
 * Create a DataContext from data and optional space context
 */
export function createDataContext<T = unknown>(
  data: T,
  space?: SpaceContext
): DataContext<T> {
  return {
    data,
    space: space ?? createDefaultSpaceContext(),
  };
}
