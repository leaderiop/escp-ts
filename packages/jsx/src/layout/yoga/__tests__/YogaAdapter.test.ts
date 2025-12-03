/**
 * Tests for YogaAdapter - Memory Safety
 *
 * These tests target Blackhole #1: Memory leak when exceptions occur
 * between buildYogaTree() and freeYogaTree() in calculateLayout.
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { YogaAdapter } from '../YogaAdapter';
import { DEFAULT_STYLE } from '../../nodes';
import type { LayoutNode } from '../../nodes';
import * as YogaResultExtractor from '../YogaResultExtractor';
import * as YogaNodeBuilder from '../YogaNodeBuilder';

let adapter: YogaAdapter;

const defaultOptions = {
  availableWidth: 100,
  availableHeight: 100,
  lineSpacing: 24,
  interCharSpace: 0,
  style: DEFAULT_STYLE,
};

beforeAll(async () => {
  adapter = new YogaAdapter();
  await adapter.init();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('YogaAdapter memory safety', () => {
  describe('Exception handling in calculateLayout', () => {
    it('should free Yoga nodes when extractLayoutResult throws', () => {
      const freeYogaTreeSpy = vi.spyOn(YogaNodeBuilder, 'freeYogaTree');
      vi.spyOn(YogaResultExtractor, 'extractLayoutResult').mockImplementation(() => {
        throw new Error('Extract error');
      });

      expect(() => {
        adapter.calculateLayout({ type: 'text', content: 'test' }, defaultOptions);
      }).toThrow('Extract error');

      expect(freeYogaTreeSpy).toHaveBeenCalledTimes(1);
    });

    it('should free Yoga nodes when Yoga calculateLayout throws', () => {
      const freeYogaTreeSpy = vi.spyOn(YogaNodeBuilder, 'freeYogaTree');
      const originalBuild = YogaNodeBuilder.buildYogaTree;
      vi.spyOn(YogaNodeBuilder, 'buildYogaTree').mockImplementation((...args) => {
        const mapping = originalBuild(...args);
        mapping.yogaNode.calculateLayout = () => {
          throw new Error('Yoga error');
        };
        return mapping;
      });

      expect(() => {
        adapter.calculateLayout({ type: 'text', content: 'test' }, defaultOptions);
      }).toThrow('Yoga error');

      expect(freeYogaTreeSpy).toHaveBeenCalledTimes(1);
    });

    it('should free Yoga nodes on success', () => {
      const freeYogaTreeSpy = vi.spyOn(YogaNodeBuilder, 'freeYogaTree');

      adapter.calculateLayout({ type: 'text', content: 'test' }, defaultOptions);

      expect(freeYogaTreeSpy).toHaveBeenCalledTimes(1);
    });

    it('should free all nodes in nested tree on error', () => {
      const freeYogaTreeSpy = vi.spyOn(YogaNodeBuilder, 'freeYogaTree');
      vi.spyOn(YogaResultExtractor, 'extractLayoutResult').mockImplementation(() => {
        throw new Error('Nested error');
      });

      const nestedNode: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'A' },
          {
            type: 'flex',
            children: [
              { type: 'text', content: 'B' },
              { type: 'text', content: 'C' },
            ],
          },
        ],
      };

      expect(() => {
        adapter.calculateLayout(nestedNode, defaultOptions);
      }).toThrow('Nested error');

      expect(freeYogaTreeSpy).toHaveBeenCalledTimes(1);
    });

    it('should rethrow original error after cleanup', () => {
      const originalError = new Error('Original error with stack');
      vi.spyOn(YogaResultExtractor, 'extractLayoutResult').mockImplementation(() => {
        throw originalError;
      });

      try {
        adapter.calculateLayout({ type: 'text', content: 'test' }, defaultOptions);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBe(originalError);
      }
    });
  });

  describe('Return value correctness', () => {
    it('should return correct result on success', () => {
      const result = adapter.calculateLayout({ type: 'text', content: 'Hello' }, defaultOptions);

      expect(result).toBeDefined();
      expect(result.node.type).toBe('text');
      expect(result.width).toBeGreaterThan(0);
    });

    it('should preserve result when cleanup runs', () => {
      const node: LayoutNode = { type: 'text', content: 'Test' };
      const result = adapter.calculateLayout(node, defaultOptions);

      expect(result.node).toBe(node);
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });
  });

  describe('Multiple sequential calls', () => {
    it('should free nodes independently for each call', () => {
      const freeYogaTreeSpy = vi.spyOn(YogaNodeBuilder, 'freeYogaTree');

      adapter.calculateLayout({ type: 'text', content: 'A' }, defaultOptions);
      adapter.calculateLayout({ type: 'text', content: 'B' }, defaultOptions);
      adapter.calculateLayout({ type: 'text', content: 'C' }, defaultOptions);

      expect(freeYogaTreeSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure calls', () => {
      let callCount = 0;
      const freeYogaTreeSpy = vi.spyOn(YogaNodeBuilder, 'freeYogaTree');

      // First successful call
      adapter.calculateLayout({ type: 'text', content: 'Success 1' }, defaultOptions);
      callCount++;

      // Failing call
      vi.spyOn(YogaResultExtractor, 'extractLayoutResult').mockImplementationOnce(() => {
        throw new Error('Fail');
      });

      try {
        adapter.calculateLayout({ type: 'text', content: 'Fail' }, defaultOptions);
      } catch {
        /* expected */
      }
      callCount++;

      // Second successful call - need to restore the mock
      vi.restoreAllMocks();
      vi.spyOn(YogaNodeBuilder, 'freeYogaTree');

      adapter.calculateLayout({ type: 'text', content: 'Success 2' }, defaultOptions);
      callCount++;

      // Each call should have freed its nodes
      expect(callCount).toBe(3);
    });
  });
});
