import { describe, it, expect } from 'vitest';
import {
  assertByte,
  assertRange,
  assertUint16,
  assertValidHex,
  assertPositiveDimensions,
  assertNonNegative,
  assertOneOf,
} from './validation';
import { EscpRangeError, EncodingError, GraphicsError, ValidationError } from './errors';

describe('assertByte', () => {
  it('should accept valid byte values (0-255)', () => {
    expect(() => assertByte(0, 'test')).not.toThrow();
    expect(() => assertByte(1, 'test')).not.toThrow();
    expect(() => assertByte(127, 'test')).not.toThrow();
    expect(() => assertByte(255, 'test')).not.toThrow();
  });

  it('should reject values below 0', () => {
    expect(() => assertByte(-1, 'test')).toThrow(EscpRangeError);
    expect(() => assertByte(-255, 'test')).toThrow(EscpRangeError);
  });

  it('should reject values above 255', () => {
    expect(() => assertByte(256, 'test')).toThrow(EscpRangeError);
    expect(() => assertByte(1000, 'test')).toThrow(EscpRangeError);
  });

  it('should reject non-integer values', () => {
    expect(() => assertByte(1.5, 'test')).toThrow(EscpRangeError);
    expect(() => assertByte(127.9, 'test')).toThrow(EscpRangeError);
  });

  it('should include parameter name in error', () => {
    try {
      assertByte(300, 'lineSpacing');
    } catch (e) {
      expect(e).toBeInstanceOf(EscpRangeError);
      expect((e as EscpRangeError).parameter).toBe('lineSpacing');
    }
  });
});

describe('assertRange', () => {
  it('should accept values within range', () => {
    expect(() => assertRange(5, 0, 10, 'test')).not.toThrow();
    expect(() => assertRange(0, 0, 10, 'test')).not.toThrow();
    expect(() => assertRange(10, 0, 10, 'test')).not.toThrow();
  });

  it('should accept negative ranges', () => {
    expect(() => assertRange(-5, -10, 0, 'test')).not.toThrow();
    expect(() => assertRange(-10, -10, 0, 'test')).not.toThrow();
    expect(() => assertRange(0, -10, 0, 'test')).not.toThrow();
  });

  it('should reject values below minimum', () => {
    expect(() => assertRange(-1, 0, 10, 'test')).toThrow(EscpRangeError);
    expect(() => assertRange(-11, -10, 0, 'test')).toThrow(EscpRangeError);
  });

  it('should reject values above maximum', () => {
    expect(() => assertRange(11, 0, 10, 'test')).toThrow(EscpRangeError);
    expect(() => assertRange(1, -10, 0, 'test')).toThrow(EscpRangeError);
  });

  it('should reject non-integer values', () => {
    expect(() => assertRange(5.5, 0, 10, 'test')).toThrow(EscpRangeError);
  });

  it('should include min/max in error', () => {
    try {
      assertRange(100, 0, 50, 'value');
    } catch (e) {
      expect(e).toBeInstanceOf(EscpRangeError);
      const rangeError = e as EscpRangeError;
      expect(rangeError.min).toBe(0);
      expect(rangeError.max).toBe(50);
      expect(rangeError.value).toBe(100);
    }
  });
});

describe('assertUint16', () => {
  it('should accept valid 16-bit unsigned values (0-65535)', () => {
    expect(() => assertUint16(0, 'test')).not.toThrow();
    expect(() => assertUint16(1, 'test')).not.toThrow();
    expect(() => assertUint16(32767, 'test')).not.toThrow();
    expect(() => assertUint16(65535, 'test')).not.toThrow();
  });

  it('should reject values below 0', () => {
    expect(() => assertUint16(-1, 'test')).toThrow(EscpRangeError);
    expect(() => assertUint16(-1000, 'test')).toThrow(EscpRangeError);
  });

  it('should reject values above 65535', () => {
    expect(() => assertUint16(65536, 'test')).toThrow(EscpRangeError);
    expect(() => assertUint16(100000, 'test')).toThrow(EscpRangeError);
  });

  it('should reject non-integer values', () => {
    expect(() => assertUint16(1.5, 'test')).toThrow(EscpRangeError);
    expect(() => assertUint16(1000.1, 'test')).toThrow(EscpRangeError);
  });
});

describe('assertValidHex', () => {
  it('should accept valid hex strings', () => {
    expect(() => assertValidHex('1B40')).not.toThrow();
    expect(() => assertValidHex('1b40')).not.toThrow();
    expect(() => assertValidHex('ABCDEF')).not.toThrow();
    expect(() => assertValidHex('abcdef')).not.toThrow();
    expect(() => assertValidHex('0123456789')).not.toThrow();
    expect(() => assertValidHex('')).not.toThrow(); // Empty is valid
  });

  it('should accept hex strings with whitespace', () => {
    expect(() => assertValidHex('1B 40')).not.toThrow();
    expect(() => assertValidHex('1B  40')).not.toThrow();
    expect(() => assertValidHex(' 1B40 ')).not.toThrow();
  });

  it('should reject odd-length hex strings', () => {
    expect(() => assertValidHex('1B4')).toThrow(EncodingError);
    expect(() => assertValidHex('ABC')).toThrow(EncodingError);
    expect(() => assertValidHex('1')).toThrow(EncodingError);
  });

  it('should reject invalid hex characters', () => {
    expect(() => assertValidHex('1BGH')).toThrow(EncodingError);
    expect(() => assertValidHex('GHIJ')).toThrow(EncodingError);
    expect(() => assertValidHex('12ZZ')).toThrow(EncodingError);
  });

  it('should include input in error', () => {
    try {
      assertValidHex('GHIJ');
    } catch (e) {
      expect(e).toBeInstanceOf(EncodingError);
      expect((e as EncodingError).input).toBe('GHIJ');
    }
  });
});

describe('assertPositiveDimensions', () => {
  it('should accept positive dimensions', () => {
    expect(() => assertPositiveDimensions(1, 1, 'test')).not.toThrow();
    expect(() => assertPositiveDimensions(100, 200, 'test')).not.toThrow();
    expect(() => assertPositiveDimensions(1000, 1000, 'test')).not.toThrow();
  });

  it('should reject zero width', () => {
    expect(() => assertPositiveDimensions(0, 100, 'test')).toThrow(GraphicsError);
  });

  it('should reject zero height', () => {
    expect(() => assertPositiveDimensions(100, 0, 'test')).toThrow(GraphicsError);
  });

  it('should reject negative width', () => {
    expect(() => assertPositiveDimensions(-1, 100, 'test')).toThrow(GraphicsError);
  });

  it('should reject negative height', () => {
    expect(() => assertPositiveDimensions(100, -1, 'test')).toThrow(GraphicsError);
  });

  it('should reject non-integer width', () => {
    expect(() => assertPositiveDimensions(100.5, 100, 'test')).toThrow(GraphicsError);
  });

  it('should reject non-integer height', () => {
    expect(() => assertPositiveDimensions(100, 100.5, 'test')).toThrow(GraphicsError);
  });

  it('should include operation name in error', () => {
    try {
      assertPositiveDimensions(0, 100, 'scaling');
    } catch (e) {
      expect(e).toBeInstanceOf(GraphicsError);
      expect((e as GraphicsError).operation).toBe('scaling');
    }
  });
});

describe('assertNonNegative', () => {
  it('should accept zero', () => {
    expect(() => assertNonNegative(0, 'test')).not.toThrow();
  });

  it('should accept positive values', () => {
    expect(() => assertNonNegative(1, 'test')).not.toThrow();
    expect(() => assertNonNegative(100, 'test')).not.toThrow();
    expect(() => assertNonNegative(0.5, 'test')).not.toThrow();
  });

  it('should reject negative values', () => {
    expect(() => assertNonNegative(-1, 'test')).toThrow(ValidationError);
    expect(() => assertNonNegative(-0.1, 'test')).toThrow(ValidationError);
    expect(() => assertNonNegative(-100, 'test')).toThrow(ValidationError);
  });

  it('should include parameter name in error', () => {
    try {
      assertNonNegative(-5, 'margin');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).parameter).toBe('margin');
      expect((e as ValidationError).value).toBe(-5);
    }
  });
});

describe('assertOneOf', () => {
  it('should accept values in the allowed list', () => {
    const allowed = [10, 12, 15, 17, 20] as const;
    expect(() => assertOneOf(10, allowed, 'cpi')).not.toThrow();
    expect(() => assertOneOf(12, allowed, 'cpi')).not.toThrow();
    expect(() => assertOneOf(15, allowed, 'cpi')).not.toThrow();
    expect(() => assertOneOf(17, allowed, 'cpi')).not.toThrow();
    expect(() => assertOneOf(20, allowed, 'cpi')).not.toThrow();
  });

  it('should reject values not in the allowed list', () => {
    const allowed = [10, 12, 15, 17, 20] as const;
    expect(() => assertOneOf(11, allowed, 'cpi')).toThrow(ValidationError);
    expect(() => assertOneOf(0, allowed, 'cpi')).toThrow(ValidationError);
    expect(() => assertOneOf(100, allowed, 'cpi')).toThrow(ValidationError);
  });

  it('should work with string values', () => {
    const allowed = ['left', 'center', 'right'] as const;
    expect(() => assertOneOf('left', allowed, 'align')).not.toThrow();
    expect(() => assertOneOf('center', allowed, 'align')).not.toThrow();
    expect(() => assertOneOf('right', allowed, 'align')).not.toThrow();
    expect(() => assertOneOf('justify', allowed, 'align')).toThrow(ValidationError);
  });

  it('should include allowed values in error message', () => {
    const allowed = [1, 2, 3] as const;
    try {
      assertOneOf(5, allowed, 'value');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).message).toContain('1');
      expect((e as ValidationError).message).toContain('2');
      expect((e as ValidationError).message).toContain('3');
    }
  });
});

describe('Edge cases', () => {
  it('should handle NaN values', () => {
    expect(() => assertByte(NaN, 'test')).toThrow(EscpRangeError);
    expect(() => assertRange(NaN, 0, 10, 'test')).toThrow(EscpRangeError);
    expect(() => assertUint16(NaN, 'test')).toThrow(EscpRangeError);
  });

  it('should handle Infinity values', () => {
    expect(() => assertByte(Infinity, 'test')).toThrow(EscpRangeError);
    expect(() => assertByte(-Infinity, 'test')).toThrow(EscpRangeError);
    expect(() => assertRange(Infinity, 0, 10, 'test')).toThrow(EscpRangeError);
    expect(() => assertUint16(Infinity, 'test')).toThrow(EscpRangeError);
  });

  it('should handle boundary values precisely', () => {
    // Exactly at boundaries should pass
    expect(() => assertByte(0, 'test')).not.toThrow();
    expect(() => assertByte(255, 'test')).not.toThrow();
    expect(() => assertUint16(0, 'test')).not.toThrow();
    expect(() => assertUint16(65535, 'test')).not.toThrow();

    // Just outside boundaries should fail
    expect(() => assertByte(-0.0001, 'test')).toThrow();
    expect(() => assertByte(255.0001, 'test')).toThrow();
  });
});
