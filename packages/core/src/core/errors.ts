/**
 * Custom error classes for escp-ts
 *
 * These errors provide specific error types for different failure scenarios,
 * making it easier to handle errors programmatically.
 */

/**
 * Base error class for all escp-ts errors
 */
export class EscpError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'EscpError';
    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validation error for invalid input parameters
 */
export class ValidationError extends EscpError {
  constructor(
    message: string,
    public readonly parameter: string,
    public readonly value: unknown
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Range error for numeric values outside acceptable bounds
 */
export class EscpRangeError extends ValidationError {
  constructor(
    parameter: string,
    value: number,
    public readonly min: number,
    public readonly max: number
  ) {
    super(`${parameter} must be between ${min} and ${max}, got ${value}`, parameter, value);
    this.name = 'EscpRangeError';
  }
}

/**
 * Graphics error for image processing failures
 */
export class GraphicsError extends EscpError {
  constructor(
    message: string,
    public readonly operation: string
  ) {
    super(message, 'GRAPHICS_ERROR');
    this.name = 'GraphicsError';
  }
}

/**
 * Encoding error for text/hex conversion failures
 */
export class EncodingError extends EscpError {
  constructor(
    message: string,
    public readonly input: string
  ) {
    super(message, 'ENCODING_ERROR');
    this.name = 'EncodingError';
  }
}

/**
 * Configuration error for invalid printer settings
 */
export class ConfigurationError extends EscpError {
  constructor(
    message: string,
    public readonly setting: string
  ) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}
