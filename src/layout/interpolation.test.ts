import { describe, it, expect } from 'vitest';
import {
  interpolate,
  parseTemplate,
  resolvePath,
  createFilterRegistry,
  defaultFilters,
} from './interpolation';

describe('interpolation', () => {
  // ==================== PATH RESOLUTION ====================

  describe('resolvePath', () => {
    it('resolves simple paths', () => {
      const data = { name: 'John' };
      expect(resolvePath(data, 'name')).toBe('John');
    });

    it('resolves nested paths', () => {
      const data = { user: { name: 'John', address: { city: 'NYC' } } };
      expect(resolvePath(data, 'user.name')).toBe('John');
      expect(resolvePath(data, 'user.address.city')).toBe('NYC');
    });

    it('resolves array indices', () => {
      const data = { items: ['a', 'b', 'c'] };
      expect(resolvePath(data, 'items[0]')).toBe('a');
      expect(resolvePath(data, 'items[1]')).toBe('b');
    });

    it('resolves nested array paths', () => {
      const data = { orders: [{ id: 1 }, { id: 2 }] };
      expect(resolvePath(data, 'orders[0].id')).toBe(1);
      expect(resolvePath(data, 'orders[1].id')).toBe(2);
    });

    it('returns undefined for missing paths', () => {
      const data = { name: 'John' };
      expect(resolvePath(data, 'missing')).toBeUndefined();
      expect(resolvePath(data, 'name.missing')).toBeUndefined();
    });

    it('handles null/undefined values in path', () => {
      const data = { user: null };
      expect(resolvePath(data, 'user.name')).toBeUndefined();
    });
  });

  // ==================== TEMPLATE PARSING ====================

  describe('parseTemplate', () => {
    it('parses simple variables', () => {
      const expressions = parseTemplate('Hello {{name}}!');
      expect(expressions.length).toBe(1);
      expect(expressions[0]?.path).toBe('name');
      expect(expressions[0]?.match).toBe('{{name}}');
    });

    it('parses multiple variables', () => {
      const expressions = parseTemplate('{{greeting}} {{name}}!');
      expect(expressions.length).toBe(2);
      expect(expressions[0]?.path).toBe('greeting');
      expect(expressions[1]?.path).toBe('name');
    });

    it('parses nested paths', () => {
      const expressions = parseTemplate('{{user.name}}');
      expect(expressions[0]?.path).toBe('user.name');
    });

    it('parses filters', () => {
      const expressions = parseTemplate('{{name | uppercase}}');
      expect(expressions[0]?.filters.length).toBe(1);
      expect(expressions[0]?.filters[0]?.name).toBe('uppercase');
    });

    it('parses filter chains', () => {
      const expressions = parseTemplate('{{name | trim | uppercase}}');
      expect(expressions[0]?.filters.length).toBe(2);
      expect(expressions[0]?.filters[0]?.name).toBe('trim');
      expect(expressions[0]?.filters[1]?.name).toBe('uppercase');
    });

    it('parses filter arguments', () => {
      const expressions = parseTemplate('{{name | truncate:20}}');
      expect(expressions[0]?.filters[0]?.name).toBe('truncate');
      expect(expressions[0]?.filters[0]?.args).toEqual([20]);
    });

    it('parses quoted filter arguments', () => {
      const expressions = parseTemplate('{{price | currency:"$":2}}');
      expect(expressions[0]?.filters[0]?.name).toBe('currency');
      expect(expressions[0]?.filters[0]?.args).toEqual(['$', 2]);
    });

    it('extracts default values', () => {
      const expressions = parseTemplate('{{name | default:"Guest"}}');
      expect(expressions[0]?.defaultValue).toBe('Guest');
    });

    it('returns empty array for no variables', () => {
      const expressions = parseTemplate('Hello World!');
      expect(expressions).toEqual([]);
    });
  });

  // ==================== INTERPOLATION ====================

  describe('interpolate', () => {
    it('interpolates simple variables', () => {
      const result = interpolate('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('interpolates nested paths', () => {
      const data = { user: { name: 'John' } };
      const result = interpolate('Hello {{user.name}}!', data);
      expect(result).toBe('Hello John!');
    });

    it('interpolates multiple variables', () => {
      const data = { greeting: 'Hello', name: 'World' };
      const result = interpolate('{{greeting}} {{name}}!', data);
      expect(result).toBe('Hello World!');
    });

    it('returns empty string for undefined values', () => {
      const result = interpolate('Hello {{name}}!', {});
      expect(result).toBe('Hello !');
    });

    it('applies filters', () => {
      const result = interpolate('{{name | uppercase}}', { name: 'john' });
      expect(result).toBe('JOHN');
    });

    it('applies filter chains', () => {
      const result = interpolate('{{name | trim | uppercase}}', { name: '  john  ' });
      expect(result).toBe('JOHN');
    });

    it('applies filters with arguments', () => {
      const result = interpolate('{{text | truncate:10}}', { text: 'Hello World!' });
      expect(result).toBe('Hello W...');
    });

    it('uses default values', () => {
      const result = interpolate('Hello {{name | default:"Guest"}}!', {});
      expect(result).toBe('Hello Guest!');
    });

    it('returns original template when no variables', () => {
      const result = interpolate('Hello World!', { name: 'Test' });
      expect(result).toBe('Hello World!');
    });
  });

  // ==================== BUILT-IN FILTERS ====================

  describe('built-in filters', () => {
    it('uppercase converts to uppercase', () => {
      expect(interpolate('{{x | uppercase}}', { x: 'hello' })).toBe('HELLO');
    });

    it('lowercase converts to lowercase', () => {
      expect(interpolate('{{x | lowercase}}', { x: 'HELLO' })).toBe('hello');
    });

    it('capitalize capitalizes first letter', () => {
      expect(interpolate('{{x | capitalize}}', { x: 'hello' })).toBe('Hello');
    });

    it('trim removes whitespace', () => {
      expect(interpolate('{{x | trim}}', { x: '  hello  ' })).toBe('hello');
    });

    it('truncate limits length', () => {
      expect(interpolate('{{x | truncate:5}}', { x: 'hello world' })).toBe('he...');
    });

    it('padLeft pads from left', () => {
      expect(interpolate('{{x | padLeft:5:"0"}}', { x: '42' })).toBe('00042');
    });

    it('padRight pads from right', () => {
      expect(interpolate('{{x | padRight:5:"0"}}', { x: '42' })).toBe('42000');
    });

    it('number formats with decimals', () => {
      expect(interpolate('{{x | number:2}}', { x: 3.14159 })).toBe('3.14');
    });

    it('currency formats as currency', () => {
      expect(interpolate('{{x | currency:"$":2}}', { x: 10.5 })).toBe('$10.50');
    });

    it('percent formats as percentage', () => {
      expect(interpolate('{{x | percent:0}}', { x: 0.75 })).toBe('75%');
    });

    it('join joins arrays', () => {
      expect(interpolate('{{x | join:", "}}', { x: ['a', 'b', 'c'] })).toBe('a, b, c');
    });

    it('first gets first element', () => {
      expect(interpolate('{{x | first}}', { x: ['a', 'b', 'c'] })).toBe('a');
    });

    it('last gets last element', () => {
      expect(interpolate('{{x | last}}', { x: ['a', 'b', 'c'] })).toBe('c');
    });

    it('count gets length', () => {
      expect(interpolate('{{x | count}}', { x: ['a', 'b', 'c'] })).toBe('3');
    });

    it('default provides fallback value', () => {
      expect(interpolate('{{x | default:"N/A"}}', { x: undefined })).toBe('N/A');
      expect(interpolate('{{x | default:"N/A"}}', { x: '' })).toBe('N/A');
      expect(interpolate('{{x | default:"N/A"}}', { x: 'value' })).toBe('value');
    });
  });

  // ==================== FILTER REGISTRY ====================

  describe('createFilterRegistry', () => {
    it('creates registry with built-in filters', () => {
      const registry = createFilterRegistry();
      expect(registry.has('uppercase')).toBe(true);
      expect(registry.has('lowercase')).toBe(true);
      expect(registry.has('currency')).toBe(true);
    });

    it('allows custom filter registration', () => {
      const registry = createFilterRegistry();
      registry.register('reverse', (v) => String(v).split('').reverse().join(''));

      expect(registry.has('reverse')).toBe(true);
      const result = interpolate('{{x | reverse}}', { x: 'hello' }, registry);
      expect(result).toBe('olleh');
    });

    it('lists all filters', () => {
      const filters = defaultFilters.list();
      expect(filters).toContain('uppercase');
      expect(filters).toContain('lowercase');
      expect(filters.length).toBeGreaterThan(10);
    });
  });
});
