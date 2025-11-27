/**
 * Renderer for ESC/P2 Layout System
 *
 * The renderer converts a layout tree (with absolute positions) into
 * ESC/P2 printer commands. It flattens the tree, sorts items for
 * optimal print head movement, and emits commands.
 */

import type { LayoutResult } from './layout';
import type { TextNode, LineNode, ResolvedStyle, TextOrientation, TextOverflow } from './nodes';
import { CommandBuilder } from '../commands/CommandBuilder';
import { encodeText, getCharacterWidth } from '../fonts/CharacterSet';
import { INTERNATIONAL_CHARSET, CHAR_TABLE } from '../core/constants';
import type { InternationalCharset, CharacterTable } from '../core/types';

// ==================== TEXT TRUNCATION ====================

/**
 * Truncate text to fit within a maximum width based on overflow mode
 *
 * @param text - The text content to potentially truncate
 * @param maxWidth - Maximum width in dots
 * @param overflow - Overflow mode: 'visible', 'clip', or 'ellipsis'
 * @param style - Style information for character width calculation
 * @returns Truncated text string
 */
function truncateText(
  text: string,
  maxWidth: number,
  overflow: TextOverflow,
  style: ResolvedStyle
): string {
  // 'visible' mode - no truncation
  if (overflow === 'visible') {
    return text;
  }

  const ellipsis = '...';
  let currentWidth = 0;
  let lastFitIndex = 0;

  // Calculate width character by character
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const charWidth = getCharacterWidth(
      charCode,
      style.cpi,
      false, // proportional
      style.condensed,
      style.doubleWidth
    );

    if (currentWidth + charWidth > maxWidth) {
      // Text exceeds max width
      if (overflow === 'clip') {
        return text.slice(0, lastFitIndex);
      }

      // 'ellipsis' mode - need to fit ellipsis
      // Calculate width of ellipsis
      let ellipsisWidth = 0;
      for (const char of ellipsis) {
        ellipsisWidth += getCharacterWidth(
          char.charCodeAt(0),
          style.cpi,
          false,
          style.condensed,
          style.doubleWidth
        );
      }

      // Find how many characters fit with ellipsis
      let widthWithEllipsis = 0;
      let fitIndexForEllipsis = 0;
      for (let j = 0; j < text.length; j++) {
        const cCode = text.charCodeAt(j);
        const cWidth = getCharacterWidth(
          cCode,
          style.cpi,
          false,
          style.condensed,
          style.doubleWidth
        );

        if (widthWithEllipsis + cWidth + ellipsisWidth > maxWidth) {
          break;
        }
        widthWithEllipsis += cWidth;
        fitIndexForEllipsis = j + 1;
      }

      return text.slice(0, fitIndexForEllipsis) + ellipsis;
    }

    currentWidth += charWidth;
    lastFitIndex = i + 1;
  }

  // Text fits entirely
  return text;
}

// ==================== RENDER ITEM ====================

/**
 * A flattened render item with absolute position
 */
export interface RenderItem {
  /** Item type */
  type: 'text' | 'line';
  /** Absolute X position in dots */
  x: number;
  /** Absolute Y position in dots */
  y: number;
  /** Width in dots */
  width: number;
  /** Height in dots */
  height: number;
  /** Style to apply */
  style: ResolvedStyle;
  /** Content data */
  data: RenderItemData;
}

/**
 * Render item data variants
 */
export type RenderItemData =
  | { type: 'text'; content: string; orientation: TextOrientation }
  | { type: 'line'; char: string; length: number };

// ==================== FLATTEN TREE ====================

/**
 * Flatten a layout tree into a list of render items
 */
export function flattenTree(result: LayoutResult): RenderItem[] {
  const items: RenderItem[] = [];
  collectRenderItems(result, items);
  return items;
}

/**
 * Recursively collect render items from layout tree
 * @param result - Layout result to process
 * @param items - Array to collect render items into
 * @param parentOffset - Accumulated offset from parent containers (for relative positioning)
 */
function collectRenderItems(
  result: LayoutResult,
  items: RenderItem[],
  parentOffset: { x: number; y: number } = { x: 0, y: 0 }
): void {
  const node = result.node;

  // Apply relative offset for positioning (offset is visual only, doesn't affect pagination)
  // Accumulate parent offset + this node's relative offset
  const thisOffset = {
    x: parentOffset.x + (result.relativeOffset?.x ?? 0),
    y: parentOffset.y + (result.relativeOffset?.y ?? 0),
  };
  const effectiveX = result.x + thisOffset.x;
  const effectiveY = result.y + thisOffset.y;

  switch (node.type) {
    case 'text': {
      const textNode = node as TextNode;
      const overflow = textNode.overflow ?? 'visible';

      // Determine the constraint width for truncation
      // Priority: renderConstraints.boundaryWidth > explicit node width > layout result width
      let constraintWidth = result.width;
      let boundaryWidth = result.width; // For alignment calculations

      if (result.renderConstraints) {
        // Use render constraints from grid cells for boundary enforcement
        constraintWidth = result.renderConstraints.boundaryWidth;
        boundaryWidth = result.renderConstraints.boundaryWidth;
      } else if (typeof textNode.width === 'number') {
        constraintWidth = textNode.width;
      }

      // Subtract padding from constraint width if present
      // This ensures text content area is correctly calculated
      if (textNode.padding) {
        const padding = typeof textNode.padding === 'number'
          ? textNode.padding * 2
          : ((textNode.padding.left ?? 0) + (textNode.padding.right ?? 0));
        constraintWidth = Math.max(0, constraintWidth - padding);
      }

      // Apply text truncation
      // Always truncate if text exceeds constraint width, defaulting to 'clip'
      // This ensures grid cell contents don't overflow into adjacent columns
      let content = textNode.content;
      let textWidth = 0;

      // Calculate actual text width
      for (const char of content) {
        textWidth += getCharacterWidth(
          char.charCodeAt(0),
          result.style.cpi,
          false,
          result.style.condensed,
          result.style.doubleWidth
        );
      }

      // Truncate if text exceeds constraint
      if (constraintWidth > 0 && textWidth > constraintWidth) {
        // Use explicit overflow mode, or default to 'clip' for layout constraints
        const effectiveOverflow = overflow === 'visible' ? 'clip' : overflow;
        content = truncateText(content, constraintWidth, effectiveOverflow, result.style);

        // Recalculate text width after truncation
        textWidth = 0;
        for (const char of content) {
          textWidth += getCharacterWidth(
            char.charCodeAt(0),
            result.style.cpi,
            false,
            result.style.condensed,
            result.style.doubleWidth
          );
        }
      }

      // Calculate X position based on alignment
      // Use renderConstraints.hAlign if available, otherwise fall back to cellAlign
      let renderX = effectiveX;
      const alignment = result.renderConstraints?.hAlign ?? result.cellAlign;
      if (alignment && boundaryWidth > 0) {
        switch (alignment) {
          case 'center':
            renderX = effectiveX + Math.floor((boundaryWidth - textWidth) / 2);
            break;
          case 'right':
            renderX = effectiveX + boundaryWidth - textWidth;
            break;
          // 'left' or undefined - no adjustment
        }
      }

      // Enforce cell boundary: ensure text doesn't overflow cell right edge
      // Critical for grid cells with zero/small column gaps to prevent overlap
      // Use Math.floor to avoid sub-pixel rounding issues
      const cellRightEdge = effectiveX + boundaryWidth;
      const textRightEdge = renderX + textWidth;
      if (textRightEdge > cellRightEdge + 1) { // 1-dot tolerance for rounding
        renderX = Math.max(effectiveX, Math.floor(cellRightEdge - textWidth));
      }

      items.push({
        type: 'text',
        x: renderX,
        y: effectiveY,
        width: boundaryWidth,
        height: result.height,
        style: result.style,
        data: {
          type: 'text',
          content,
          orientation: textNode.orientation ?? 'horizontal',
        },
      });
      break;
    }

    case 'line': {
      const lineNode = node as LineNode;
      const char = lineNode.char ?? (lineNode.direction === 'horizontal' ? '-' : '|');
      items.push({
        type: 'line',
        x: effectiveX,
        y: effectiveY,
        width: result.width,
        height: result.height,
        style: result.style,
        data: { type: 'line', char, length: result.width },
      });
      break;
    }

    case 'stack':
    case 'flex':
    case 'grid':
      // Container nodes - recurse into children, passing accumulated offset
      for (const child of result.children) {
        collectRenderItems(child, items, thisOffset);
      }
      break;

    case 'spacer':
      // Spacers don't render anything
      break;
  }
}

/**
 * Sort render items for optimal print head movement
 * Sort by Y (top to bottom), then X (left to right)
 */
export function sortRenderItems(items: RenderItem[]): RenderItem[] {
  return [...items].sort((a, b) => {
    // Primary sort by Y position (top to bottom)
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    // Secondary sort by X position (left to right)
    return a.x - b.x;
  });
}

// ==================== COMMAND GENERATION ====================

/**
 * Result of rendering
 */
export interface RenderResult {
  /** Generated ESC/P2 commands */
  commands: Uint8Array;
  /** Final Y position after rendering */
  finalY: number;
}

/**
 * Render context for command generation
 */
interface RenderContext {
  /** Current X position */
  currentX: number;
  /** Current Y position */
  currentY: number;
  /** Left margin offset - ESC $ positions are relative to left margin */
  leftMargin: number;
  /** Current applied style */
  currentStyle: ResolvedStyle;
  /** International charset */
  charset: InternationalCharset;
  /** Character table */
  charTable: CharacterTable;
  /** Line spacing in dots */
  lineSpacing: number;
  /** Output command buffer */
  output: Uint8Array[];
}

/**
 * Emit a command to the output buffer
 */
function emit(ctx: RenderContext, command: Uint8Array): void {
  ctx.output.push(command);
}

/**
 * Move to absolute X position
 */
function moveToX(ctx: RenderContext, x: number): void {
  if (Math.abs(ctx.currentX - x) > 1) {
    // Use ESC $ for absolute horizontal position from page origin
    // Position is in 1/60 inch units (360 DPI / 6 = 60 units per inch)
    const units = Math.max(0, Math.round(x / 6));
    emit(ctx, CommandBuilder.absoluteHorizontalPosition(units));
    ctx.currentX = x;
  }
}

/**
 * Move to Y position (advance vertically)
 */
function moveToY(ctx: RenderContext, y: number): void {
  if (y > ctx.currentY) {
    // Need to advance down
    const deltaY = y - ctx.currentY;

    // Use ESC J for advancing in 1/180 inch increments
    let units180 = Math.round(deltaY / 2); // 360/180 = 2

    // ESC J max is 255, so break into multiple commands if needed
    while (units180 > 0) {
      const advance = Math.min(units180, 255);
      emit(ctx, CommandBuilder.advanceVertical(advance));
      units180 -= advance;
    }
    ctx.currentY = y;
  }
  // Note: We don't support moving backwards (up the page)
}

/**
 * Apply style changes
 */
function applyStyle(ctx: RenderContext, style: ResolvedStyle): void {
  // Bold
  if (style.bold !== ctx.currentStyle.bold) {
    emit(ctx, style.bold ? CommandBuilder.boldOn() : CommandBuilder.boldOff());
  }

  // Italic
  if (style.italic !== ctx.currentStyle.italic) {
    emit(ctx, style.italic ? CommandBuilder.italicOn() : CommandBuilder.italicOff());
  }

  // Underline
  if (style.underline !== ctx.currentStyle.underline) {
    emit(ctx, CommandBuilder.setUnderline(style.underline));
  }

  // Double strike
  if (style.doubleStrike !== ctx.currentStyle.doubleStrike) {
    emit(ctx, style.doubleStrike ? CommandBuilder.doubleStrikeOn() : CommandBuilder.doubleStrikeOff());
  }

  // Double width
  if (style.doubleWidth !== ctx.currentStyle.doubleWidth) {
    emit(ctx, CommandBuilder.setDoubleWidth(style.doubleWidth));
  }

  // Double height
  if (style.doubleHeight !== ctx.currentStyle.doubleHeight) {
    emit(ctx, CommandBuilder.setDoubleHeight(style.doubleHeight));
  }

  // Condensed
  if (style.condensed !== ctx.currentStyle.condensed) {
    emit(ctx, style.condensed ? CommandBuilder.selectCondensed() : CommandBuilder.cancelCondensed());
  }

  // CPI
  if (style.cpi !== ctx.currentStyle.cpi) {
    switch (style.cpi) {
      case 10:
        emit(ctx, CommandBuilder.selectPica());
        break;
      case 12:
        emit(ctx, CommandBuilder.selectElite());
        break;
      case 15:
        emit(ctx, CommandBuilder.selectMicron());
        break;
    }
  }

  ctx.currentStyle = { ...style };
}

/**
 * Render a text item
 */
function renderTextItem(ctx: RenderContext, item: RenderItem): void {
  if (item.data.type !== 'text') return;

  if (item.data.orientation === 'vertical') {
    renderVerticalText(ctx, item);
    return;
  }

  // Horizontal text (default)
  // Position
  moveToY(ctx, item.y);
  moveToX(ctx, item.x);

  // Style
  applyStyle(ctx, item.style);

  // Text content
  const encoded = encodeText(item.data.content, ctx.charset, ctx.charTable);
  emit(ctx, encoded);

  // Update X position after printing
  // Calculate actual text width to track printer head position accurately
  // This is critical for grid columns with small/zero gaps
  let actualTextWidth = 0;
  for (const char of item.data.content) {
    actualTextWidth += getCharacterWidth(
      char.charCodeAt(0),
      item.style.cpi,
      false,
      item.style.condensed,
      item.style.doubleWidth
    );
  }
  ctx.currentX = item.x + actualTextWidth;
}

/**
 * Render vertical text character by character
 */
function renderVerticalText(ctx: RenderContext, item: RenderItem): void {
  if (item.data.type !== 'text') return;

  const content = item.data.content;
  const charHeight = ctx.lineSpacing;
  let currentY = item.y;

  // Apply style once
  applyStyle(ctx, item.style);

  // Calculate character width based on current CPI
  const charWidth = Math.round(360 / item.style.cpi);

  for (const char of content) {
    // Position for this character
    moveToY(ctx, currentY);
    moveToX(ctx, item.x);

    // Print single character
    const encoded = encodeText(char, ctx.charset, ctx.charTable);
    emit(ctx, encoded);

    // Update X position to reflect printer head movement after printing
    // This ensures the next moveToX call will reposition correctly
    ctx.currentX = item.x + charWidth;

    // Move down for next character
    currentY += charHeight;
  }

  // Update position after rendering
  ctx.currentY = currentY;
  ctx.currentX = item.x + charWidth;
}

/**
 * Render a line item
 */
function renderLineItem(ctx: RenderContext, item: RenderItem): void {
  if (item.data.type !== 'line') return;

  // Position
  moveToY(ctx, item.y);
  moveToX(ctx, item.x);

  // Style
  applyStyle(ctx, item.style);

  // Calculate how many characters to print
  const charWidth = Math.round(360 / item.style.cpi);
  const numChars = Math.max(1, Math.floor(item.data.length / charWidth));

  // Generate repeated character
  const lineStr = item.data.char.repeat(numChars);
  const encoded = encodeText(lineStr, ctx.charset, ctx.charTable);
  emit(ctx, encoded);

  // Update X position
  ctx.currentX = item.x + item.width;
}

/**
 * Concatenate command arrays
 */
function concatCommands(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ==================== MAIN RENDER FUNCTION ====================

/**
 * Render options
 */
export interface RenderOptions {
  /** Starting X position */
  startX?: number;
  /** Starting Y position */
  startY?: number;
  /** International charset */
  charset?: InternationalCharset;
  /** Character table */
  charTable?: CharacterTable;
  /** Line spacing in dots */
  lineSpacing?: number;
  /** Initial style */
  initialStyle?: ResolvedStyle;
}

/**
 * Default style for rendering
 */
const DEFAULT_RENDER_STYLE: ResolvedStyle = {
  bold: false,
  italic: false,
  underline: false,
  doubleStrike: false,
  doubleWidth: false,
  doubleHeight: false,
  condensed: false,
  cpi: 10,
};

/**
 * Render a layout tree to ESC/P2 commands
 *
 * @param layoutResult - Layout result from layout phase
 * @param options - Render options
 * @returns Render result with commands and final position
 */
export function renderLayout(
  layoutResult: LayoutResult,
  options: RenderOptions = {}
): RenderResult {
  return renderPageItems([layoutResult], options);
}

/**
 * Render multiple layout results (page items) together in a single context.
 * This is critical for correct rendering because the render context must be
 * maintained across all items to properly track printer head position.
 *
 * @param layoutResults - Array of layout results from pagination
 * @param options - Render options
 * @returns Render result with commands and final position
 */
export function renderPageItems(
  layoutResults: LayoutResult[],
  options: RenderOptions = {}
): RenderResult {
  // Flatten ALL trees to render items
  const items: RenderItem[] = [];
  for (const result of layoutResults) {
    items.push(...flattenTree(result));
  }

  // Sort for optimal print head movement
  const sortedItems = sortRenderItems(items);

  // Initialize render context
  // currentX/currentY track the actual printer head position (starts at 0,0 after ESC @)
  // startX/startY represent the desired rendering offset/margin
  const ctx: RenderContext = {
    currentX: 0,  // Printer head is at 0 after ESC @
    currentY: 0,  // Printer head is at 0 after ESC @
    leftMargin: options.startX ?? 0,
    currentStyle: options.initialStyle ?? DEFAULT_RENDER_STYLE,
    charset: options.charset ?? (INTERNATIONAL_CHARSET.USA as InternationalCharset),
    charTable: options.charTable ?? (CHAR_TABLE.PC437_USA as CharacterTable),
    lineSpacing: options.lineSpacing ?? 60,
    output: [],
  };

  // Render each item
  for (const item of sortedItems) {
    switch (item.type) {
      case 'text':
        renderTextItem(ctx, item);
        break;
      case 'line':
        renderLineItem(ctx, item);
        break;
    }
  }

  // Calculate final Y position
  let finalY = ctx.currentY;
  const lastItem = sortedItems[sortedItems.length - 1];
  if (lastItem) {
    finalY = Math.max(finalY, lastItem.y + lastItem.height);
  }

  return {
    commands: concatCommands(ctx.output),
    finalY,
  };
}

