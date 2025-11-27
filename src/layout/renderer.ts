/**
 * Renderer for ESC/P2 Layout System
 *
 * The renderer converts a layout tree (with absolute positions) into
 * ESC/P2 printer commands. It flattens the tree, sorts items for
 * optimal print head movement, and emits commands.
 */

import type { LayoutResult } from './layout';
import type { TextNode, LineNode, ResolvedStyle, TextOrientation } from './nodes';
import { CommandBuilder } from '../commands/CommandBuilder';
import { encodeText } from '../fonts/CharacterSet';
import { INTERNATIONAL_CHARSET, CHAR_TABLE } from '../core/constants';
import type { InternationalCharset, CharacterTable } from '../core/types';

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
 */
function collectRenderItems(result: LayoutResult, items: RenderItem[]): void {
  const node = result.node;

  switch (node.type) {
    case 'text': {
      const textNode = node as TextNode;
      items.push({
        type: 'text',
        x: result.x,
        y: result.y,
        width: result.width,
        height: result.height,
        style: result.style,
        data: {
          type: 'text',
          content: textNode.content,
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
        x: result.x,
        y: result.y,
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
      // Container nodes - recurse into children
      for (const child of result.children) {
        collectRenderItems(child, items);
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
    // Use ESC $ for absolute horizontal position
    // ESC $ positions are relative to left margin, so subtract margin offset
    // Position is in 1/60 inch units
    const units = Math.round((x - ctx.leftMargin) / 6);
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
  ctx.currentX = item.x + item.width;
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
  // Flatten tree to render items
  const items = flattenTree(layoutResult);

  // Sort for optimal print head movement
  const sortedItems = sortRenderItems(items);

  // Initialize render context
  // startX represents the left margin - ESC $ positions are relative to this
  const ctx: RenderContext = {
    currentX: options.startX ?? 0,
    currentY: options.startY ?? 0,
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

