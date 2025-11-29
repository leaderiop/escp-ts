/**
 * Conditional Evaluation for ESC/P2 Layout System
 *
 * Provides data-driven condition evaluation for ConditionalNode and SwitchNode.
 * Supports various comparison operators and compound conditions.
 */

import type { DataCondition, DataContext } from './nodes';
import { resolvePath } from './interpolation';

// ==================== DATA CONDITION EVALUATION ====================

/**
 * Evaluate a DataCondition against a data context
 *
 * @param condition - The data condition to evaluate
 * @param data - The data object to evaluate against
 * @returns true if the condition is met, false otherwise
 *
 * @example
 * ```typescript
 * const data = { user: { age: 25, role: 'admin' }, items: [] };
 *
 * evaluateDataCondition({ path: 'user.age', operator: 'gte', value: 18 }, data);
 * // Returns: true
 *
 * evaluateDataCondition({ path: 'user.role', operator: 'eq', value: 'admin' }, data);
 * // Returns: true
 *
 * evaluateDataCondition({ path: 'items', operator: 'empty' }, data);
 * // Returns: true
 * ```
 */
export function evaluateDataCondition(
  condition: DataCondition,
  data: Record<string, unknown>
): boolean {
  const value = resolvePath(data, condition.path);
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return value === compareValue;

    case 'neq':
      return value !== compareValue;

    case 'gt':
      return Number(value) > Number(compareValue);

    case 'gte':
      return Number(value) >= Number(compareValue);

    case 'lt':
      return Number(value) < Number(compareValue);

    case 'lte':
      return Number(value) <= Number(compareValue);

    case 'in':
      if (Array.isArray(compareValue)) {
        return compareValue.includes(value);
      }
      // If compareValue is a string, check if value is in the string
      if (typeof compareValue === 'string' && typeof value === 'string') {
        return compareValue.includes(value);
      }
      return false;

    case 'notIn':
      if (Array.isArray(compareValue)) {
        return !compareValue.includes(value);
      }
      if (typeof compareValue === 'string' && typeof value === 'string') {
        return !compareValue.includes(value);
      }
      return true;

    case 'exists':
      return value !== undefined && value !== null;

    case 'notExists':
      return value === undefined || value === null;

    case 'empty':
      if (value === undefined || value === null) return true;
      if (typeof value === 'string') return value.length === 0;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;

    case 'notEmpty':
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;

    default:
      // Unknown operator - return false
      return false;
  }
}

// ==================== CONDITION EVALUATION ====================

/**
 * Evaluate any condition type (DataCondition or callback function)
 *
 * @param condition - The condition to evaluate (DataCondition or callback)
 * @param ctx - The data context for evaluation
 * @returns true if the condition is met, false otherwise
 *
 * @example
 * ```typescript
 * const ctx: DataContext = {
 *   data: { user: { isPremium: true } },
 *   space: { availableWidth: 1000, ... }
 * };
 *
 * // DataCondition
 * evaluateCondition({ path: 'user.isPremium', operator: 'eq', value: true }, ctx);
 *
 * // Callback function
 * evaluateCondition((ctx) => ctx.data.user.isPremium === true, ctx);
 * ```
 */
export function evaluateCondition(
  condition: DataCondition | ((ctx: DataContext) => boolean),
  ctx: DataContext
): boolean {
  if (typeof condition === 'function') {
    try {
      return condition(ctx);
    } catch {
      // If callback throws, treat as false
      return false;
    }
  }

  // DataCondition object
  return evaluateDataCondition(condition, ctx.data as Record<string, unknown>);
}

// ==================== SWITCH VALUE MATCHING ====================

/**
 * Check if a value matches a switch case value (which can be single value or array)
 *
 * @param value - The value to check
 * @param caseValue - The case value(s) to match against
 * @returns true if value matches any of the case values
 *
 * @example
 * ```typescript
 * matchesCaseValue('active', 'active'); // true
 * matchesCaseValue('active', ['active', 'pending']); // true
 * matchesCaseValue('deleted', ['active', 'pending']); // false
 * ```
 */
export function matchesCaseValue(value: unknown, caseValue: unknown | unknown[]): boolean {
  if (Array.isArray(caseValue)) {
    return caseValue.some((cv) => cv === value);
  }
  return value === caseValue;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a DataCondition for equality check
 */
export function eq(path: string, value: unknown): DataCondition {
  return { path, operator: 'eq', value };
}

/**
 * Create a DataCondition for not-equal check
 */
export function neq(path: string, value: unknown): DataCondition {
  return { path, operator: 'neq', value };
}

/**
 * Create a DataCondition for greater-than check
 */
export function gt(path: string, value: number): DataCondition {
  return { path, operator: 'gt', value };
}

/**
 * Create a DataCondition for greater-than-or-equal check
 */
export function gte(path: string, value: number): DataCondition {
  return { path, operator: 'gte', value };
}

/**
 * Create a DataCondition for less-than check
 */
export function lt(path: string, value: number): DataCondition {
  return { path, operator: 'lt', value };
}

/**
 * Create a DataCondition for less-than-or-equal check
 */
export function lte(path: string, value: number): DataCondition {
  return { path, operator: 'lte', value };
}

/**
 * Create a DataCondition for "value in array" check
 */
export function isIn(path: string, values: unknown[]): DataCondition {
  return { path, operator: 'in', value: values };
}

/**
 * Create a DataCondition for "value not in array" check
 */
export function notIn(path: string, values: unknown[]): DataCondition {
  return { path, operator: 'notIn', value: values };
}

/**
 * Create a DataCondition for existence check
 */
export function exists(path: string): DataCondition {
  return { path, operator: 'exists' };
}

/**
 * Create a DataCondition for non-existence check
 */
export function notExists(path: string): DataCondition {
  return { path, operator: 'notExists' };
}

/**
 * Create a DataCondition for empty check
 */
export function empty(path: string): DataCondition {
  return { path, operator: 'empty' };
}

/**
 * Create a DataCondition for not-empty check
 */
export function notEmpty(path: string): DataCondition {
  return { path, operator: 'notEmpty' };
}
