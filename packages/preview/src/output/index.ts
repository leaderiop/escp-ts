/**
 * Output Module for @escp/preview
 *
 * This module will provide output conversion to PNG, SVG, and Canvas.
 * TODO: Full implementation to be added later.
 */

import type { VirtualPage } from '../renderer/VirtualRenderer';

/**
 * Convert a virtual page to PNG buffer
 *
 * @param page - Virtual page to convert
 * @returns PNG buffer (requires sharp)
 *
 * TODO: Implement PNG conversion using sharp
 */
export async function toPNG(_page: VirtualPage): Promise<Buffer> {
  // TODO: Implement PNG conversion using sharp
  throw new Error('PNG output not yet implemented');
}

/**
 * Convert a virtual page to SVG string
 *
 * @param page - Virtual page to convert
 * @returns SVG string
 *
 * TODO: Implement SVG conversion
 */
export function toSVG(_page: VirtualPage): string {
  // TODO: Implement SVG conversion
  throw new Error('SVG output not yet implemented');
}

/**
 * Output format options
 */
export interface OutputOptions {
  /** Scale factor */
  scale?: number;
  /** Background color (hex) */
  backgroundColor?: string;
}
