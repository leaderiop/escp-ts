/**
 * Tests for Template Interpolation - Filter Parser Edge Cases
 *
 * These tests target Blackhole #3: Filter parser bugs with:
 * - Colons inside quoted strings
 * - Escaped quotes
 * - Empty string arguments
 */

import { describe, it, expect } from 'vitest';
import { parseTemplate, interpolate } from '../interpolation';

describe('parseFilter edge cases', () => {
  describe('colons inside quotes', () => {
    it('should handle colon in double-quoted arg', () => {
      const result = parseTemplate('{{time | format:"HH:mm:ss"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['HH:mm:ss']);
    });

    it('should handle colon in single-quoted arg', () => {
      const result = parseTemplate("{{time | format:'HH:mm:ss'}}");
      expect(result[0]!.filters[0]!.args).toEqual(['HH:mm:ss']);
    });

    it('should handle URL with port', () => {
      const result = parseTemplate('{{link | prefix:"https://example.com:8080"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['https://example.com:8080']);
    });

    it('should handle multiple colons in quoted arg', () => {
      const result = parseTemplate('{{val | format:"a:b:c:d"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['a:b:c:d']);
    });

    it('should handle time format with trailing text', () => {
      const result = parseTemplate('{{date | format:"HH:mm:ss.SSS"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['HH:mm:ss.SSS']);
    });
  });

  describe('escaped quotes', () => {
    it('should handle escaped double quotes', () => {
      const result = parseTemplate('{{name | default:"Say \\"Hello\\""}}');
      expect(result[0]!.filters[0]!.args).toEqual(['Say "Hello"']);
    });

    it('should handle escaped single quotes', () => {
      const result = parseTemplate("{{name | default:'It\\'s fine'}}");
      expect(result[0]!.filters[0]!.args).toEqual(["It's fine"]);
    });

    it('should handle escaped backslash', () => {
      const result = parseTemplate('{{path | default:"C:\\\\Users"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['C:\\Users']);
    });

    it('should handle escaped backslash before quote', () => {
      const result = parseTemplate('{{val | wrap:"\\\\"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['\\']);
    });

    it('should handle multiple escaped sequences', () => {
      const result = parseTemplate('{{val | format:"line1\\nline2\\ttab"}}');
      // Note: We're testing that \n and \t are preserved literally, not interpreted
      expect(result[0]!.filters[0]!.args).toEqual(['line1nline2ttab']);
    });
  });

  describe('empty strings', () => {
    it('should preserve empty double-quoted string', () => {
      const result = parseTemplate('{{name | default:""}}');
      expect(result[0]!.filters[0]!.args).toEqual(['']);
    });

    it('should preserve empty single-quoted string', () => {
      const result = parseTemplate("{{name | default:''}}");
      expect(result[0]!.filters[0]!.args).toEqual(['']);
    });

    it('should handle empty string between args', () => {
      const result = parseTemplate('{{val | fn:"a":"":"b"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['a', '', 'b']);
    });

    it('should handle empty string as first arg', () => {
      const result = parseTemplate('{{val | wrap:"":"suffix"}}');
      expect(result[0]!.filters[0]!.args).toEqual(['', 'suffix']);
    });

    it('should handle empty string as last arg', () => {
      const result = parseTemplate('{{val | wrap:"prefix":""}}');
      expect(result[0]!.filters[0]!.args).toEqual(['prefix', '']);
    });

    it('should handle multiple consecutive empty strings', () => {
      const result = parseTemplate('{{val | fn:"":"":""}}');
      expect(result[0]!.filters[0]!.args).toEqual(['', '', '']);
    });
  });

  describe('mixed scenarios', () => {
    it('should parse currency:"$":2 correctly', () => {
      const result = parseTemplate('{{price | currency:"$":2}}');
      expect(result[0]!.filters[0]).toEqual({ name: 'currency', args: ['$', 2] });
    });

    it('should handle filter chain with complex args', () => {
      const result = parseTemplate('{{val | format:"HH:mm" | wrap:"[":"]"}}');
      expect(result[0]!.filters).toHaveLength(2);
      expect(result[0]!.filters[0]!.args).toEqual(['HH:mm']);
      expect(result[0]!.filters[1]!.args).toEqual(['[', ']']);
    });

    it('should handle numeric args after quoted args', () => {
      const result = parseTemplate('{{val | fn:"text":42:3.14}}');
      expect(result[0]!.filters[0]!.args).toEqual(['text', 42, 3.14]);
    });

    it('should handle quoted arg after numeric arg', () => {
      const result = parseTemplate('{{val | fn:42:"text"}}');
      expect(result[0]!.filters[0]!.args).toEqual([42, 'text']);
    });

    it('should handle escaped quote with colon', () => {
      const result = parseTemplate('{{val | format:"say:\\"hi\\""}}');
      expect(result[0]!.filters[0]!.args).toEqual(['say:"hi"']);
    });

    it('should handle complex date format with all edge cases', () => {
      // ISO date format with escaped single quotes for the T separator
      const result = parseTemplate('{{date | format:"YYYY-MM-DD\'T\'HH:mm:ss"}}');
      expect(result[0]!.filters[0]!.args).toEqual(["YYYY-MM-DD'T'HH:mm:ss"]);
    });
  });

  describe('integration with interpolate', () => {
    it('should interpolate with colon in format', () => {
      const result = interpolate('{{val | default:"12:00:00"}}', { val: undefined });
      expect(result).toBe('12:00:00');
    });

    it('should interpolate with empty string default', () => {
      const result = interpolate('{{val | default:""}}', { val: undefined });
      expect(result).toBe('');
    });

    it('should interpolate with escaped quotes in default', () => {
      const result = interpolate('{{val | default:"He said \\"yes\\""}}', { val: undefined });
      expect(result).toBe('He said "yes"');
    });

    it('should apply currency filter with symbol containing special chars', () => {
      // The currency filter should work with the parsed "$" symbol
      const result = interpolate('{{price | currency:"$":2}}', { price: 99.9 });
      expect(result).toBe('$99.90');
    });
  });

  describe('existing functionality preserved', () => {
    it('should parse simple filter without args', () => {
      const result = parseTemplate('{{name | uppercase}}');
      expect(result[0]!.filters[0]).toEqual({ name: 'uppercase', args: [] });
    });

    it('should parse filter with unquoted numeric arg', () => {
      const result = parseTemplate('{{text | truncate:20}}');
      expect(result[0]!.filters[0]).toEqual({ name: 'truncate', args: [20] });
    });

    it('should parse multiple filters in chain', () => {
      const result = parseTemplate('{{name | trim | uppercase | truncate:10}}');
      expect(result[0]!.filters).toHaveLength(3);
      expect(result[0]!.filters[0]!.name).toBe('trim');
      expect(result[0]!.filters[1]!.name).toBe('uppercase');
      expect(result[0]!.filters[2]!.name).toBe('truncate');
    });

    it('should handle path resolution correctly', () => {
      const result = parseTemplate('{{user.name | uppercase}}');
      expect(result[0]!.path).toBe('user.name');
    });
  });
});
