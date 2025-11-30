/**
 * Tests for Conditional Evaluation System
 *
 * Comprehensive tests for all conditional operators and evaluation functions
 * used in ConditionalNode and SwitchNode rendering.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateDataCondition,
  evaluateCondition,
  matchesCaseValue,
  eq,
  neq,
  gt,
  gte,
  lt,
  lte,
  isIn,
  notIn,
  exists,
  notExists,
  empty,
  notEmpty,
} from '../conditionals';
import type { DataCondition, DataContext } from '../nodes';

// ==================== HELPER FUNCTION TESTS ====================

describe('Condition Helper Functions', () => {
  describe('eq', () => {
    it('should create equality condition', () => {
      const condition = eq('user.name', 'John');
      expect(condition).toEqual({
        path: 'user.name',
        operator: 'eq',
        value: 'John',
      });
    });

    it('should handle numeric values', () => {
      const condition = eq('user.age', 25);
      expect(condition).toEqual({
        path: 'user.age',
        operator: 'eq',
        value: 25,
      });
    });

    it('should handle boolean values', () => {
      const condition = eq('user.active', true);
      expect(condition).toEqual({
        path: 'user.active',
        operator: 'eq',
        value: true,
      });
    });

    it('should handle null values', () => {
      const condition = eq('user.deletedAt', null);
      expect(condition).toEqual({
        path: 'user.deletedAt',
        operator: 'eq',
        value: null,
      });
    });
  });

  describe('neq', () => {
    it('should create not-equal condition', () => {
      const condition = neq('status', 'deleted');
      expect(condition).toEqual({
        path: 'status',
        operator: 'neq',
        value: 'deleted',
      });
    });

    it('should handle various types', () => {
      expect(neq('count', 0)).toEqual({ path: 'count', operator: 'neq', value: 0 });
      expect(neq('flag', false)).toEqual({ path: 'flag', operator: 'neq', value: false });
    });
  });

  describe('gt', () => {
    it('should create greater-than condition', () => {
      const condition = gt('price', 100);
      expect(condition).toEqual({
        path: 'price',
        operator: 'gt',
        value: 100,
      });
    });

    it('should handle zero', () => {
      const condition = gt('quantity', 0);
      expect(condition).toEqual({
        path: 'quantity',
        operator: 'gt',
        value: 0,
      });
    });

    it('should handle negative numbers', () => {
      const condition = gt('temperature', -10);
      expect(condition).toEqual({
        path: 'temperature',
        operator: 'gt',
        value: -10,
      });
    });
  });

  describe('gte', () => {
    it('should create greater-than-or-equal condition', () => {
      const condition = gte('age', 18);
      expect(condition).toEqual({
        path: 'age',
        operator: 'gte',
        value: 18,
      });
    });

    it('should handle decimals', () => {
      const condition = gte('rating', 4.5);
      expect(condition).toEqual({
        path: 'rating',
        operator: 'gte',
        value: 4.5,
      });
    });
  });

  describe('lt', () => {
    it('should create less-than condition', () => {
      const condition = lt('stock', 10);
      expect(condition).toEqual({
        path: 'stock',
        operator: 'lt',
        value: 10,
      });
    });
  });

  describe('lte', () => {
    it('should create less-than-or-equal condition', () => {
      const condition = lte('discount', 50);
      expect(condition).toEqual({
        path: 'discount',
        operator: 'lte',
        value: 50,
      });
    });
  });

  describe('isIn', () => {
    it('should create in-array condition', () => {
      const condition = isIn('role', ['admin', 'moderator']);
      expect(condition).toEqual({
        path: 'role',
        operator: 'in',
        value: ['admin', 'moderator'],
      });
    });

    it('should handle numeric arrays', () => {
      const condition = isIn('statusCode', [200, 201, 204]);
      expect(condition).toEqual({
        path: 'statusCode',
        operator: 'in',
        value: [200, 201, 204],
      });
    });

    it('should handle mixed type arrays', () => {
      const condition = isIn('value', [1, 'two', true, null]);
      expect(condition).toEqual({
        path: 'value',
        operator: 'in',
        value: [1, 'two', true, null],
      });
    });

    it('should handle empty arrays', () => {
      const condition = isIn('value', []);
      expect(condition).toEqual({
        path: 'value',
        operator: 'in',
        value: [],
      });
    });
  });

  describe('notIn', () => {
    it('should create not-in-array condition', () => {
      const condition = notIn('status', ['deleted', 'archived']);
      expect(condition).toEqual({
        path: 'status',
        operator: 'notIn',
        value: ['deleted', 'archived'],
      });
    });
  });

  describe('exists', () => {
    it('should create existence condition', () => {
      const condition = exists('user.email');
      expect(condition).toEqual({
        path: 'user.email',
        operator: 'exists',
      });
    });

    it('should not have a value property', () => {
      const condition = exists('nested.deep.path');
      expect(condition.value).toBeUndefined();
    });
  });

  describe('notExists', () => {
    it('should create non-existence condition', () => {
      const condition = notExists('user.deletedAt');
      expect(condition).toEqual({
        path: 'user.deletedAt',
        operator: 'notExists',
      });
    });
  });

  describe('empty', () => {
    it('should create empty condition', () => {
      const condition = empty('items');
      expect(condition).toEqual({
        path: 'items',
        operator: 'empty',
      });
    });
  });

  describe('notEmpty', () => {
    it('should create not-empty condition', () => {
      const condition = notEmpty('cart.items');
      expect(condition).toEqual({
        path: 'cart.items',
        operator: 'notEmpty',
      });
    });
  });
});

// ==================== evaluateDataCondition TESTS ====================

describe('evaluateDataCondition', () => {
  describe('eq operator', () => {
    it('should return true for equal string values', () => {
      const data = { name: 'John' };
      const condition: DataCondition = { path: 'name', operator: 'eq', value: 'John' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for non-equal string values', () => {
      const data = { name: 'John' };
      const condition: DataCondition = { path: 'name', operator: 'eq', value: 'Jane' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return true for equal numeric values', () => {
      const data = { age: 25 };
      const condition: DataCondition = { path: 'age', operator: 'eq', value: 25 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for equal boolean values', () => {
      const data = { active: true };
      const condition: DataCondition = { path: 'active', operator: 'eq', value: true };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle nested paths', () => {
      const data = { user: { profile: { name: 'John' } } };
      const condition: DataCondition = { path: 'user.profile.name', operator: 'eq', value: 'John' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should use strict equality (not type coercion)', () => {
      const data = { value: '5' };
      const condition: DataCondition = { path: 'value', operator: 'eq', value: 5 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should handle null equality', () => {
      const data = { value: null };
      const condition: DataCondition = { path: 'value', operator: 'eq', value: null };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle undefined equality', () => {
      const data = { value: undefined };
      const condition: DataCondition = { path: 'value', operator: 'eq', value: undefined };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle missing path as undefined', () => {
      const data = { other: 'value' };
      const condition: DataCondition = { path: 'missing', operator: 'eq', value: undefined };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });
  });

  describe('neq operator', () => {
    it('should return true for non-equal values', () => {
      const data = { status: 'active' };
      const condition: DataCondition = { path: 'status', operator: 'neq', value: 'deleted' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for equal values', () => {
      const data = { status: 'active' };
      const condition: DataCondition = { path: 'status', operator: 'neq', value: 'active' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should use strict inequality', () => {
      const data = { value: '5' };
      const condition: DataCondition = { path: 'value', operator: 'neq', value: 5 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle null neq undefined', () => {
      const data = { value: null };
      const condition: DataCondition = { path: 'value', operator: 'neq', value: undefined };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });
  });

  describe('gt operator', () => {
    it('should return true when value is greater', () => {
      const data = { age: 25 };
      const condition: DataCondition = { path: 'age', operator: 'gt', value: 18 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false when value is equal', () => {
      const data = { age: 18 };
      const condition: DataCondition = { path: 'age', operator: 'gt', value: 18 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false when value is less', () => {
      const data = { age: 15 };
      const condition: DataCondition = { path: 'age', operator: 'gt', value: 18 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should handle string numeric conversion', () => {
      const data = { value: '100' };
      const condition: DataCondition = { path: 'value', operator: 'gt', value: 50 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle decimal numbers', () => {
      const data = { price: 99.99 };
      const condition: DataCondition = { path: 'price', operator: 'gt', value: 99.98 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle negative numbers', () => {
      const data = { temperature: -5 };
      const condition: DataCondition = { path: 'temperature', operator: 'gt', value: -10 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle zero comparison', () => {
      const data = { count: 1 };
      const condition: DataCondition = { path: 'count', operator: 'gt', value: 0 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for NaN comparison', () => {
      const data = { value: 'not-a-number' };
      const condition: DataCondition = { path: 'value', operator: 'gt', value: 10 };
      // NaN > 10 is false
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });
  });

  describe('gte operator', () => {
    it('should return true when value is greater', () => {
      const data = { age: 25 };
      const condition: DataCondition = { path: 'age', operator: 'gte', value: 18 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true when value is equal', () => {
      const data = { age: 18 };
      const condition: DataCondition = { path: 'age', operator: 'gte', value: 18 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false when value is less', () => {
      const data = { age: 15 };
      const condition: DataCondition = { path: 'age', operator: 'gte', value: 18 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should handle boundary values', () => {
      const data = { score: 100 };
      const condition: DataCondition = { path: 'score', operator: 'gte', value: 100 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });
  });

  describe('lt operator', () => {
    it('should return true when value is less', () => {
      const data = { stock: 5 };
      const condition: DataCondition = { path: 'stock', operator: 'lt', value: 10 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false when value is equal', () => {
      const data = { stock: 10 };
      const condition: DataCondition = { path: 'stock', operator: 'lt', value: 10 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false when value is greater', () => {
      const data = { stock: 15 };
      const condition: DataCondition = { path: 'stock', operator: 'lt', value: 10 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should handle negative comparison', () => {
      const data = { balance: -100 };
      const condition: DataCondition = { path: 'balance', operator: 'lt', value: 0 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });
  });

  describe('lte operator', () => {
    it('should return true when value is less', () => {
      const data = { discount: 30 };
      const condition: DataCondition = { path: 'discount', operator: 'lte', value: 50 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true when value is equal', () => {
      const data = { discount: 50 };
      const condition: DataCondition = { path: 'discount', operator: 'lte', value: 50 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false when value is greater', () => {
      const data = { discount: 75 };
      const condition: DataCondition = { path: 'discount', operator: 'lte', value: 50 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });
  });

  describe('in operator', () => {
    it('should return true when value is in array', () => {
      const data = { role: 'admin' };
      const condition: DataCondition = {
        path: 'role',
        operator: 'in',
        value: ['admin', 'moderator', 'user'],
      };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false when value is not in array', () => {
      const data = { role: 'guest' };
      const condition: DataCondition = {
        path: 'role',
        operator: 'in',
        value: ['admin', 'moderator', 'user'],
      };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should handle numeric values in array', () => {
      const data = { statusCode: 200 };
      const condition: DataCondition = {
        path: 'statusCode',
        operator: 'in',
        value: [200, 201, 204],
      };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle empty array (always false)', () => {
      const data = { value: 'anything' };
      const condition: DataCondition = { path: 'value', operator: 'in', value: [] };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should handle null in array', () => {
      const data = { value: null };
      const condition: DataCondition = { path: 'value', operator: 'in', value: [null, 'other'] };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle string substring check', () => {
      const data = { char: 'a' };
      const condition: DataCondition = { path: 'char', operator: 'in', value: 'abc' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for string not in string', () => {
      const data = { char: 'x' };
      const condition: DataCondition = { path: 'char', operator: 'in', value: 'abc' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false when compareValue is not array or string', () => {
      const data = { value: 'test' };
      const condition: DataCondition = { path: 'value', operator: 'in', value: 123 };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false when value is not string for string compareValue', () => {
      const data = { value: 123 };
      const condition: DataCondition = { path: 'value', operator: 'in', value: '123456' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });
  });

  describe('notIn operator', () => {
    it('should return true when value is not in array', () => {
      const data = { status: 'active' };
      const condition: DataCondition = {
        path: 'status',
        operator: 'notIn',
        value: ['deleted', 'archived'],
      };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false when value is in array', () => {
      const data = { status: 'deleted' };
      const condition: DataCondition = {
        path: 'status',
        operator: 'notIn',
        value: ['deleted', 'archived'],
      };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should handle empty array (always true)', () => {
      const data = { value: 'anything' };
      const condition: DataCondition = { path: 'value', operator: 'notIn', value: [] };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle string not-in-string check', () => {
      const data = { char: 'x' };
      const condition: DataCondition = { path: 'char', operator: 'notIn', value: 'abc' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for string in string', () => {
      const data = { char: 'b' };
      const condition: DataCondition = { path: 'char', operator: 'notIn', value: 'abc' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return true when compareValue is not array or string', () => {
      const data = { value: 'test' };
      const condition: DataCondition = { path: 'value', operator: 'notIn', value: 123 };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true when value is not string for string compareValue', () => {
      const data = { value: 123 };
      const condition: DataCondition = { path: 'value', operator: 'notIn', value: '123456' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });
  });

  describe('exists operator', () => {
    it('should return true when value exists', () => {
      const data = { user: { email: 'test@example.com' } };
      const condition: DataCondition = { path: 'user.email', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for empty string (exists)', () => {
      const data = { name: '' };
      const condition: DataCondition = { path: 'name', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for zero (exists)', () => {
      const data = { count: 0 };
      const condition: DataCondition = { path: 'count', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for false (exists)', () => {
      const data = { active: false };
      const condition: DataCondition = { path: 'active', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for null', () => {
      const data = { value: null };
      const condition: DataCondition = { path: 'value', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for undefined', () => {
      const data = { value: undefined };
      const condition: DataCondition = { path: 'value', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for missing path', () => {
      const data = { other: 'value' };
      const condition: DataCondition = { path: 'missing', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for missing nested path', () => {
      const data = { user: {} };
      const condition: DataCondition = { path: 'user.profile.name', operator: 'exists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });
  });

  describe('notExists operator', () => {
    it('should return true for null', () => {
      const data = { value: null };
      const condition: DataCondition = { path: 'value', operator: 'notExists' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for undefined', () => {
      const data = { value: undefined };
      const condition: DataCondition = { path: 'value', operator: 'notExists' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for missing path', () => {
      const data = { other: 'value' };
      const condition: DataCondition = { path: 'missing', operator: 'notExists' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for existing value', () => {
      const data = { name: 'John' };
      const condition: DataCondition = { path: 'name', operator: 'notExists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for empty string', () => {
      const data = { name: '' };
      const condition: DataCondition = { path: 'name', operator: 'notExists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for zero', () => {
      const data = { count: 0 };
      const condition: DataCondition = { path: 'count', operator: 'notExists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for false', () => {
      const data = { active: false };
      const condition: DataCondition = { path: 'active', operator: 'notExists' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });
  });

  describe('empty operator', () => {
    it('should return true for undefined', () => {
      const data = {};
      const condition: DataCondition = { path: 'missing', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for null', () => {
      const data = { value: null };
      const condition: DataCondition = { path: 'value', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for empty string', () => {
      const data = { name: '' };
      const condition: DataCondition = { path: 'name', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for non-empty string', () => {
      const data = { name: 'John' };
      const condition: DataCondition = { path: 'name', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return true for empty array', () => {
      const data = { items: [] };
      const condition: DataCondition = { path: 'items', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for non-empty array', () => {
      const data = { items: [1, 2, 3] };
      const condition: DataCondition = { path: 'items', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return true for empty object', () => {
      const data = { config: {} };
      const condition: DataCondition = { path: 'config', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for non-empty object', () => {
      const data = { config: { key: 'value' } };
      const condition: DataCondition = { path: 'config', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for number (non-empty)', () => {
      const data = { count: 0 };
      const condition: DataCondition = { path: 'count', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for boolean false (non-empty)', () => {
      const data = { active: false };
      const condition: DataCondition = { path: 'active', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for boolean true (non-empty)', () => {
      const data = { active: true };
      const condition: DataCondition = { path: 'active', operator: 'empty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });
  });

  describe('notEmpty operator', () => {
    it('should return false for undefined', () => {
      const data = {};
      const condition: DataCondition = { path: 'missing', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for null', () => {
      const data = { value: null };
      const condition: DataCondition = { path: 'value', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return false for empty string', () => {
      const data = { name: '' };
      const condition: DataCondition = { path: 'name', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return true for non-empty string', () => {
      const data = { name: 'John' };
      const condition: DataCondition = { path: 'name', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for empty array', () => {
      const data = { items: [] };
      const condition: DataCondition = { path: 'items', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return true for non-empty array', () => {
      const data = { items: [1, 2, 3] };
      const condition: DataCondition = { path: 'items', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return false for empty object', () => {
      const data = { config: {} };
      const condition: DataCondition = { path: 'config', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });

    it('should return true for non-empty object', () => {
      const data = { config: { key: 'value' } };
      const condition: DataCondition = { path: 'config', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for number (non-empty)', () => {
      const data = { count: 0 };
      const condition: DataCondition = { path: 'count', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for boolean false (non-empty)', () => {
      const data = { active: false };
      const condition: DataCondition = { path: 'active', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should return true for boolean true (non-empty)', () => {
      const data = { active: true };
      const condition: DataCondition = { path: 'active', operator: 'notEmpty' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });
  });

  describe('unknown operator', () => {
    it('should return false for unknown operator', () => {
      const data = { value: 'test' };
      // Cast to bypass TypeScript for testing runtime behavior
      const condition = { path: 'value', operator: 'unknown' as 'eq', value: 'test' };
      expect(evaluateDataCondition(condition, data)).toBe(false);
    });
  });

  describe('complex nested paths', () => {
    it('should handle deeply nested object paths', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      const condition: DataCondition = {
        path: 'level1.level2.level3.value',
        operator: 'eq',
        value: 'deep',
      };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle array index paths', () => {
      const data = { items: [{ name: 'first' }, { name: 'second' }] };
      const condition: DataCondition = { path: 'items[1].name', operator: 'eq', value: 'second' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });

    it('should handle array index at root', () => {
      const data = { items: ['a', 'b', 'c'] };
      const condition: DataCondition = { path: 'items[0]', operator: 'eq', value: 'a' };
      expect(evaluateDataCondition(condition, data)).toBe(true);
    });
  });
});

// ==================== evaluateCondition TESTS ====================

describe('evaluateCondition', () => {
  const createContext = (data: Record<string, unknown>): DataContext => ({
    data,
    space: {
      availableWidth: 1000,
      availableHeight: 500,
      contentWidth: 800,
      contentHeight: 400,
    },
  });

  describe('DataCondition evaluation', () => {
    it('should evaluate DataCondition through evaluateDataCondition', () => {
      const ctx = createContext({ user: { isPremium: true } });
      const condition: DataCondition = { path: 'user.isPremium', operator: 'eq', value: true };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('should handle nested data correctly', () => {
      const ctx = createContext({ order: { items: [1, 2, 3] } });
      const condition: DataCondition = { path: 'order.items', operator: 'notEmpty' };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('should return false for failed condition', () => {
      const ctx = createContext({ count: 5 });
      const condition: DataCondition = { path: 'count', operator: 'gt', value: 10 };
      expect(evaluateCondition(condition, ctx)).toBe(false);
    });
  });

  describe('callback function evaluation', () => {
    it('should execute callback function with context', () => {
      const ctx = createContext({ user: { age: 25 } });
      const callback = (context: DataContext) => {
        const data = context.data as { user: { age: number } };
        return data.user.age >= 18;
      };
      expect(evaluateCondition(callback, ctx)).toBe(true);
    });

    it('should return true from truthy callback', () => {
      const ctx = createContext({});
      const callback = () => true;
      expect(evaluateCondition(callback, ctx)).toBe(true);
    });

    it('should return false from falsy callback', () => {
      const ctx = createContext({});
      const callback = () => false;
      expect(evaluateCondition(callback, ctx)).toBe(false);
    });

    it('should provide space context to callback', () => {
      const ctx = createContext({});
      const callback = (context: DataContext) => context.space.availableWidth > 500;
      expect(evaluateCondition(callback, ctx)).toBe(true);
    });

    it('should return false when callback throws', () => {
      const ctx = createContext({});
      const callback = () => {
        throw new Error('Test error');
      };
      expect(evaluateCondition(callback, ctx)).toBe(false);
    });

    it('should return false when callback throws non-Error', () => {
      const ctx = createContext({});
      const callback = () => {
        throw 'string error';
      };
      expect(evaluateCondition(callback, ctx)).toBe(false);
    });

    it('should handle callback accessing undefined properties', () => {
      const ctx = createContext({});
      const callback = (context: DataContext) => {
        const data = context.data as { missing?: { value: boolean } };
        // This won't throw, just returns undefined
        return data.missing?.value === true;
      };
      expect(evaluateCondition(callback, ctx)).toBe(false);
    });

    it('should allow complex logic in callback', () => {
      const ctx = createContext({
        user: { role: 'admin', level: 5 },
        settings: { allowAdmin: true },
      });
      const callback = (context: DataContext) => {
        const data = context.data as {
          user: { role: string; level: number };
          settings: { allowAdmin: boolean };
        };
        return data.user.role === 'admin' && data.user.level >= 3 && data.settings.allowAdmin;
      };
      expect(evaluateCondition(callback, ctx)).toBe(true);
    });
  });
});

// ==================== matchesCaseValue TESTS ====================

describe('matchesCaseValue', () => {
  describe('single value matching', () => {
    it('should match equal string values', () => {
      expect(matchesCaseValue('active', 'active')).toBe(true);
    });

    it('should not match different string values', () => {
      expect(matchesCaseValue('active', 'inactive')).toBe(false);
    });

    it('should match equal numeric values', () => {
      expect(matchesCaseValue(42, 42)).toBe(true);
    });

    it('should not match different numeric values', () => {
      expect(matchesCaseValue(42, 43)).toBe(false);
    });

    it('should match equal boolean values', () => {
      expect(matchesCaseValue(true, true)).toBe(true);
      expect(matchesCaseValue(false, false)).toBe(true);
    });

    it('should not match different boolean values', () => {
      expect(matchesCaseValue(true, false)).toBe(false);
    });

    it('should match null values', () => {
      expect(matchesCaseValue(null, null)).toBe(true);
    });

    it('should match undefined values', () => {
      expect(matchesCaseValue(undefined, undefined)).toBe(true);
    });

    it('should use strict equality (no type coercion)', () => {
      expect(matchesCaseValue('5', 5)).toBe(false);
      expect(matchesCaseValue(0, false)).toBe(false);
      expect(matchesCaseValue('', false)).toBe(false);
      expect(matchesCaseValue(null, undefined)).toBe(false);
    });
  });

  describe('array value matching', () => {
    it('should match value in array', () => {
      expect(matchesCaseValue('active', ['active', 'pending'])).toBe(true);
    });

    it('should match first value in array', () => {
      expect(matchesCaseValue('first', ['first', 'second', 'third'])).toBe(true);
    });

    it('should match last value in array', () => {
      expect(matchesCaseValue('third', ['first', 'second', 'third'])).toBe(true);
    });

    it('should not match value not in array', () => {
      expect(matchesCaseValue('deleted', ['active', 'pending'])).toBe(false);
    });

    it('should handle numeric arrays', () => {
      expect(matchesCaseValue(200, [200, 201, 204])).toBe(true);
      expect(matchesCaseValue(404, [200, 201, 204])).toBe(false);
    });

    it('should handle mixed type arrays', () => {
      expect(matchesCaseValue('text', ['text', 42, true])).toBe(true);
      expect(matchesCaseValue(42, ['text', 42, true])).toBe(true);
      expect(matchesCaseValue(true, ['text', 42, true])).toBe(true);
      expect(matchesCaseValue(false, ['text', 42, true])).toBe(false);
    });

    it('should handle empty array (never matches)', () => {
      expect(matchesCaseValue('anything', [])).toBe(false);
      expect(matchesCaseValue(null, [])).toBe(false);
    });

    it('should handle null in array', () => {
      expect(matchesCaseValue(null, [null, 'other'])).toBe(true);
    });

    it('should handle undefined in array', () => {
      expect(matchesCaseValue(undefined, [undefined, 'other'])).toBe(true);
    });

    it('should use strict equality in array matching', () => {
      expect(matchesCaseValue('5', [5, 10])).toBe(false);
      expect(matchesCaseValue(0, [false, ''])).toBe(false);
    });
  });

  describe('object values', () => {
    it('should not match object by reference equality', () => {
      const obj = { id: 1 };
      const sameContentObj = { id: 1 };
      expect(matchesCaseValue(obj, sameContentObj)).toBe(false);
    });

    it('should match same object reference', () => {
      const obj = { id: 1 };
      expect(matchesCaseValue(obj, obj)).toBe(true);
    });

    it('should not match array against itself (caseValue is treated as array of cases)', () => {
      // When caseValue is an array, the function checks if value is IN the array
      // So matching an array against itself checks if arr is contained in arr
      // which would only be true if arr contains a reference to itself
      const arr = [1, 2, 3];
      expect(matchesCaseValue(arr, arr)).toBe(false);
    });

    it('should handle object in array by reference', () => {
      const obj = { id: 1 };
      expect(matchesCaseValue(obj, [obj, { id: 2 }])).toBe(true);
      expect(matchesCaseValue({ id: 1 }, [obj, { id: 2 }])).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle NaN (never equals)', () => {
      expect(matchesCaseValue(NaN, NaN)).toBe(false);
      expect(matchesCaseValue(NaN, [NaN])).toBe(false);
    });

    it('should handle Infinity', () => {
      expect(matchesCaseValue(Infinity, Infinity)).toBe(true);
      expect(matchesCaseValue(-Infinity, -Infinity)).toBe(true);
      expect(matchesCaseValue(Infinity, [Infinity, -Infinity])).toBe(true);
    });

    it('should handle empty string', () => {
      expect(matchesCaseValue('', '')).toBe(true);
      expect(matchesCaseValue('', ['', 'non-empty'])).toBe(true);
    });

    it('should handle zero', () => {
      expect(matchesCaseValue(0, 0)).toBe(true);
      expect(matchesCaseValue(-0, 0)).toBe(true); // -0 === 0 in JavaScript
      expect(matchesCaseValue(0, [0, 1, 2])).toBe(true);
    });

    it('should handle single-element arrays', () => {
      expect(matchesCaseValue('only', ['only'])).toBe(true);
      expect(matchesCaseValue('other', ['only'])).toBe(false);
    });
  });
});
