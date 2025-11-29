/**
 * Shared utility functions for ESC/P2 command generation
 *
 * These utilities are used across multiple modules for byte manipulation
 * and array operations.
 */

/**
 * Create a Uint8Array from a sequence of byte values
 * @param values - Byte values (0-255)
 * @returns Uint8Array containing the values
 *
 * @example
 * ```typescript
 * const cmd = bytes(0x1B, 0x40); // ESC @
 * ```
 */
export function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

/**
 * Concatenate multiple Uint8Arrays into a single array
 * @param arrays - Arrays to concatenate
 * @returns Combined Uint8Array
 *
 * @example
 * ```typescript
 * const result = concat(header, data, footer);
 * ```
 */
export function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Convert a 16-bit value to low byte, high byte format (little-endian)
 * @param value - 16-bit value (0-65535)
 * @returns Tuple of [lowByte, highByte]
 *
 * @example
 * ```typescript
 * const [nL, nH] = toLowHigh(1000); // [232, 3]
 * ```
 */
export function toLowHigh(value: number): [number, number] {
  const clamped = Math.max(0, Math.min(65535, Math.floor(value)));
  return [clamped & 0xff, (clamped >> 8) & 0xff];
}

/**
 * Convert a 32-bit value to 4 bytes in little-endian format
 * @param value - 32-bit value
 * @returns Tuple of 4 bytes [b0, b1, b2, b3]
 *
 * @example
 * ```typescript
 * const [m1, m2, m3, m4] = to32BitLE(100000);
 * ```
 */
export function to32BitLE(value: number): [number, number, number, number] {
  const clamped = Math.max(0, Math.floor(value));
  return [clamped & 0xff, (clamped >> 8) & 0xff, (clamped >> 16) & 0xff, (clamped >> 24) & 0xff];
}
