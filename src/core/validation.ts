/**
 * Validation utilities for escp-ts
 *
 * These functions validate input parameters and throw descriptive errors
 * when validation fails.
 */

import {
  EscpRangeError,
  EncodingError,
  GraphicsError,
  ValidationError,
} from './errors';

/**
 * Assert that a value is a valid byte (0-255)
 * @throws {EscpRangeError} if value is not an integer between 0 and 255
 */
export function assertByte(value: number, parameter: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new EscpRangeError(parameter, value, 0, 255);
  }
}

/**
 * Assert that a value is within a specified range
 * @throws {EscpRangeError} if value is not an integer within the range
 */
export function assertRange(
  value: number,
  min: number,
  max: number,
  parameter: string
): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new EscpRangeError(parameter, value, min, max);
  }
}

/**
 * Assert that a value is a valid unsigned 16-bit integer (0-65535)
 * @throws {EscpRangeError} if value is not an integer between 0 and 65535
 */
export function assertUint16(value: number, parameter: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new EscpRangeError(parameter, value, 0, 65535);
  }
}

/**
 * Assert that a hex string is valid (even length, valid characters)
 * @throws {EncodingError} if hex string is invalid
 */
export function assertValidHex(hex: string): void {
  const clean = hex.replace(/\s/g, '');
  if (clean.length % 2 !== 0) {
    throw new EncodingError(
      `Hex string must have even length, got ${clean.length}`,
      hex
    );
  }
  if (!/^[0-9A-Fa-f]*$/.test(clean)) {
    throw new EncodingError('Hex string contains invalid characters', hex);
  }
}

/**
 * Assert that width and height are positive integers
 * @throws {GraphicsError} if dimensions are not positive integers
 */
export function assertPositiveDimensions(
  width: number,
  height: number,
  operation: string
): void {
  if (!Number.isInteger(width) || width < 1) {
    throw new GraphicsError(
      `Width must be a positive integer, got ${width}`,
      operation
    );
  }
  if (!Number.isInteger(height) || height < 1) {
    throw new GraphicsError(
      `Height must be a positive integer, got ${height}`,
      operation
    );
  }
}

/**
 * Assert that a value is non-negative
 * @throws {ValidationError} if value is negative
 */
export function assertNonNegative(value: number, parameter: string): void {
  if (value < 0) {
    throw new ValidationError(
      `${parameter} cannot be negative, got ${value}`,
      parameter,
      value
    );
  }
}

/**
 * Assert that a value is one of the allowed values
 * @throws {ValidationError} if value is not in the allowed list
 */
export function assertOneOf<T>(
  value: T,
  allowed: readonly T[],
  parameter: string
): void {
  if (!allowed.includes(value)) {
    throw new ValidationError(
      `${parameter} must be one of [${allowed.join(', ')}], got ${String(value)}`,
      parameter,
      value
    );
  }
}
