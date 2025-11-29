/**
 * Parser Types for @escp/preview
 *
 * Type definitions for the ESC/P command parser.
 * TODO: Full implementation to be added later.
 */

/**
 * Base interface for all parsed commands
 */
export interface BaseCommand {
  /** Command type identifier */
  type: string;
  /** Byte offset in source data */
  offset: number;
  /** Original bytes for debugging */
  rawBytes: Uint8Array;
}

/**
 * Control command (CR, LF, FF, etc.)
 */
export interface ControlCommand extends BaseCommand {
  type: 'control';
  code: 'CR' | 'LF' | 'FF' | 'HT' | 'VT' | 'BS' | 'BEL' | 'CAN' | 'SI' | 'SO' | 'DC2' | 'DC4';
}

/**
 * Text content command
 */
export interface TextCommand extends BaseCommand {
  type: 'text';
  data: Uint8Array;
}

/**
 * Position command
 */
export interface PositionCommand extends BaseCommand {
  type: 'position';
  subtype: 'absolute_h' | 'relative_h' | 'absolute_v' | 'relative_v' | 'advance_v' | 'reverse_feed';
  value: number;
}

/**
 * Font command
 */
export interface FontCommand extends BaseCommand {
  type: 'font';
  subtype:
    | 'master_select'
    | 'pitch'
    | 'typeface'
    | 'quality'
    | 'bold_on'
    | 'bold_off'
    | 'italic_on'
    | 'italic_off'
    | 'underline'
    | 'double_strike_on'
    | 'double_strike_off'
    | 'double_width'
    | 'double_height'
    | 'condensed'
    | 'proportional'
    | 'superscript'
    | 'subscript'
    | 'cancel_script'
    | 'inter_char_space';
  value?: number | boolean;
}

/**
 * Graphics command
 */
export interface GraphicsCommand extends BaseCommand {
  type: 'graphics';
  subtype: 'bit_image' | 'graphics_60' | 'graphics_120' | 'graphics_240' | 'raster';
  mode: number;
  width: number;
  height?: number;
  data: Uint8Array;
}

/**
 * Union of all command types
 */
export type ParsedCommand =
  | ControlCommand
  | TextCommand
  | PositionCommand
  | FontCommand
  | GraphicsCommand;
