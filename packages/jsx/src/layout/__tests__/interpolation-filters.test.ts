/**
 * Tests for Template Interpolation - Built-in Filters
 *
 * Comprehensive tests for all built-in filter functions
 */

import { describe, it, expect } from 'vitest';
import {
  interpolate,
  parseTemplate,
  resolvePath,
  defaultFilters,
  createFilterRegistry,
} from '../interpolation';

describe('Built-in Filters', () => {
  describe('uppercase filter', () => {
    it('should convert string to uppercase', () => {
      expect(interpolate('{{name | uppercase}}', { name: 'hello' })).toBe('HELLO');
    });

    it('should handle mixed case', () => {
      expect(interpolate('{{name | uppercase}}', { name: 'HeLLo WoRLd' })).toBe('HELLO WORLD');
    });

    it('should handle numbers', () => {
      expect(interpolate('{{val | uppercase}}', { val: 123 })).toBe('123');
    });
  });

  describe('lowercase filter', () => {
    it('should convert string to lowercase', () => {
      expect(interpolate('{{name | lowercase}}', { name: 'HELLO' })).toBe('hello');
    });

    it('should handle mixed case', () => {
      expect(interpolate('{{name | lowercase}}', { name: 'HeLLo WoRLd' })).toBe('hello world');
    });
  });

  describe('capitalize filter', () => {
    it('should capitalize first letter', () => {
      expect(interpolate('{{name | capitalize}}', { name: 'hello' })).toBe('Hello');
    });

    it('should lowercase the rest', () => {
      expect(interpolate('{{name | capitalize}}', { name: 'HELLO' })).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(interpolate('{{name | capitalize}}', { name: 'h' })).toBe('H');
    });

    it('should handle empty string', () => {
      expect(interpolate('{{name | capitalize}}', { name: '' })).toBe('');
    });
  });

  describe('trim filter', () => {
    it('should trim whitespace', () => {
      expect(interpolate('{{name | trim}}', { name: '  hello  ' })).toBe('hello');
    });

    it('should handle tabs and newlines', () => {
      expect(interpolate('{{name | trim}}', { name: '\n\thello\t\n' })).toBe('hello');
    });
  });

  describe('truncate filter', () => {
    it('should truncate long text', () => {
      expect(interpolate('{{text | truncate:10}}', { text: 'hello world' })).toBe('hello w...');
    });

    it('should not truncate short text', () => {
      expect(interpolate('{{text | truncate:20}}', { text: 'hello' })).toBe('hello');
    });

    it('should use custom suffix', () => {
      expect(interpolate('{{text | truncate:8:"!"}}', { text: 'hello world' })).toBe('hello w!');
    });

    it('should handle exact length', () => {
      expect(interpolate('{{text | truncate:5}}', { text: 'hello' })).toBe('hello');
    });

    it('should use default length of 20', () => {
      const longText = 'a'.repeat(25);
      expect(interpolate('{{text | truncate}}', { text: longText })).toBe('a'.repeat(17) + '...');
    });
  });

  describe('padLeft filter', () => {
    it('should pad on the left', () => {
      expect(interpolate('{{num | padLeft:5:"0"}}', { num: '42' })).toBe('00042');
    });

    it('should use default space padding', () => {
      expect(interpolate('{{num | padLeft:5}}', { num: '42' })).toBe('   42');
    });

    it('should use default length of 10', () => {
      expect(interpolate('{{num | padLeft}}', { num: '42' })).toBe('        42');
    });
  });

  describe('padRight filter', () => {
    it('should pad on the right', () => {
      expect(interpolate('{{text | padRight:10:"-"}}', { text: 'hello' })).toBe('hello-----');
    });

    it('should use default space padding', () => {
      expect(interpolate('{{text | padRight:10}}', { text: 'hello' })).toBe('hello     ');
    });
  });

  describe('number filter', () => {
    it('should format number with decimal places', () => {
      expect(interpolate('{{val | number:2}}', { val: 3.14159 })).toBe('3.14');
    });

    it('should use default 2 decimal places', () => {
      expect(interpolate('{{val | number}}', { val: 3.14159 })).toBe('3.14');
    });

    it('should handle integers', () => {
      expect(interpolate('{{val | number:2}}', { val: 42 })).toBe('42.00');
    });

    it('should return original value for NaN', () => {
      expect(interpolate('{{val | number}}', { val: 'not a number' })).toBe('not a number');
    });
  });

  describe('currency filter', () => {
    it('should format as currency', () => {
      expect(interpolate('{{price | currency}}', { price: 99.9 })).toBe('$99.90');
    });

    it('should use custom symbol', () => {
      expect(interpolate('{{price | currency:"EUR "}}', { price: 99.9 })).toBe('EUR 99.90');
    });

    it('should use custom decimal places', () => {
      expect(interpolate('{{price | currency:"$":0}}', { price: 99.9 })).toBe('$100');
    });

    it('should return original value for NaN', () => {
      expect(interpolate('{{price | currency}}', { price: 'free' })).toBe('free');
    });
  });

  describe('percent filter', () => {
    it('should format as percentage', () => {
      expect(interpolate('{{val | percent}}', { val: 0.5 })).toBe('50%');
    });

    it('should use custom decimal places', () => {
      expect(interpolate('{{val | percent:2}}', { val: 0.12345 })).toBe('12.35%');
    });

    it('should return original value for NaN', () => {
      expect(interpolate('{{val | percent}}', { val: 'n/a' })).toBe('n/a');
    });
  });

  describe('date filter', () => {
    it('should format date with default format', () => {
      const date = new Date(2024, 0, 15);
      expect(interpolate('{{d | date}}', { d: date })).toBe('2024-01-15');
    });

    it('should format date with custom format', () => {
      const date = new Date(2024, 5, 20, 14, 30, 45);
      expect(interpolate('{{d | date:"DD/MM/YYYY HH:mm:ss"}}', { d: date })).toBe(
        '20/06/2024 14:30:45'
      );
    });

    it('should parse date string', () => {
      expect(interpolate('{{d | date:"YYYY"}}', { d: '2024-06-15' })).toBe('2024');
    });

    it('should return original value for invalid date', () => {
      expect(interpolate('{{d | date}}', { d: 'not a date' })).toBe('not a date');
    });

    it('should handle Date object', () => {
      const date = new Date(2024, 11, 25);
      expect(interpolate('{{d | date:"MM-DD"}}', { d: date })).toBe('12-25');
    });
  });

  describe('join filter', () => {
    it('should join array with separator', () => {
      expect(interpolate('{{items | join}}', { items: ['a', 'b', 'c'] })).toBe('a, b, c');
    });

    it('should use custom separator', () => {
      expect(interpolate('{{items | join:" - "}}', { items: ['a', 'b', 'c'] })).toBe('a - b - c');
    });

    it('should handle non-array', () => {
      expect(interpolate('{{val | join}}', { val: 'hello' })).toBe('hello');
    });
  });

  describe('first filter', () => {
    it('should get first array element', () => {
      expect(interpolate('{{items | first}}', { items: ['a', 'b', 'c'] })).toBe('a');
    });

    it('should get first string character', () => {
      expect(interpolate('{{text | first}}', { text: 'hello' })).toBe('h');
    });

    it('should handle empty array', () => {
      expect(interpolate('{{items | first}}', { items: [] })).toBe('');
    });
  });

  describe('last filter', () => {
    it('should get last array element', () => {
      expect(interpolate('{{items | last}}', { items: ['a', 'b', 'c'] })).toBe('c');
    });

    it('should get last string character', () => {
      expect(interpolate('{{text | last}}', { text: 'hello' })).toBe('o');
    });

    it('should handle empty array', () => {
      expect(interpolate('{{items | last}}', { items: [] })).toBe('');
    });
  });

  describe('count filter', () => {
    it('should count array elements', () => {
      expect(interpolate('{{items | count}}', { items: ['a', 'b', 'c'] })).toBe('3');
    });

    it('should count string length', () => {
      expect(interpolate('{{text | count}}', { text: 'hello' })).toBe('5');
    });
  });

  describe('default filter', () => {
    it('should use default for undefined', () => {
      expect(interpolate('{{val | default:"N/A"}}', { val: undefined })).toBe('N/A');
    });

    it('should use default for null', () => {
      expect(interpolate('{{val | default:"N/A"}}', { val: null })).toBe('N/A');
    });

    it('should use default for empty string', () => {
      expect(interpolate('{{val | default:"N/A"}}', { val: '' })).toBe('N/A');
    });

    it('should not use default for falsy but non-empty values', () => {
      expect(interpolate('{{val | default:"N/A"}}', { val: 0 })).toBe('0');
      expect(interpolate('{{val | default:"N/A"}}', { val: false })).toBe('false');
    });

    it('should use empty string as default', () => {
      expect(interpolate('{{val | default}}', { val: undefined })).toBe('');
    });
  });
});

describe('resolvePath', () => {
  it('should resolve simple path', () => {
    expect(resolvePath({ name: 'John' }, 'name')).toBe('John');
  });

  it('should resolve nested path', () => {
    expect(resolvePath({ user: { name: 'John' } }, 'user.name')).toBe('John');
  });

  it('should resolve array index', () => {
    expect(resolvePath({ items: ['a', 'b', 'c'] }, 'items[1]')).toBe('b');
  });

  it('should resolve nested array access', () => {
    expect(resolvePath({ users: [{ name: 'John' }] }, 'users[0].name')).toBe('John');
  });

  it('should return undefined for missing path', () => {
    expect(resolvePath({ name: 'John' }, 'age')).toBeUndefined();
  });

  it('should return undefined for null in path', () => {
    expect(resolvePath({ user: null }, 'user.name')).toBeUndefined();
  });

  it('should handle empty path', () => {
    expect(resolvePath({ name: 'John' }, '')).toBeUndefined();
  });

  it('should handle empty data', () => {
    expect(resolvePath({}, 'name')).toBeUndefined();
  });

  it('should handle non-object values in path', () => {
    expect(resolvePath({ name: 'John' }, 'name.first')).toBeUndefined();
  });
});

describe('parseTemplate', () => {
  it('should return empty array for no templates', () => {
    expect(parseTemplate('Hello World')).toEqual([]);
  });

  it('should parse simple variable', () => {
    const result = parseTemplate('{{name}}');
    expect(result).toHaveLength(1);
    expect(result[0]!.path).toBe('name');
    expect(result[0]!.filters).toEqual([]);
  });

  it('should parse variable with filter', () => {
    const result = parseTemplate('{{name | uppercase}}');
    expect(result[0]!.filters[0]!.name).toBe('uppercase');
  });

  it('should parse multiple variables', () => {
    const result = parseTemplate('{{first}} {{last}}');
    expect(result).toHaveLength(2);
    expect(result[0]!.path).toBe('first');
    expect(result[1]!.path).toBe('last');
  });

  it('should extract default value', () => {
    const result = parseTemplate('{{name | default:"Unknown"}}');
    expect(result[0]!.defaultValue).toBe('Unknown');
  });
});

describe('createFilterRegistry', () => {
  it('should create a registry with all built-in filters', () => {
    const registry = createFilterRegistry();
    expect(registry.has('uppercase')).toBe(true);
    expect(registry.has('lowercase')).toBe(true);
    expect(registry.has('capitalize')).toBe(true);
    expect(registry.has('trim')).toBe(true);
    expect(registry.has('truncate')).toBe(true);
    expect(registry.has('padLeft')).toBe(true);
    expect(registry.has('padRight')).toBe(true);
    expect(registry.has('number')).toBe(true);
    expect(registry.has('currency')).toBe(true);
    expect(registry.has('percent')).toBe(true);
    expect(registry.has('date')).toBe(true);
    expect(registry.has('join')).toBe(true);
    expect(registry.has('first')).toBe(true);
    expect(registry.has('last')).toBe(true);
    expect(registry.has('count')).toBe(true);
    expect(registry.has('default')).toBe(true);
  });

  it('should allow registering custom filters', () => {
    const registry = createFilterRegistry();
    registry.register('reverse', (val) => String(val).split('').reverse().join(''));
    expect(registry.has('reverse')).toBe(true);
    expect(registry.get('reverse')!('hello')).toBe('olleh');
  });

  it('should list all filter names', () => {
    const registry = createFilterRegistry();
    const names = registry.list();
    expect(names).toContain('uppercase');
    expect(names).toContain('default');
    expect(names.length).toBeGreaterThanOrEqual(16);
  });
});

describe('defaultFilters', () => {
  it('should be a pre-created registry', () => {
    expect(defaultFilters.has('uppercase')).toBe(true);
    expect(defaultFilters.has('default')).toBe(true);
  });
});

describe('interpolate with options', () => {
  it('should warn on unknown filter by default', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    interpolate('{{val | unknownFilter}}', { val: 'test' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown filter "unknownFilter"'));
    warnSpy.mockRestore();
  });

  it('should not warn when warnOnUnknownFilter is false', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    interpolate('{{val | unknownFilter}}', { val: 'test' }, defaultFilters, {
      warnOnUnknownFilter: false,
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('interpolate edge cases', () => {
  it('should return original string if no templates', () => {
    expect(interpolate('Hello World', {})).toBe('Hello World');
  });

  it('should handle undefined value without default', () => {
    expect(interpolate('Hello {{name}}', {})).toBe('Hello ');
  });

  it('should handle null value without default', () => {
    expect(interpolate('Hello {{name}}', { name: null })).toBe('Hello ');
  });

  it('should chain multiple filters', () => {
    expect(interpolate('{{name | trim | uppercase}}', { name: '  hello  ' })).toBe('HELLO');
  });

  it('should use defaultValue when value is undefined', () => {
    const result = parseTemplate('{{missing | default:"fallback"}}');
    expect(result[0]!.defaultValue).toBe('fallback');

    const interpolated = interpolate('{{missing | default:"fallback"}}', {});
    expect(interpolated).toBe('fallback');
  });
});

// Import vi for mocking
import { vi } from 'vitest';
