/**
 * High-Level Boxed Text API
 * Print text surrounded by a border with automatic mode selection
 */

import { CommandBuilder } from '../commands/CommandBuilder';
import { CHAR_TABLE, PRINT_QUALITY } from '../core/constants';
import type { CharacterTable, PrintQuality } from '../core/types';
import { concat } from '../core/utils';

import {
  renderBorder,
  normalizePadding,
  type BorderRenderMode,
  type BorderStyle,
  type PaddingSpec,
} from './BorderRenderer';

/**
 * Options for printBoxedText function
 */
export interface BoxedTextOptions {
  /** Padding inside the box (in characters) */
  padding?: number | Partial<PaddingSpec>;
  /** Border style: 'single' (default), 'double', or 'ascii' */
  borderStyle?: BorderStyle;
  /** Render mode: 'auto' (default), 'text', or 'graphics' */
  renderMode?: BorderRenderMode;
  /** Characters per inch: 10 (default), 12, or 15 */
  cpi?: 10 | 12 | 15;
  /** Print quality: 0 for draft, 1 for LQ */
  quality?: PrintQuality;
}

/**
 * Print text with a border around it
 * Automatically selects rendering mode based on code page capabilities
 *
 * @param text Text content (single string or array of lines)
 * @param charTable Current code page (determines if text mode is available)
 * @param options Formatting options
 * @returns Uint8Array of ESC/P2 commands
 *
 * @example
 * ```typescript
 * import { printBoxedText } from 'escp-ts/borders';
 * import { CHAR_TABLE } from 'escp-ts/core/constants';
 *
 * // Simple usage with defaults
 * const commands = printBoxedText('Hello World', CHAR_TABLE.PC437_USA);
 *
 * // With options
 * const fancy = printBoxedText(
 *   ['Line 1', 'Line 2'],
 *   CHAR_TABLE.PC437_USA,
 *   {
 *     padding: 2,
 *     borderStyle: 'double',
 *     cpi: 12,
 *     quality: 1,
 *   }
 * );
 *
 * // Force graphics mode for consistent appearance
 * const graphicsBox = printBoxedText('Notice', CHAR_TABLE.PC437_USA, {
 *   renderMode: 'graphics',
 * });
 * ```
 */
export function printBoxedText(
  text: string | string[],
  charTable: CharacterTable = CHAR_TABLE.PC437_USA as CharacterTable,
  options: BoxedTextOptions = {}
): Uint8Array {
  const {
    padding: paddingInput,
    borderStyle = 'single',
    renderMode = 'auto',
    cpi = 10,
    quality = PRINT_QUALITY.DRAFT as PrintQuality,
  } = options;

  // Normalize text to array of lines
  const lines = Array.isArray(text) ? text : [text];

  // Find the maximum line length
  const maxLineLength = Math.max(...lines.map((line) => line.length), 0);

  // Normalize padding
  const padding = normalizePadding(paddingInput);

  // Render border components
  const borderResult = renderBorder({
    mode: renderMode,
    style: borderStyle,
    contentWidthChars: maxLineLength,
    contentLines: lines.length,
    padding,
    cpi,
    charTable,
  });

  // Build the complete boxed text output
  const commands: Uint8Array[] = [];

  // Set CPI
  if (cpi === 12) {
    commands.push(CommandBuilder.selectElite());
  } else if (cpi === 15) {
    commands.push(CommandBuilder.selectMicron());
  } else {
    commands.push(CommandBuilder.selectPica());
  }

  // Set print quality
  commands.push(CommandBuilder.selectQuality(quality));

  // Set character table for text mode
  if (borderResult.mode === 'text') {
    commands.push(CommandBuilder.selectCharTable(charTable));
  }

  // Setup commands (line spacing for graphics mode)
  if (borderResult.setupCommands.length > 0) {
    commands.push(borderResult.setupCommands);
  }

  // Top border
  commands.push(borderResult.topBorder);

  // Restore line spacing after graphics top border
  if (borderResult.mode === 'graphics' && borderResult.restoreCommands.length > 0) {
    commands.push(borderResult.restoreCommands);
  }

  // Content lines with side borders
  const paddingLeft = ' '.repeat(padding.left);
  const paddingRight = ' '.repeat(padding.right);

  for (const line of lines) {
    // Pad line to max width
    const paddedLine = line.padEnd(maxLineLength, ' ');

    // Left border + padding + content + padding + right border + newline
    commands.push(borderResult.leftBorder);
    commands.push(CommandBuilder.encodeText(paddingLeft + paddedLine + paddingRight));
    commands.push(borderResult.rightBorder);
    commands.push(CommandBuilder.carriageReturn());
    commands.push(CommandBuilder.lineFeed());
  }

  // Setup for graphics bottom border
  if (borderResult.mode === 'graphics' && borderResult.setupCommands.length > 0) {
    commands.push(borderResult.setupCommands);
  }

  // Bottom border
  commands.push(borderResult.bottomBorder);

  // Final restore
  if (borderResult.restoreCommands.length > 0) {
    commands.push(borderResult.restoreCommands);
  }

  return concat(...commands);
}

/**
 * Print a simple box with single-line border
 * Convenience function for common use case
 *
 * @param text Text content
 * @param charTable Code page
 * @param padding Horizontal padding in characters (default 1)
 * @returns ESC/P2 command bytes
 */
export function printSimpleBox(
  text: string | string[],
  charTable: CharacterTable = CHAR_TABLE.PC437_USA as CharacterTable,
  padding: number = 1
): Uint8Array {
  return printBoxedText(text, charTable, {
    padding,
    borderStyle: 'single',
    renderMode: 'auto',
  });
}

/**
 * Print a box with double-line border
 * Convenience function for emphasized content
 *
 * @param text Text content
 * @param charTable Code page
 * @param padding Horizontal padding in characters (default 1)
 * @returns ESC/P2 command bytes
 */
export function printDoubleBox(
  text: string | string[],
  charTable: CharacterTable = CHAR_TABLE.PC437_USA as CharacterTable,
  padding: number = 1
): Uint8Array {
  return printBoxedText(text, charTable, {
    padding,
    borderStyle: 'double',
    renderMode: 'auto',
  });
}

export default {
  printBoxedText,
  printSimpleBox,
  printDoubleBox,
};
