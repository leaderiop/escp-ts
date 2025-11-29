/**
 * Table Border Renderer
 * Utilities for rendering grid borders on tables
 */

import type { LayoutNode, WidthSpec } from '../layout/nodes';
import type { GridBorderCharSet } from './BoxDrawingChars';
import {
  getGridBorderCharSet,
  supportsBoxDrawing,
  ASCII_GRID,
} from './BoxDrawingChars';
import type { CharacterTable } from '../core/types';
import { Stack } from '../jsx/components/layout/Stack';
import { Flex } from '../jsx/components/layout/Flex';
import { Text } from '../jsx/components/content/Text';
import { Line } from '../jsx/components/content/Line';

/**
 * Table border style options
 */
export type TableBorderStyle = 'single' | 'double' | 'ascii';

/**
 * Table structure information for border generation
 */
export interface TableStructure {
  columnWidths: WidthSpec[];
  columnCount: number;
}

/**
 * Border configuration result
 */
export interface TableBorderConfig {
  style: TableBorderStyle;
  chars: GridBorderCharSet;
}

/**
 * Resolve border prop to style and character set
 * @param border The border prop value
 * @param charTable Optional character table for auto-detection
 * @returns Border configuration or null if borders disabled
 */
export function resolveBorderConfig(
  border: boolean | TableBorderStyle | undefined,
  charTable?: CharacterTable
): TableBorderConfig | null {
  if (!border) return null;

  let style: TableBorderStyle;
  if (border === true) {
    // Auto-detect: use CP437 single if supported, else ASCII
    style = charTable && supportsBoxDrawing(charTable) ? 'single' : 'ascii';
  } else {
    style = border;
  }

  return {
    style,
    chars: getGridBorderCharSet(style),
  };
}

/**
 * Calculate the number of border characters for a table
 * For N columns: 1 left border + (N-1) internal separators + 1 right border = N+1
 */
export function getBorderCharCount(columnCount: number): number {
  return columnCount + 1;
}

/**
 * Convert percentage width to flexGrow value
 * e.g., '45%' -> 45, '25%' -> 25
 * Non-percentage widths default to flexGrow: 1
 */
function getFlexGrowForWidth(width: WidthSpec | undefined): number {
  if (typeof width === 'string' && width.endsWith('%')) {
    return parseFloat(width.slice(0, -1));
  }
  return 1;
}

/**
 * Width for a single border character in dots.
 * At 10 CPI, each character is 36 dots wide.
 * Border characters must have full character width to render properly.
 * Using a narrower width causes characters to be clipped/invisible.
 */
const BORDER_CHAR_WIDTH = 36;

/**
 * Create a fixed-width border character Stack
 * Using Stack wrapper with explicit width instead of raw Text because
 * Text nodes have flexShrink=0 and would take their full intrinsic width (36px)
 */
function fixedBorderChar(char: string): LayoutNode {
  return Stack({
    style: { width: BORDER_CHAR_WIDTH, flexGrow: 0, flexShrink: 0 },
    children: Text({ children: char }),
  });
}

/**
 * Create top border row: ┌───┬───┬───┐
 * Uses flexGrow to distribute space proportionally after border characters
 * Corner and junction characters have fixed width
 */
export function createTopBorderRow(
  structure: TableStructure,
  chars: GridBorderCharSet
): LayoutNode {
  const children: LayoutNode[] = [fixedBorderChar(chars.topLeft)];

  for (let i = 0; i < structure.columnCount; i++) {
    const width = structure.columnWidths[i];
    // Use Line directly with flexGrow and flexBasis:0 to match content cell distribution
    children.push(
      Line({
        char: chars.horizontal,
        length: 'fill',
        style: { flexGrow: getFlexGrowForWidth(width), flexShrink: 1, flexBasis: 0 },
      })
    );

    if (i < structure.columnCount - 1) {
      children.push(fixedBorderChar(chars.tDown));
    }
  }

  children.push(fixedBorderChar(chars.topRight));

  return Flex({ children });
}

/**
 * Create bottom border row: └───┴───┴───┘
 * Uses flexGrow to distribute space proportionally after border characters
 * Corner and junction characters have fixed width
 */
export function createBottomBorderRow(
  structure: TableStructure,
  chars: GridBorderCharSet
): LayoutNode {
  const children: LayoutNode[] = [fixedBorderChar(chars.bottomLeft)];

  for (let i = 0; i < structure.columnCount; i++) {
    const width = structure.columnWidths[i];
    // Use Line directly with flexGrow and flexBasis:0 to match content cell distribution
    children.push(
      Line({
        char: chars.horizontal,
        length: 'fill',
        style: { flexGrow: getFlexGrowForWidth(width), flexShrink: 1, flexBasis: 0 },
      })
    );

    if (i < structure.columnCount - 1) {
      children.push(fixedBorderChar(chars.tUp));
    }
  }

  children.push(fixedBorderChar(chars.bottomRight));

  return Flex({ children });
}

/**
 * Create row separator: ├───┼───┼───┤
 * Uses flexGrow to distribute space proportionally after border characters
 * Corner and junction characters have fixed width
 */
export function createRowSeparator(
  structure: TableStructure,
  chars: GridBorderCharSet
): LayoutNode {
  const children: LayoutNode[] = [fixedBorderChar(chars.tRight)];

  for (let i = 0; i < structure.columnCount; i++) {
    const width = structure.columnWidths[i];
    // Use Line directly with flexGrow and flexBasis:0 to match content cell distribution
    children.push(
      Line({
        char: chars.horizontal,
        length: 'fill',
        style: { flexGrow: getFlexGrowForWidth(width), flexShrink: 1, flexBasis: 0 },
      })
    );

    if (i < structure.columnCount - 1) {
      children.push(fixedBorderChar(chars.cross));
    }
  }

  children.push(fixedBorderChar(chars.tLeft));

  return Flex({ children });
}

/**
 * Create a single cell wrapped with content (for use in bordered rows)
 */
export function createBorderedCell(
  content: LayoutNode,
  width: WidthSpec
): LayoutNode {
  return Stack({
    style: { width: width || 'auto' },
    children: content,
  });
}

/**
 * Wrap cells with vertical borders: │ cell │ cell │ cell │
 * The cells should already have flexShrink: 1 to allow shrinking
 * Border characters have fixed width to prevent them from growing/shrinking
 */
export function wrapCellsWithVerticalBorders(
  cells: LayoutNode[],
  chars: GridBorderCharSet
): LayoutNode {
  // Use fixedBorderChar helper (defined at top of file)
  const borderChar = () => fixedBorderChar(chars.vertical);

  const children: LayoutNode[] = [borderChar()];

  for (const cell of cells) {
    children.push(cell);
    children.push(borderChar());
  }

  return Flex({ style: { gap: 0 }, children });
}

/**
 * Get default grid characters (ASCII fallback)
 */
export function getDefaultGridChars(): GridBorderCharSet {
  return ASCII_GRID;
}
