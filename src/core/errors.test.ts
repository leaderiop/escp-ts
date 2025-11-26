import { describe, it, expect } from 'vitest';
import {
  EscpError,
  ValidationError,
  EscpRangeError,
  GraphicsError,
  EncodingError,
  ConfigurationError,
} from './errors';

describe('EscpError', () => {
  it('should create an error with message and code', () => {
    const error = new EscpError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('EscpError');
  });

  it('should be an instance of Error', () => {
    const error = new EscpError('Test', 'CODE');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(EscpError);
  });

  it('should have a proper stack trace', () => {
    const error = new EscpError('Test', 'CODE');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('EscpError');
  });
});

describe('ValidationError', () => {
  it('should create an error with parameter and value', () => {
    const error = new ValidationError('Invalid value', 'testParam', 42);
    expect(error.message).toBe('Invalid value');
    expect(error.parameter).toBe('testParam');
    expect(error.value).toBe(42);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });

  it('should extend EscpError', () => {
    const error = new ValidationError('Test', 'param', null);
    expect(error).toBeInstanceOf(EscpError);
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should handle different value types', () => {
    const stringError = new ValidationError('Test', 'param', 'string value');
    expect(stringError.value).toBe('string value');

    const objectError = new ValidationError('Test', 'param', { key: 'value' });
    expect(objectError.value).toEqual({ key: 'value' });

    const nullError = new ValidationError('Test', 'param', null);
    expect(nullError.value).toBeNull();

    const undefinedError = new ValidationError('Test', 'param', undefined);
    expect(undefinedError.value).toBeUndefined();
  });
});

describe('EscpRangeError', () => {
  it('should create an error with min/max bounds', () => {
    const error = new EscpRangeError('lineSpacing', 300, 0, 255);
    expect(error.message).toBe('lineSpacing must be between 0 and 255, got 300');
    expect(error.parameter).toBe('lineSpacing');
    expect(error.value).toBe(300);
    expect(error.min).toBe(0);
    expect(error.max).toBe(255);
    expect(error.name).toBe('EscpRangeError');
  });

  it('should extend ValidationError', () => {
    const error = new EscpRangeError('test', 100, 0, 50);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(EscpError);
  });

  it('should format message correctly for negative values', () => {
    const error = new EscpRangeError('offset', -10, 0, 100);
    expect(error.message).toBe('offset must be between 0 and 100, got -10');
  });

  it('should format message correctly for float values', () => {
    const error = new EscpRangeError('value', 3.14159, 0, 1);
    expect(error.message).toContain('3.14159');
  });
});

describe('GraphicsError', () => {
  it('should create an error with operation name', () => {
    const error = new GraphicsError('Invalid image dimensions', 'dithering');
    expect(error.message).toBe('Invalid image dimensions');
    expect(error.operation).toBe('dithering');
    expect(error.code).toBe('GRAPHICS_ERROR');
    expect(error.name).toBe('GraphicsError');
  });

  it('should extend EscpError', () => {
    const error = new GraphicsError('Test', 'scale');
    expect(error).toBeInstanceOf(EscpError);
    expect(error).toBeInstanceOf(GraphicsError);
  });

  it('should handle various operation names', () => {
    const ops = ['scale', 'dithering', 'convert', 'stripe'];
    for (const op of ops) {
      const error = new GraphicsError('Test', op);
      expect(error.operation).toBe(op);
    }
  });
});

describe('EncodingError', () => {
  it('should create an error with input string', () => {
    const error = new EncodingError('Invalid hex character', 'GHIJ');
    expect(error.message).toBe('Invalid hex character');
    expect(error.input).toBe('GHIJ');
    expect(error.code).toBe('ENCODING_ERROR');
    expect(error.name).toBe('EncodingError');
  });

  it('should extend EscpError', () => {
    const error = new EncodingError('Test', 'input');
    expect(error).toBeInstanceOf(EscpError);
    expect(error).toBeInstanceOf(EncodingError);
  });

  it('should handle various input strings', () => {
    const inputs = ['', 'short', 'a'.repeat(1000), '特殊文字'];
    for (const input of inputs) {
      const error = new EncodingError('Test', input);
      expect(error.input).toBe(input);
    }
  });
});

describe('ConfigurationError', () => {
  it('should create an error with setting name', () => {
    const error = new ConfigurationError('Invalid CPI value', 'cpi');
    expect(error.message).toBe('Invalid CPI value');
    expect(error.setting).toBe('cpi');
    expect(error.code).toBe('CONFIGURATION_ERROR');
    expect(error.name).toBe('ConfigurationError');
  });

  it('should extend EscpError', () => {
    const error = new ConfigurationError('Test', 'setting');
    expect(error).toBeInstanceOf(EscpError);
    expect(error).toBeInstanceOf(ConfigurationError);
  });

  it('should handle various setting names', () => {
    const settings = ['cpi', 'quality', 'margins', 'paper.width'];
    for (const setting of settings) {
      const error = new ConfigurationError('Test', setting);
      expect(error.setting).toBe(setting);
    }
  });
});

describe('Error inheritance chain', () => {
  it('should maintain proper instanceof relationships', () => {
    const base = new EscpError('Base', 'BASE');
    const validation = new ValidationError('Validation', 'param', 1);
    const range = new EscpRangeError('range', 100, 0, 50);
    const graphics = new GraphicsError('Graphics', 'op');
    const encoding = new EncodingError('Encoding', 'input');
    const config = new ConfigurationError('Config', 'setting');

    // Base error checks
    expect(base).toBeInstanceOf(Error);
    expect(base).toBeInstanceOf(EscpError);

    // ValidationError checks
    expect(validation).toBeInstanceOf(Error);
    expect(validation).toBeInstanceOf(EscpError);
    expect(validation).toBeInstanceOf(ValidationError);

    // EscpRangeError checks
    expect(range).toBeInstanceOf(Error);
    expect(range).toBeInstanceOf(EscpError);
    expect(range).toBeInstanceOf(ValidationError);
    expect(range).toBeInstanceOf(EscpRangeError);

    // Other error checks
    expect(graphics).toBeInstanceOf(EscpError);
    expect(encoding).toBeInstanceOf(EscpError);
    expect(config).toBeInstanceOf(EscpError);
  });

  it('should not cross-match unrelated error types', () => {
    const graphics = new GraphicsError('Test', 'op');
    const encoding = new EncodingError('Test', 'input');
    const config = new ConfigurationError('Test', 'setting');

    expect(graphics).not.toBeInstanceOf(EncodingError);
    expect(graphics).not.toBeInstanceOf(ConfigurationError);
    expect(encoding).not.toBeInstanceOf(GraphicsError);
    expect(encoding).not.toBeInstanceOf(ConfigurationError);
    expect(config).not.toBeInstanceOf(GraphicsError);
    expect(config).not.toBeInstanceOf(EncodingError);
  });
});
