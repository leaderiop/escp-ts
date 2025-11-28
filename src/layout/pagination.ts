/**
 * Pagination Phase for ESC/P2 Layout System
 *
 * The pagination phase runs after layout to segment results into pages,
 * respecting container boundaries, keepTogether hints, and break hints.
 * Grid rows are atomic and never split.
 */

import type { LayoutResult } from './layout';
import type { LayoutNode, GridNode } from './nodes';
import { isGridNode, isContainerNode } from './nodes';

// ==================== TYPES ====================

/**
 * Page configuration for pagination
 */
export interface PageConfig {
  /** Total page height in dots (1/360 inch) */
  pageHeight: number;
  /** Top margin in dots */
  topMargin: number;
  /** Bottom margin in dots */
  bottomMargin: number;
  /** Printable height (pageHeight - topMargin - bottomMargin) */
  printableHeight: number;
}

/**
 * A segment of layout content on a single page
 */
export interface PageSegment {
  /** Page number (0-indexed) */
  pageIndex: number;
  /** Starting Y position on this page */
  startY: number;
  /** Ending Y position on this page */
  endY: number;
  /** Layout items on this page (with page-relative Y positions) */
  items: LayoutResult[];
}

/**
 * Result of pagination
 */
export interface PaginatedLayoutResult {
  /** Original layout result */
  layout: LayoutResult;
  /** Page segments */
  pages: PageSegment[];
  /** Total number of pages */
  pageCount: number;
  /** Page configuration used */
  pageConfig: PageConfig;
}

/**
 * Internal context for pagination traversal
 */
interface PaginationContext {
  pageConfig: PageConfig;
  currentPageIndex: number;
  currentY: number;
}

/**
 * Represents a pageable item extracted from the layout tree
 */
interface PageableItem {
  /** Original layout result */
  layout: LayoutResult;
  /** Height of this item */
  height: number;
  /** Whether this item should be kept with the next item */
  keepWithNext: boolean;
  /** Whether a page break should occur before this item */
  breakBefore: boolean;
  /** Whether a page break should occur after this item */
  breakAfter: boolean;
  /** Whether this item and its children should stay together */
  keepTogether: boolean;
  /** Child items (for containers that can be split) */
  children: PageableItem[];
  /** Is this item atomic (cannot be split)? */
  isAtomic: boolean;
}

/**
 * Result of separating items by position mode
 */
interface SeparatedItems {
  flowItems: PageableItem[];
  absoluteItems: LayoutResult[];
}

/**
 * Recursively separate absolute positioned items from flow items
 * Absolute items are extracted and will be handled separately
 */
function separateByPositionMode(items: PageableItem[]): SeparatedItems {
  const flowItems: PageableItem[] = [];
  const absoluteItems: LayoutResult[] = [];

  for (const item of items) {
    if (isAbsolutePositioned(item.layout)) {
      // Extract absolute item - it will be handled separately
      absoluteItems.push(item.layout);
    } else if (item.children.length > 0 && !item.isAtomic) {
      // Recursively process children for non-atomic containers
      const separated = separateByPositionMode(item.children);
      absoluteItems.push(...separated.absoluteItems);

      // Keep flow item with only flow children
      flowItems.push({
        ...item,
        children: separated.flowItems,
      });
    } else {
      flowItems.push(item);
    }
  }

  return { flowItems, absoluteItems };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if a node has breakBefore hint
 */
function hasBreakBefore(node: LayoutNode): boolean {
  return 'breakBefore' in node && node.breakBefore === true;
}

/**
 * Check if a node has breakAfter hint
 */
function hasBreakAfter(node: LayoutNode): boolean {
  return 'breakAfter' in node && node.breakAfter === true;
}

/**
 * Check if a node has keepTogether hint
 */
function hasKeepTogether(node: LayoutNode): boolean {
  return 'keepTogether' in node && node.keepTogether === true;
}

/**
 * Check if a layout result is for an absolute positioned node
 */
function isAbsolutePositioned(layout: LayoutResult): boolean {
  const node = layout.node;
  return 'position' in node && (node as { position?: string }).position === 'absolute';
}

/**
 * Create a new page segment
 */
function createPageSegment(pageIndex: number, startY: number): PageSegment {
  return {
    pageIndex,
    startY,
    endY: startY,
    items: [],
  };
}

/**
 * Adjust Y positions in a layout result tree by a delta
 */
function adjustLayoutY(layout: LayoutResult, deltaY: number): LayoutResult {
  return {
    ...layout,
    y: layout.y + deltaY,
    children: layout.children.map(child => adjustLayoutY(child, deltaY)),
  };
}

/**
 * Calculate remaining space on current page
 */
function getRemainingSpace(ctx: PaginationContext): number {
  const pageBottom = ctx.pageConfig.topMargin + ctx.pageConfig.printableHeight;
  return Math.max(0, pageBottom - ctx.currentY);
}

// ==================== GRID ROW EXTRACTION ====================

/**
 * Extract rows from a grid layout result for individual pagination
 * Grid rows are atomic units - they cannot be split
 */
function extractGridRows(gridLayout: LayoutResult): PageableItem[] {
  const gridNode = gridLayout.node as GridNode;
  const items: PageableItem[] = [];

  let childIndex = 0;

  for (let rowIdx = 0; rowIdx < gridNode.rows.length; rowIdx++) {
    const rowDef = gridNode.rows[rowIdx];
    if (!rowDef) continue;

    const cellCount = rowDef.cells.length;
    const rowCells = gridLayout.children.slice(childIndex, childIndex + cellCount);

    if (rowCells.length === 0) continue;

    // Calculate row bounds from cells
    const minY = Math.min(...rowCells.map(c => c.y));
    const maxY = Math.max(...rowCells.map(c => c.y + c.height));
    const rowHeight = maxY - minY;

    // Create a synthetic row layout result containing the cells
    const rowLayout: LayoutResult = {
      node: gridLayout.node,
      x: gridLayout.x,
      y: minY,
      width: gridLayout.width,
      height: rowHeight,
      children: rowCells,
      style: gridLayout.style,
    };

    items.push({
      layout: rowLayout,
      height: rowHeight,
      keepWithNext: rowDef.keepWithNext === true,
      breakBefore: rowDef.breakBefore === true,
      breakAfter: false,
      keepTogether: true, // Rows are always atomic
      children: [],
      isAtomic: true,
    });

    childIndex += cellCount;
  }

  return items;
}

// ==================== PAGEABLE ITEM EXTRACTION ====================

/**
 * Convert a layout result into pageable items
 * This flattens containers into their children when they can be split
 */
function extractPageableItems(layout: LayoutResult): PageableItem[] {
  const node = layout.node;

  // Grid nodes are handled specially - extract rows
  if (isGridNode(node)) {
    // If the grid has keepTogether, treat entire grid as atomic
    if (hasKeepTogether(node)) {
      return [{
        layout,
        height: layout.height,
        keepWithNext: false,
        breakBefore: hasBreakBefore(node),
        breakAfter: hasBreakAfter(node),
        keepTogether: true,
        children: [],
        isAtomic: true,
      }];
    }

    // Extract individual rows from grid
    const rows = extractGridRows(layout);

    // Apply grid-level break hints to first/last rows
    if (rows.length > 0) {
      const firstRow = rows[0];
      const lastRow = rows[rows.length - 1];
      if (firstRow && hasBreakBefore(node)) {
        firstRow.breakBefore = true;
      }
      if (lastRow && hasBreakAfter(node)) {
        lastRow.breakAfter = true;
      }
    }

    return rows;
  }

  // Container nodes (stack, flex) can potentially be split
  if (isContainerNode(node)) {
    // If keepTogether is set and content is meant to stay together
    // Also treat absolute positioned containers as atomic
    if (hasKeepTogether(node) || isAbsolutePositioned(layout)) {
      return [{
        layout,
        height: layout.height,
        keepWithNext: false,
        breakBefore: hasBreakBefore(node),
        breakAfter: hasBreakAfter(node),
        keepTogether: true,
        children: [],
        isAtomic: true,
      }];
    }

    // Extract children as pageable items
    const childItems: PageableItem[] = [];
    for (const childLayout of layout.children) {
      const extracted = extractPageableItems(childLayout);
      childItems.push(...extracted);
    }

    // If the container has children, apply container hints
    if (childItems.length > 0) {
      const firstChild = childItems[0];
      const lastChild = childItems[childItems.length - 1];
      if (firstChild && hasBreakBefore(node)) {
        firstChild.breakBefore = true;
      }
      if (lastChild && hasBreakAfter(node)) {
        lastChild.breakAfter = true;
      }
    }

    // Return container with children that can be individually paginated
    return [{
      layout,
      height: layout.height,
      keepWithNext: false,
      breakBefore: hasBreakBefore(node),
      breakAfter: hasBreakAfter(node),
      keepTogether: false,
      children: childItems,
      isAtomic: false,
    }];
  }

  // Leaf nodes are always atomic
  return [{
    layout,
    height: layout.height,
    keepWithNext: false,
    breakBefore: hasBreakBefore(node),
    breakAfter: hasBreakAfter(node),
    keepTogether: true,
    children: [],
    isAtomic: true,
  }];
}

// ==================== PAGINATION ALGORITHM ====================

/**
 * Group items by their Y position for proper flex row handling
 */
interface YGroup {
  y: number;
  items: PageableItem[];
  maxHeight: number;
}

function groupByY(items: PageableItem[]): YGroup[] {
  const groups: YGroup[] = [];
  let currentGroup: YGroup | null = null;

  for (const item of items) {
    const itemY = item.layout.y;

    if (!currentGroup || itemY !== currentGroup.y) {
      // Start new group
      currentGroup = { y: itemY, items: [], maxHeight: 0 };
      groups.push(currentGroup);
    }

    currentGroup.items.push(item);
    currentGroup.maxHeight = Math.max(currentGroup.maxHeight, item.height);
  }

  return groups;
}

/**
 * Paginate a flat list of items
 * Items are expected to be sorted by Y position
 */
function paginateItems(
  items: PageableItem[],
  ctx: PaginationContext,
  pages: PageSegment[],
  currentPage: PageSegment
): PageSegment {
  // Group items by Y position to handle flex rows correctly
  const yGroups = groupByY(items);

  for (const [groupIndex, group] of yGroups.entries()) {
    // Handle explicit breakBefore for any item in the group
    const hasBreakBefore = group.items.some(item => item.breakBefore);
    if (hasBreakBefore && currentPage.items.length > 0) {
      pages.push(currentPage);
      ctx.currentPageIndex++;
      ctx.currentY = ctx.pageConfig.topMargin;
      currentPage = createPageSegment(ctx.currentPageIndex, ctx.currentY);
    }

    // Check if group fits on current page (use max height of group)
    const groupHeight = group.maxHeight;
    const remaining = getRemainingSpace(ctx);
    const fitsOnCurrentPage = groupHeight <= remaining;
    const fitsOnFreshPage = groupHeight <= ctx.pageConfig.printableHeight;

    // If group doesn't fit on current page
    if (!fitsOnCurrentPage) {
      // If group fits on a fresh page, start a new page
      if (fitsOnFreshPage && currentPage.items.length > 0) {
        pages.push(currentPage);
        ctx.currentPageIndex++;
        ctx.currentY = ctx.pageConfig.topMargin;
        currentPage = createPageSegment(ctx.currentPageIndex, ctx.currentY);
      }
      // If group is taller than a page, it will overflow (allowed)
    }

    // Calculate the Y adjustment for this group
    // All items in the group get the SAME adjustment
    // On first page with first group, preserve original Y to maintain container margins/padding
    const isFirstGroupOnFirstPage = ctx.currentPageIndex === 0 && currentPage.items.length === 0;
    const groupDeltaY = isFirstGroupOnFirstPage ? 0 : ctx.currentY - group.y;

    // If preserving original Y, sync currentY to match for subsequent groups
    if (isFirstGroupOnFirstPage) {
      ctx.currentY = group.y;
    }

    // Process all items in the group
    for (const item of group.items) {
      // If item is a splittable container, paginate its children
      if (!item.isAtomic && item.children.length > 0) {
        currentPage = paginateItems(item.children, ctx, pages, currentPage);
      } else {
        // Add the item to current page with group-adjusted Y
        const adjustedLayout = adjustLayoutY(item.layout, groupDeltaY);
        currentPage.items.push(adjustedLayout);
      }
    }

    // Calculate gap to next group by looking at original Y positions
    // The gap is embedded in the Y position differences from the layout phase
    let gapAfterGroup = 0;
    const nextGroup = yGroups[groupIndex + 1];
    if (nextGroup) {
      // Gap = nextGroup.y - (currentGroup.y + currentGroup.height)
      gapAfterGroup = Math.max(0, nextGroup.y - (group.y + group.maxHeight));
    }

    // Update currentY to after this row (using max height of the group + gap)
    currentPage.endY = ctx.currentY + groupHeight;
    ctx.currentY += groupHeight + gapAfterGroup;

    // Handle explicit breakAfter for any item in the group
    const hasBreakAfter = group.items.some(item => item.breakAfter);
    if (hasBreakAfter) {
      pages.push(currentPage);
      ctx.currentPageIndex++;
      ctx.currentY = ctx.pageConfig.topMargin;
      currentPage = createPageSegment(ctx.currentPageIndex, ctx.currentY);
    }
  }

  return currentPage;
}

// ==================== ABSOLUTE POSITIONING ====================

/**
 * Distribute absolute positioned items to appropriate pages based on Y coordinate.
 * Absolute items maintain their exact positions and are not adjusted by pagination flow.
 */
function distributeAbsoluteItems(
  absoluteItems: LayoutResult[],
  pages: PageSegment[],
  pageConfig: PageConfig
): void {
  for (const item of absoluteItems) {
    // Handle negative Y (treat as page 0)
    const effectiveY = Math.max(0, item.y);

    // Calculate which page this item belongs on based on Y position
    const pageIndex = Math.floor(effectiveY / pageConfig.pageHeight);

    // Ensure page exists (create additional pages if needed)
    while (pages.length <= pageIndex) {
      pages.push(createPageSegment(pages.length, pageConfig.topMargin));
    }

    const page = pages[pageIndex];
    if (!page) continue; // Safety check - shouldn't happen after while loop

    // Calculate page-relative Y position
    const pageRelativeY = effectiveY - (pageIndex * pageConfig.pageHeight);

    // Adjust item to page-relative position
    const adjustedItem = adjustLayoutY(item, pageRelativeY - item.y);
    page.items.push(adjustedItem);

    // Update page endY if needed
    const itemEndY = pageRelativeY + item.height;
    if (page.endY < itemEndY) {
      page.endY = itemEndY;
    }
  }
}

// ==================== MAIN FUNCTION ====================

/**
 * Paginate a layout result into page segments
 *
 * @param layout - Layout result from performLayout()
 * @param pageConfig - Page configuration
 * @returns Paginated layout result with page segments
 */
export function paginateLayout(
  layout: LayoutResult,
  pageConfig: PageConfig
): PaginatedLayoutResult {
  const ctx: PaginationContext = {
    pageConfig,
    currentPageIndex: 0,
    currentY: pageConfig.topMargin,
  };

  const pages: PageSegment[] = [];
  let currentPage = createPageSegment(0, pageConfig.topMargin);

  // Extract pageable items from the layout tree
  const items = extractPageableItems(layout);

  // Flatten nested items for simpler processing
  const flatItems = flattenPageableItems(items);

  // Separate absolute positioned items from flow items
  // Absolute items bypass pagination flow and maintain exact positions
  const { flowItems, absoluteItems } = separateByPositionMode(flatItems);

  // Paginate flow items normally
  currentPage = paginateItems(flowItems, ctx, pages, currentPage);

  // Add final page if it has content
  if (currentPage.items.length > 0) {
    pages.push(currentPage);
  }

  // Ensure at least one page exists
  if (pages.length === 0) {
    pages.push(createPageSegment(0, pageConfig.topMargin));
  }

  // Distribute absolute items to appropriate pages based on Y coordinate
  // This happens after flow pagination so page count is known
  distributeAbsoluteItems(absoluteItems, pages, pageConfig);

  return {
    layout,
    pages,
    pageCount: pages.length,
    pageConfig,
  };
}

/**
 * Flatten nested pageable items into a single list
 * Items are sorted by Y position to ensure correct pagination for flex layouts
 */
function flattenPageableItems(items: PageableItem[]): PageableItem[] {
  const result: PageableItem[] = [];

  for (const item of items) {
    if (!item.isAtomic && item.children.length > 0) {
      // Recursively flatten children
      const flatChildren = flattenPageableItems(item.children);

      // Apply container's breakBefore to first child (by Y order, not DOM order)
      // We'll handle this after sorting
      const firstChild = flatChildren[0];
      if (item.breakBefore && firstChild) {
        firstChild.breakBefore = true;
      }
      // Apply container's breakAfter to last child (by Y order)
      const lastChild = flatChildren[flatChildren.length - 1];
      if (item.breakAfter && lastChild) {
        lastChild.breakAfter = true;
      }

      result.push(...flatChildren);
    } else {
      result.push(item);
    }
  }

  // Sort by Y position to handle flex rows correctly
  // Items at the same Y (flex children) will be processed together
  result.sort((a, b) => a.layout.y - b.layout.y);

  return result;
}

/**
 * Create a PageConfig from paper dimensions
 */
export function createPageConfig(
  pageHeight: number,
  topMargin: number,
  bottomMargin: number
): PageConfig {
  return {
    pageHeight,
    topMargin,
    bottomMargin,
    printableHeight: pageHeight - topMargin - bottomMargin,
  };
}
