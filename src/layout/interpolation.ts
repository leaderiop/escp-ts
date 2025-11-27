/**
 * Template Interpolation Engine for ESC/P2 Layout System
 *
 * Provides {{variable}} syntax for dynamic text content in layouts.
 * Supports nested paths, filters, and default values.
 */

// ==================== TYPES ====================

/**
 * Parsed variable expression from a template string
 */
export interface VariableExpression {
  /** Full match including braces (e.g., "{{name}}") */
  match: string;
  /** Variable path (e.g., "user.name", "items[0].price") */
  path: string;
  /** Filter chain to apply (e.g., [{name: "uppercase"}, {name: "truncate", args: [20]}]) */
  filters: FilterCall[];
  /** Default value if variable is undefined */
  defaultValue?: string;
}

/**
 * A filter call with name and optional arguments
 */
export interface FilterCall {
  name: string;
  args: unknown[];
}

/**
 * Filter function signature
 * First argument is the value to transform, rest are filter arguments
 */
export type FilterFunction = (value: unknown, ...args: unknown[]) => string;

/**
 * Registry of filter functions
 */
export interface FilterRegistry {
  /** Get a filter by name */
  get(name: string): FilterFunction | undefined;
  /** Check if filter exists */
  has(name: string): boolean;
  /** Register a custom filter */
  register(name: string, fn: FilterFunction): void;
  /** List all registered filter names */
  list(): string[];
}

// ==================== PATH RESOLUTION ====================

/**
 * Resolve a path like "user.name" or "items[0].price" from a data object
 *
 * @param data - The data object to resolve from
 * @param path - Dot/bracket notation path (e.g., "user.name", "items[0].price")
 * @returns The resolved value, or undefined if path doesn't exist
 *
 * @example
 * ```typescript
 * const data = { user: { name: 'John' }, items: [{ price: 10 }] };
 * resolvePath(data, 'user.name'); // 'John'
 * resolvePath(data, 'items[0].price'); // 10
 * resolvePath(data, 'missing.path'); // undefined
 * ```
 */
export function resolvePath(data: Record<string, unknown>, path: string): unknown {
  if (!path || !data) return undefined;

  // Normalize array access: "items[0]" -> "items.0"
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalizedPath.split('.');

  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// ==================== TEMPLATE PARSING ====================

/**
 * Regex to match {{variable}} or {{variable | filter}} patterns
 * Supports:
 * - Simple: {{name}}
 * - Nested: {{user.name}}
 * - Array: {{items[0].price}}
 * - Filters: {{name | uppercase}}
 * - Filter chain: {{name | uppercase | truncate:20}}
 * - Filter args: {{price | currency:"$":2}}
 * - Default: {{name | default:"Unknown"}}
 */
const TEMPLATE_REGEX = /\{\{\s*(.+?)\s*\}\}/g;

/**
 * Parse a filter expression like "uppercase" or "truncate:20" or "currency:'$':2"
 */
function parseFilter(filterExpr: string): FilterCall {
  const trimmed = filterExpr.trim();
  const colonIndex = trimmed.indexOf(':');

  if (colonIndex === -1) {
    return { name: trimmed, args: [] };
  }

  const name = trimmed.slice(0, colonIndex).trim();
  const argsStr = trimmed.slice(colonIndex + 1);

  // Parse arguments (handles "arg1":"arg2" or 'arg1':'arg2' or arg1:arg2)
  const args: unknown[] = [];
  let current = '';
  let inQuote: string | null = null;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr.charAt(i);

    if (inQuote) {
      if (char === inQuote) {
        args.push(current);
        current = '';
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (char === ':') {
      if (current.trim()) {
        // Try to parse as number
        const num = Number(current.trim());
        args.push(isNaN(num) ? current.trim() : num);
      }
      current = '';
    } else {
      current += char;
    }
  }

  // Handle last argument
  if (current.trim()) {
    const num = Number(current.trim());
    args.push(isNaN(num) ? current.trim() : num);
  }

  return { name, args };
}

/**
 * Parse a template string and extract all variable expressions
 *
 * @param template - Template string with {{variable}} placeholders
 * @returns Array of parsed variable expressions
 *
 * @example
 * ```typescript
 * parseTemplate('Hello {{name | uppercase}}!');
 * // Returns: [{ match: '{{name | uppercase}}', path: 'name', filters: [{name: 'uppercase', args: []}] }]
 * ```
 */
export function parseTemplate(template: string): VariableExpression[] {
  const expressions: VariableExpression[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  TEMPLATE_REGEX.lastIndex = 0;

  while ((match = TEMPLATE_REGEX.exec(template)) !== null) {
    const [fullMatch, content] = match;
    if (!content || !fullMatch) continue;

    const trimmedContent = content.trim();

    // Split by pipe for filters
    const parts = trimmedContent.split('|').map((p) => p.trim());
    const path = parts[0] ?? '';
    const filterParts = parts.slice(1);

    // Parse filters
    const filters: FilterCall[] = filterParts.map(parseFilter);

    // Check for default filter to extract default value
    let defaultValue: string | undefined;
    const defaultFilterIndex = filters.findIndex((f) => f.name === 'default');
    if (defaultFilterIndex !== -1) {
      const defaultFilter = filters[defaultFilterIndex];
      if (defaultFilter && defaultFilter.args.length > 0) {
        defaultValue = String(defaultFilter.args[0]);
      }
    }

    expressions.push({
      match: fullMatch,
      path,
      filters,
      ...(defaultValue !== undefined && { defaultValue }),
    });
  }

  return expressions;
}

// ==================== BUILT-IN FILTERS ====================

/**
 * Convert value to uppercase
 */
function filterUppercase(value: unknown): string {
  return String(value).toUpperCase();
}

/**
 * Convert value to lowercase
 */
function filterLowercase(value: unknown): string {
  return String(value).toLowerCase();
}

/**
 * Capitalize first letter
 */
function filterCapitalize(value: unknown): string {
  const str = String(value);
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Trim whitespace
 */
function filterTrim(value: unknown): string {
  return String(value).trim();
}

/**
 * Truncate to max length with optional suffix
 */
function filterTruncate(value: unknown, maxLength: unknown = 20, suffix: unknown = '...'): string {
  const str = String(value);
  const len = Number(maxLength);
  const suf = String(suffix);

  if (str.length <= len) return str;
  return str.slice(0, len - suf.length) + suf;
}

/**
 * Pad string on the left
 */
function filterPadLeft(value: unknown, length: unknown = 10, char: unknown = ' '): string {
  return String(value).padStart(Number(length), String(char));
}

/**
 * Pad string on the right
 */
function filterPadRight(value: unknown, length: unknown = 10, char: unknown = ' '): string {
  return String(value).padEnd(Number(length), String(char));
}

/**
 * Format number with fixed decimal places
 */
function filterNumber(value: unknown, decimals: unknown = 2): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toFixed(Number(decimals));
}

/**
 * Format as currency
 */
function filterCurrency(value: unknown, symbol: unknown = '$', decimals: unknown = 2): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return String(symbol) + num.toFixed(Number(decimals));
}

/**
 * Format as percentage
 */
function filterPercent(value: unknown, decimals: unknown = 0): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return (num * 100).toFixed(Number(decimals)) + '%';
}

/**
 * Format date (basic formatting)
 * Supports: YYYY, MM, DD, HH, mm, ss
 */
function filterDate(value: unknown, format: unknown = 'YYYY-MM-DD'): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return String(value);

  const fmt = String(format);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return fmt
    .replace('YYYY', date.getFullYear().toString())
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
}

/**
 * Join array with separator
 */
function filterJoin(value: unknown, separator: unknown = ', '): string {
  if (!Array.isArray(value)) return String(value);
  return value.join(String(separator));
}

/**
 * Get first element of array or first char of string
 */
function filterFirst(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return String(value).charAt(0);
}

/**
 * Get last element of array or last char of string
 */
function filterLast(value: unknown): string {
  if (Array.isArray(value)) return String(value[value.length - 1] ?? '');
  const str = String(value);
  return str.charAt(str.length - 1);
}

/**
 * Get count/length
 */
function filterCount(value: unknown): string {
  if (Array.isArray(value)) return value.length.toString();
  return String(value).length.toString();
}

/**
 * Default value if undefined/null/empty
 */
function filterDefault(value: unknown, defaultValue: unknown = ''): string {
  if (value === undefined || value === null || value === '') {
    return String(defaultValue);
  }
  return String(value);
}

// ==================== FILTER REGISTRY ====================

/**
 * Create a new filter registry with built-in filters
 */
export function createFilterRegistry(): FilterRegistry {
  const filters = new Map<string, FilterFunction>();

  // Register built-in filters
  filters.set('uppercase', filterUppercase);
  filters.set('lowercase', filterLowercase);
  filters.set('capitalize', filterCapitalize);
  filters.set('trim', filterTrim);
  filters.set('truncate', filterTruncate);
  filters.set('padLeft', filterPadLeft);
  filters.set('padRight', filterPadRight);
  filters.set('number', filterNumber);
  filters.set('currency', filterCurrency);
  filters.set('percent', filterPercent);
  filters.set('date', filterDate);
  filters.set('join', filterJoin);
  filters.set('first', filterFirst);
  filters.set('last', filterLast);
  filters.set('count', filterCount);
  filters.set('default', filterDefault);

  return {
    get: (name: string) => filters.get(name),
    has: (name: string) => filters.has(name),
    register: (name: string, fn: FilterFunction) => filters.set(name, fn),
    list: () => Array.from(filters.keys()),
  };
}

/**
 * Default filter registry with all built-in filters
 */
export const defaultFilters = createFilterRegistry();

// ==================== INTERPOLATION ====================

/**
 * Interpolate a template string with data
 *
 * @param template - Template string with {{variable}} placeholders
 * @param data - Data object for variable resolution
 * @param filters - Filter registry (defaults to built-in filters)
 * @returns Interpolated string with all variables resolved
 *
 * @example
 * ```typescript
 * const data = { name: 'John', balance: 1234.5 };
 * interpolate('Hello {{name}}!', data);
 * // Returns: 'Hello John!'
 *
 * interpolate('Balance: {{balance | currency}}', data);
 * // Returns: 'Balance: $1234.50'
 *
 * interpolate('Hi {{missing | default:"Guest"}}!', data);
 * // Returns: 'Hi Guest!'
 * ```
 */
export function interpolate(
  template: string,
  data: Record<string, unknown>,
  filters: FilterRegistry = defaultFilters
): string {
  const expressions = parseTemplate(template);

  if (expressions.length === 0) {
    return template;
  }

  let result = template;

  for (const expr of expressions) {
    // Resolve the path
    let value = resolvePath(data, expr.path);

    // Apply filters
    for (const filter of expr.filters) {
      const filterFn = filters.get(filter.name);
      if (filterFn) {
        value = filterFn(value, ...filter.args);
      }
    }

    // Convert to string (use default value if undefined/null)
    const stringValue =
      value === undefined || value === null
        ? expr.defaultValue ?? ''
        : String(value);

    // Replace in result
    result = result.replace(expr.match, stringValue);
  }

  return result;
}
