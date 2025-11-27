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
} from './conditionals';
import type { DataContext, DataCondition } from './nodes';

describe('conditionals', () => {
  // Helper to create a data context
  const createCtx = (data: Record<string, unknown>): DataContext => ({
    data,
    space: {
      availableWidth: 1000,
      availableHeight: 1000,
      remainingWidth: 1000,
      remainingHeight: 1000,
      pageNumber: 0,
    },
  });

  // ==================== EVALUATE DATA CONDITION ====================

  describe('evaluateDataCondition', () => {
    describe('eq operator', () => {
      it('returns true for equal values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'eq', value: 5 }, { x: 5 })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'eq', value: 'hello' }, { x: 'hello' })).toBe(true);
      });

      it('returns false for unequal values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'eq', value: 5 }, { x: 6 })).toBe(false);
      });
    });

    describe('neq operator', () => {
      it('returns true for unequal values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'neq', value: 5 }, { x: 6 })).toBe(true);
      });

      it('returns false for equal values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'neq', value: 5 }, { x: 5 })).toBe(false);
      });
    });

    describe('gt operator', () => {
      it('returns true when value is greater', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'gt', value: 5 }, { x: 10 })).toBe(true);
      });

      it('returns false when value is not greater', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'gt', value: 5 }, { x: 5 })).toBe(false);
        expect(evaluateDataCondition({ path: 'x', operator: 'gt', value: 5 }, { x: 3 })).toBe(false);
      });
    });

    describe('gte operator', () => {
      it('returns true when value is greater or equal', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'gte', value: 5 }, { x: 10 })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'gte', value: 5 }, { x: 5 })).toBe(true);
      });

      it('returns false when value is less', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'gte', value: 5 }, { x: 3 })).toBe(false);
      });
    });

    describe('lt operator', () => {
      it('returns true when value is less', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'lt', value: 5 }, { x: 3 })).toBe(true);
      });

      it('returns false when value is not less', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'lt', value: 5 }, { x: 5 })).toBe(false);
        expect(evaluateDataCondition({ path: 'x', operator: 'lt', value: 5 }, { x: 10 })).toBe(false);
      });
    });

    describe('lte operator', () => {
      it('returns true when value is less or equal', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'lte', value: 5 }, { x: 3 })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'lte', value: 5 }, { x: 5 })).toBe(true);
      });

      it('returns false when value is greater', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'lte', value: 5 }, { x: 10 })).toBe(false);
      });
    });

    describe('in operator', () => {
      it('returns true when value is in array', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'in', value: [1, 2, 3] }, { x: 2 })).toBe(true);
      });

      it('returns false when value is not in array', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'in', value: [1, 2, 3] }, { x: 4 })).toBe(false);
      });
    });

    describe('notIn operator', () => {
      it('returns true when value is not in array', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'notIn', value: [1, 2, 3] }, { x: 4 })).toBe(true);
      });

      it('returns false when value is in array', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'notIn', value: [1, 2, 3] }, { x: 2 })).toBe(false);
      });
    });

    describe('exists operator', () => {
      it('returns true when path exists', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'exists' }, { x: 5 })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'exists' }, { x: '' })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'exists' }, { x: 0 })).toBe(true);
      });

      it('returns false when path does not exist', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'exists' }, {})).toBe(false);
        expect(evaluateDataCondition({ path: 'x', operator: 'exists' }, { x: null })).toBe(false);
        expect(evaluateDataCondition({ path: 'x', operator: 'exists' }, { x: undefined })).toBe(false);
      });
    });

    describe('notExists operator', () => {
      it('returns true when path does not exist', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'notExists' }, {})).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'notExists' }, { x: null })).toBe(true);
      });

      it('returns false when path exists', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'notExists' }, { x: 5 })).toBe(false);
      });
    });

    describe('empty operator', () => {
      it('returns true for empty values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, { x: '' })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, { x: [] })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, { x: {} })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, { x: null })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, {})).toBe(true);
      });

      it('returns false for non-empty values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, { x: 'hello' })).toBe(false);
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, { x: [1] })).toBe(false);
        expect(evaluateDataCondition({ path: 'x', operator: 'empty' }, { x: { a: 1 } })).toBe(false);
      });
    });

    describe('notEmpty operator', () => {
      it('returns true for non-empty values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'notEmpty' }, { x: 'hello' })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'notEmpty' }, { x: [1] })).toBe(true);
        expect(evaluateDataCondition({ path: 'x', operator: 'notEmpty' }, { x: { a: 1 } })).toBe(true);
      });

      it('returns false for empty values', () => {
        expect(evaluateDataCondition({ path: 'x', operator: 'notEmpty' }, { x: '' })).toBe(false);
        expect(evaluateDataCondition({ path: 'x', operator: 'notEmpty' }, { x: [] })).toBe(false);
      });
    });

    it('handles nested paths', () => {
      const data = { user: { age: 25 } };
      expect(evaluateDataCondition({ path: 'user.age', operator: 'gte', value: 18 }, data)).toBe(true);
    });
  });

  // ==================== EVALUATE CONDITION ====================

  describe('evaluateCondition', () => {
    it('evaluates DataCondition objects', () => {
      const condition: DataCondition = { path: 'isPremium', operator: 'eq', value: true };
      const ctx = createCtx({ isPremium: true });
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('evaluates callback functions', () => {
      const condition = (ctx: DataContext) => (ctx.data as { count: number }).count > 5;
      expect(evaluateCondition(condition, createCtx({ count: 10 }))).toBe(true);
      expect(evaluateCondition(condition, createCtx({ count: 3 }))).toBe(false);
    });

    it('handles callback errors gracefully', () => {
      const condition = () => {
        throw new Error('Test error');
      };
      expect(evaluateCondition(condition, createCtx({}))).toBe(false);
    });
  });

  // ==================== MATCHES CASE VALUE ====================

  describe('matchesCaseValue', () => {
    it('matches single value', () => {
      expect(matchesCaseValue('active', 'active')).toBe(true);
      expect(matchesCaseValue('active', 'inactive')).toBe(false);
    });

    it('matches value in array', () => {
      expect(matchesCaseValue('active', ['active', 'pending'])).toBe(true);
      expect(matchesCaseValue('deleted', ['active', 'pending'])).toBe(false);
    });

    it('matches with strict equality', () => {
      expect(matchesCaseValue(1, '1')).toBe(false);
      expect(matchesCaseValue(1, 1)).toBe(true);
    });
  });

  // ==================== HELPER FUNCTIONS ====================

  describe('condition helper functions', () => {
    it('eq creates equality condition', () => {
      expect(eq('status', 'active')).toEqual({ path: 'status', operator: 'eq', value: 'active' });
    });

    it('neq creates not-equal condition', () => {
      expect(neq('status', 'deleted')).toEqual({ path: 'status', operator: 'neq', value: 'deleted' });
    });

    it('gt creates greater-than condition', () => {
      expect(gt('age', 18)).toEqual({ path: 'age', operator: 'gt', value: 18 });
    });

    it('gte creates greater-than-or-equal condition', () => {
      expect(gte('age', 18)).toEqual({ path: 'age', operator: 'gte', value: 18 });
    });

    it('lt creates less-than condition', () => {
      expect(lt('price', 100)).toEqual({ path: 'price', operator: 'lt', value: 100 });
    });

    it('lte creates less-than-or-equal condition', () => {
      expect(lte('price', 100)).toEqual({ path: 'price', operator: 'lte', value: 100 });
    });

    it('isIn creates in-array condition', () => {
      expect(isIn('status', ['a', 'b'])).toEqual({ path: 'status', operator: 'in', value: ['a', 'b'] });
    });

    it('notIn creates not-in-array condition', () => {
      expect(notIn('status', ['a', 'b'])).toEqual({ path: 'status', operator: 'notIn', value: ['a', 'b'] });
    });

    it('exists creates exists condition', () => {
      expect(exists('name')).toEqual({ path: 'name', operator: 'exists' });
    });

    it('notExists creates not-exists condition', () => {
      expect(notExists('name')).toEqual({ path: 'name', operator: 'notExists' });
    });

    it('empty creates empty condition', () => {
      expect(empty('items')).toEqual({ path: 'items', operator: 'empty' });
    });

    it('notEmpty creates not-empty condition', () => {
      expect(notEmpty('items')).toEqual({ path: 'items', operator: 'notEmpty' });
    });
  });
});
