/**
 * @escp/preview - PRN file parser and preview renderer
 *
 * This package provides tools for parsing ESC/P PRN files and
 * rendering them to PNG, SVG, or Canvas formats.
 *
 * @example
 * ```typescript
 * import { VirtualRenderer, DEFAULT_RENDER_OPTIONS } from '@escp/preview';
 *
 * const renderer = new VirtualRenderer(paper);
 * const pages = renderer.render(prnData);
 *
 * // Convert to PNG (requires sharp)
 * const pngBuffer = await toPNG(pages[0]);
 * ```
 *
 * @packageDocumentation
 */

// Virtual renderer (existing implementation)
export {
  VirtualRenderer,
  DEFAULT_RENDER_OPTIONS,
  type VirtualPage,
  type VirtualRenderOptions,
} from './renderer/VirtualRenderer';

// Parser (scaffold - TODO: implement)
export {
  EscpParser,
  type ParserOptions,
  type ParsedCommand,
  type ControlCommand,
  type TextCommand,
  type PositionCommand,
  type FontCommand,
  type GraphicsCommand,
} from './parser';

// Output converters (scaffold - TODO: implement)
export { toPNG, toSVG, type OutputOptions } from './output';
