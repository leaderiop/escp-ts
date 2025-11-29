/**
 * Parser Module for @escp/preview
 *
 * This module will provide ESC/P command parsing functionality.
 * TODO: Full implementation to be added later.
 */

export * from './types';

/**
 * Parser options
 */
export interface ParserOptions {
  /** Throw on unknown commands */
  strict?: boolean;
  /** Continue parsing after errors */
  continueOnError?: boolean;
  /** Emit unknown commands */
  emitUnknown?: boolean;
}

/**
 * ESC/P Parser class (scaffold)
 *
 * TODO: Implement full ESC/P parsing functionality
 */
export class EscpParser {
  private options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      strict: false,
      continueOnError: true,
      emitUnknown: true,
      ...options,
    };
  }

  /**
   * Parse ESC/P byte data into commands
   *
   * @param data - Raw PRN/ESC/P data
   * @returns Parsed commands (TODO: implement)
   */
  parse(_data: Uint8Array): unknown[] {
    // TODO: Implement ESC/P parsing
    throw new Error('Parser not yet implemented. Use VirtualRenderer.render() for now.');
  }

  /**
   * Get parser options
   */
  getOptions(): Required<ParserOptions> {
    return this.options;
  }
}
