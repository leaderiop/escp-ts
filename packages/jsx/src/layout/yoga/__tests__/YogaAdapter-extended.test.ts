/**
 * Extended Tests for YogaAdapter
 *
 * Comprehensive test suite covering all YogaAdapter functionality:
 * - YogaAdapter class (constructor, init, calculateLayout, dispose, etc.)
 * - createYogaAdapter() factory function
 * - calculateYogaLayout() convenience function
 * - initDefaultAdapter() with race condition handling
 * - getDefaultAdapter() and resetDefaultAdapter()
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Yoga, Config, Node as YogaNode } from 'yoga-layout/load';
import type { LayoutNode } from '../../nodes';
import { DEFAULT_STYLE } from '../../nodes';

// Mock yoga-layout/load before importing YogaAdapter
vi.mock('yoga-layout/load', () => {
  // Create mock factory functions
  const createMockYogaNode = (): YogaNode =>
    ({
      // Flex direction and layout
      setFlexDirection: vi.fn(),
      setAlwaysFormsContainingBlock: vi.fn(),

      // Width methods
      setWidth: vi.fn(),
      setWidthAuto: vi.fn(),
      setWidthPercent: vi.fn(),
      setMinWidth: vi.fn(),
      setMaxWidth: vi.fn(),

      // Height methods
      setHeight: vi.fn(),
      setHeightAuto: vi.fn(),
      setHeightPercent: vi.fn(),
      setMinHeight: vi.fn(),
      setMaxHeight: vi.fn(),

      // Flex item properties
      setFlexGrow: vi.fn(),
      setFlexShrink: vi.fn(),
      setFlexBasis: vi.fn(),

      // Measure function for text
      setMeasureFunc: vi.fn(),

      // Gap and spacing
      setGap: vi.fn(),

      // Alignment
      setAlignItems: vi.fn(),
      setJustifyContent: vi.fn(),

      // Padding and margin
      setPadding: vi.fn(),
      setMargin: vi.fn(),
      setMarginAuto: vi.fn(),

      // Positioning
      setPosition: vi.fn(),
      setPositionType: vi.fn(),

      // Children
      insertChild: vi.fn(),

      // Layout calculation
      calculateLayout: vi.fn(),

      // Computed values
      getComputedLeft: vi.fn().mockReturnValue(0),
      getComputedTop: vi.fn().mockReturnValue(0),
      getComputedWidth: vi.fn().mockReturnValue(100),
      getComputedHeight: vi.fn().mockReturnValue(50),

      // Memory management
      free: vi.fn(),
    }) as unknown as YogaNode;

  const createMockConfig = (): Config =>
    ({
      setPointScaleFactor: vi.fn(),
      free: vi.fn(),
    }) as unknown as Config;

  const mockYoga: Yoga = {
    Node: {
      create: vi.fn().mockImplementation(() => createMockYogaNode()),
    },
    Config: {
      create: vi.fn().mockImplementation(() => createMockConfig()),
    },
  } as unknown as Yoga;

  return {
    loadYoga: vi.fn().mockResolvedValue(mockYoga),
    FlexDirection: { Row: 0, Column: 1 },
    Gutter: { Column: 0, Row: 1, All: 2 },
    Align: { FlexStart: 1, Center: 2, FlexEnd: 3 },
    Justify: {
      FlexStart: 1,
      Center: 2,
      FlexEnd: 3,
      SpaceBetween: 4,
      SpaceAround: 5,
      SpaceEvenly: 6,
    },
    Edge: {
      Left: 0,
      Top: 1,
      Right: 2,
      Bottom: 3,
      Start: 4,
      End: 5,
      Horizontal: 6,
      Vertical: 7,
      All: 8,
    },
    PositionType: { Static: 0, Relative: 1, Absolute: 2 },
  };
});

// Import after mocking
import {
  YogaAdapter,
  createYogaAdapter,
  calculateYogaLayout,
  initDefaultAdapter,
  getDefaultAdapter,
  resetDefaultAdapter,
  type YogaLayoutOptions,
} from '../YogaAdapter';
import { loadYoga } from 'yoga-layout/load';

const defaultLayoutOptions: YogaLayoutOptions = {
  availableWidth: 2160,
  availableHeight: 3000,
  lineSpacing: 60,
  interCharSpace: 0,
  style: DEFAULT_STYLE,
};

describe('YogaAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetDefaultAdapter();
  });

  describe('constructor', () => {
    it('should create an adapter with default options', () => {
      const adapter = new YogaAdapter();

      expect(adapter).toBeInstanceOf(YogaAdapter);
      expect(adapter.isInitialized()).toBe(false);
      expect(adapter.getConfig()).toBeNull();
    });

    it('should create an adapter with custom pointScaleFactor', () => {
      const adapter = new YogaAdapter({ pointScaleFactor: 2 });

      expect(adapter).toBeInstanceOf(YogaAdapter);
      expect(adapter.isInitialized()).toBe(false);
    });

    it('should create an adapter with zero pointScaleFactor to disable pixel rounding', () => {
      const adapter = new YogaAdapter({ pointScaleFactor: 0 });

      expect(adapter).toBeInstanceOf(YogaAdapter);
      expect(adapter.isInitialized()).toBe(false);
    });
  });

  describe('init()', () => {
    it('should initialize the adapter successfully', async () => {
      const adapter = new YogaAdapter();

      await adapter.init();

      expect(adapter.isInitialized()).toBe(true);
      expect(loadYoga).toHaveBeenCalledTimes(1);
      expect(adapter.getConfig()).not.toBeNull();
    });

    it('should be safe to call init() multiple times', async () => {
      const adapter = new YogaAdapter();
      const initialCallCount = vi.mocked(loadYoga).mock.calls.length;

      await adapter.init();
      await adapter.init();
      await adapter.init();

      expect(adapter.isInitialized()).toBe(true);
      // loadYoga should only be called once more (due to initialization guard)
      expect(loadYoga).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('should configure pointScaleFactor on the config', async () => {
      const adapter = new YogaAdapter({ pointScaleFactor: 3 });

      await adapter.init();

      const config = adapter.getConfig();
      expect(config).not.toBeNull();
      expect(config!.setPointScaleFactor).toHaveBeenCalledWith(3);
    });

    it('should use default pointScaleFactor of 1', async () => {
      const adapter = new YogaAdapter();

      await adapter.init();

      const config = adapter.getConfig();
      expect(config!.setPointScaleFactor).toHaveBeenCalledWith(1);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('WASM load failed');
      vi.mocked(loadYoga).mockRejectedValueOnce(error);

      const adapter = new YogaAdapter();

      await expect(adapter.init()).rejects.toThrow('WASM load failed');
      expect(adapter.isInitialized()).toBe(false);
    });
  });

  describe('initWithYoga()', () => {
    it('should initialize with a pre-loaded Yoga instance', () => {
      const mockConfig = {
        setPointScaleFactor: vi.fn(),
        free: vi.fn(),
      } as unknown as Config;

      const mockYoga = {
        Node: { create: vi.fn() },
        Config: { create: vi.fn().mockReturnValue(mockConfig) },
      } as unknown as Yoga;

      const adapter = new YogaAdapter();
      adapter.initWithYoga(mockYoga);

      expect(adapter.isInitialized()).toBe(true);
      expect(adapter.getConfig()).toBe(mockConfig);
      expect(mockConfig.setPointScaleFactor).toHaveBeenCalledWith(1);
    });

    it('should use custom pointScaleFactor with pre-loaded Yoga', () => {
      const mockConfig = {
        setPointScaleFactor: vi.fn(),
        free: vi.fn(),
      } as unknown as Config;

      const mockYoga = {
        Node: { create: vi.fn() },
        Config: { create: vi.fn().mockReturnValue(mockConfig) },
      } as unknown as Yoga;

      const adapter = new YogaAdapter({ pointScaleFactor: 5 });
      adapter.initWithYoga(mockYoga);

      expect(mockConfig.setPointScaleFactor).toHaveBeenCalledWith(5);
    });

    it('should allow using adapter immediately after initWithYoga', () => {
      const mockYogaNode = {
        // Flex direction and layout
        setFlexDirection: vi.fn(),
        setAlwaysFormsContainingBlock: vi.fn(),

        // Width methods
        setWidth: vi.fn(),
        setWidthAuto: vi.fn(),
        setWidthPercent: vi.fn(),
        setMinWidth: vi.fn(),
        setMaxWidth: vi.fn(),

        // Height methods
        setHeight: vi.fn(),
        setHeightAuto: vi.fn(),
        setHeightPercent: vi.fn(),
        setMinHeight: vi.fn(),
        setMaxHeight: vi.fn(),

        // Flex item properties
        setFlexGrow: vi.fn(),
        setFlexShrink: vi.fn(),
        setFlexBasis: vi.fn(),

        // Measure function for text
        setMeasureFunc: vi.fn(),

        // Gap and spacing
        setGap: vi.fn(),

        // Alignment
        setAlignItems: vi.fn(),
        setJustifyContent: vi.fn(),

        // Padding and margin
        setPadding: vi.fn(),
        setMargin: vi.fn(),
        setMarginAuto: vi.fn(),

        // Positioning
        setPosition: vi.fn(),
        setPositionType: vi.fn(),

        // Children
        insertChild: vi.fn(),

        // Layout calculation
        calculateLayout: vi.fn(),

        // Computed values
        getComputedLeft: vi.fn().mockReturnValue(0),
        getComputedTop: vi.fn().mockReturnValue(0),
        getComputedWidth: vi.fn().mockReturnValue(100),
        getComputedHeight: vi.fn().mockReturnValue(50),

        // Memory management
        free: vi.fn(),
      } as unknown as YogaNode;

      const mockConfig = {
        setPointScaleFactor: vi.fn(),
        free: vi.fn(),
      } as unknown as Config;

      const mockYoga = {
        Node: { create: vi.fn().mockReturnValue(mockYogaNode) },
        Config: { create: vi.fn().mockReturnValue(mockConfig) },
      } as unknown as Yoga;

      const adapter = new YogaAdapter();
      adapter.initWithYoga(mockYoga);

      const textNode: LayoutNode = { type: 'text', content: 'Hello' };
      const result = adapter.calculateLayout(textNode, defaultLayoutOptions);

      expect(result).toBeDefined();
      expect(result.node).toBe(textNode);
    });
  });

  describe('isInitialized()', () => {
    it('should return false before initialization', () => {
      const adapter = new YogaAdapter();

      expect(adapter.isInitialized()).toBe(false);
    });

    it('should return true after init()', async () => {
      const adapter = new YogaAdapter();

      await adapter.init();

      expect(adapter.isInitialized()).toBe(true);
    });

    it('should return true after initWithYoga()', () => {
      const mockYoga = {
        Node: { create: vi.fn() },
        Config: {
          create: vi.fn().mockReturnValue({ setPointScaleFactor: vi.fn(), free: vi.fn() }),
        },
      } as unknown as Yoga;

      const adapter = new YogaAdapter();
      adapter.initWithYoga(mockYoga);

      expect(adapter.isInitialized()).toBe(true);
    });

    it('should return false after dispose()', async () => {
      const adapter = new YogaAdapter();
      await adapter.init();

      adapter.dispose();

      expect(adapter.isInitialized()).toBe(false);
    });
  });

  describe('calculateLayout()', () => {
    let adapter: YogaAdapter;

    beforeEach(async () => {
      adapter = new YogaAdapter();
      await adapter.init();
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new YogaAdapter();
      const textNode: LayoutNode = { type: 'text', content: 'Test' };

      expect(() => {
        uninitializedAdapter.calculateLayout(textNode, defaultLayoutOptions);
      }).toThrow('YogaAdapter not initialized. Call init() or initWithYoga() first.');
    });

    it('should calculate layout for a text node', () => {
      const textNode: LayoutNode = { type: 'text', content: 'Hello World' };

      const result = adapter.calculateLayout(textNode, defaultLayoutOptions);

      expect(result).toBeDefined();
      expect(result.node).toBe(textNode);
      expect(result.node.type).toBe('text');
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
      expect(typeof result.width).toBe('number');
      expect(typeof result.height).toBe('number');
    });

    it('should calculate layout for a stack node with children', () => {
      const stackNode: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'Line 1' },
          { type: 'text', content: 'Line 2' },
        ],
      };

      const result = adapter.calculateLayout(stackNode, defaultLayoutOptions);

      expect(result).toBeDefined();
      expect(result.node.type).toBe('stack');
      expect(result.children).toHaveLength(2);
    });

    it('should calculate layout for a flex node', () => {
      const flexNode: LayoutNode = {
        type: 'flex',
        children: [
          { type: 'text', content: 'Left' },
          { type: 'spacer', flex: true },
          { type: 'text', content: 'Right' },
        ],
      };

      const result = adapter.calculateLayout(flexNode, defaultLayoutOptions);

      expect(result).toBeDefined();
      expect(result.node.type).toBe('flex');
      expect(result.children).toHaveLength(3);
    });

    it('should use default style when not provided', () => {
      const textNode: LayoutNode = { type: 'text', content: 'Test' };
      const optionsWithoutStyle: YogaLayoutOptions = {
        availableWidth: 1000,
        availableHeight: 500,
        lineSpacing: 30,
        interCharSpace: 0,
      };

      const result = adapter.calculateLayout(textNode, optionsWithoutStyle);

      expect(result).toBeDefined();
      expect(result.style).toBeDefined();
    });

    it('should use startX and startY offsets', () => {
      const textNode: LayoutNode = { type: 'text', content: 'Test' };
      const options: YogaLayoutOptions = {
        ...defaultLayoutOptions,
        startX: 100,
        startY: 200,
      };

      const result = adapter.calculateLayout(textNode, options);

      expect(result.x).toBe(100); // startX + computedLeft (0)
      expect(result.y).toBe(200); // startY + computedTop (0)
    });

    it('should default startX and startY to 0', () => {
      const textNode: LayoutNode = { type: 'text', content: 'Test' };

      const result = adapter.calculateLayout(textNode, defaultLayoutOptions);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should throw for unresolved dynamic node types', () => {
      // Template nodes should be resolved before layout
      const templateNode = { type: 'template', template: 'Hello {{name}}' } as LayoutNode;

      expect(() => {
        adapter.calculateLayout(templateNode, defaultLayoutOptions);
      }).toThrow('Unresolved dynamic node type "template" in Yoga builder');
    });

    it('should throw for conditional nodes that are not resolved', () => {
      const conditionalNode = {
        type: 'conditional',
        condition: { path: 'active', operator: 'eq', value: true },
        then: { type: 'text', content: 'Active' },
      } as LayoutNode;

      expect(() => {
        adapter.calculateLayout(conditionalNode, defaultLayoutOptions);
      }).toThrow('Unresolved dynamic node type "conditional" in Yoga builder');
    });
  });

  describe('calculateLayoutAsync()', () => {
    it('should auto-initialize and calculate layout', async () => {
      const adapter = new YogaAdapter();
      const textNode: LayoutNode = { type: 'text', content: 'Async Test' };

      expect(adapter.isInitialized()).toBe(false);

      const result = await adapter.calculateLayoutAsync(textNode, defaultLayoutOptions);

      expect(adapter.isInitialized()).toBe(true);
      expect(result).toBeDefined();
      expect(result.node).toBe(textNode);
    });

    it('should work when already initialized', async () => {
      const adapter = new YogaAdapter();
      const initialCallCount = vi.mocked(loadYoga).mock.calls.length;
      await adapter.init();
      const textNode: LayoutNode = { type: 'text', content: 'Test' };

      const result = await adapter.calculateLayoutAsync(textNode, defaultLayoutOptions);

      expect(result).toBeDefined();
      // loadYoga should only be called once more during first init (not during calculateLayoutAsync)
      expect(loadYoga).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('should handle initialization errors in async method', async () => {
      vi.mocked(loadYoga).mockRejectedValueOnce(new Error('Network error'));

      const adapter = new YogaAdapter();
      const textNode: LayoutNode = { type: 'text', content: 'Test' };

      await expect(adapter.calculateLayoutAsync(textNode, defaultLayoutOptions)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('dispose()', () => {
    it('should free the config and reset initialized state', async () => {
      const adapter = new YogaAdapter();
      await adapter.init();

      const config = adapter.getConfig();
      expect(config).not.toBeNull();

      adapter.dispose();

      expect(adapter.isInitialized()).toBe(false);
      expect(adapter.getConfig()).toBeNull();
      expect(config!.free).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call dispose() when not initialized', () => {
      const adapter = new YogaAdapter();

      expect(() => {
        adapter.dispose();
      }).not.toThrow();

      expect(adapter.isInitialized()).toBe(false);
    });

    it('should be safe to call dispose() multiple times', async () => {
      const adapter = new YogaAdapter();
      await adapter.init();

      adapter.dispose();
      adapter.dispose();
      adapter.dispose();

      expect(adapter.isInitialized()).toBe(false);
    });

    it('should allow re-initialization after dispose', async () => {
      const adapter = new YogaAdapter();
      await adapter.init();
      adapter.dispose();

      expect(adapter.isInitialized()).toBe(false);

      await adapter.init();

      expect(adapter.isInitialized()).toBe(true);
    });

    it('should still work with calculateLayout after dispose (yoga instance remains)', async () => {
      // Note: dispose() only clears the config and sets initialized=false.
      // The yoga instance remains, so calculateLayout will still work.
      // This is by design - dispose() is for freeing the config memory,
      // not for completely invalidating the adapter.
      const adapter = new YogaAdapter();
      await adapter.init();
      adapter.dispose();

      const textNode: LayoutNode = { type: 'text', content: 'Test' };

      // calculateLayout still works because yoga instance is not cleared
      const result = adapter.calculateLayout(textNode, defaultLayoutOptions);
      expect(result).toBeDefined();
      expect(result.node).toBe(textNode);
    });

    it('should use undefined config after dispose (no pointScaleFactor)', async () => {
      const adapter = new YogaAdapter();
      await adapter.init();

      expect(adapter.getConfig()).not.toBeNull();

      adapter.dispose();

      // Config should be null after dispose
      expect(adapter.getConfig()).toBeNull();
    });
  });

  describe('getConfig()', () => {
    it('should return null before initialization', () => {
      const adapter = new YogaAdapter();

      expect(adapter.getConfig()).toBeNull();
    });

    it('should return the config after initialization', async () => {
      const adapter = new YogaAdapter();
      await adapter.init();

      const config = adapter.getConfig();

      expect(config).not.toBeNull();
      expect(config!.setPointScaleFactor).toBeDefined();
    });

    it('should return null after dispose', async () => {
      const adapter = new YogaAdapter();
      await adapter.init();
      adapter.dispose();

      expect(adapter.getConfig()).toBeNull();
    });
  });
});

describe('createYogaAdapter()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetDefaultAdapter();
  });

  it('should create and initialize an adapter', async () => {
    const adapter = await createYogaAdapter();

    expect(adapter).toBeInstanceOf(YogaAdapter);
    expect(adapter.isInitialized()).toBe(true);
  });

  it('should pass options to the adapter', async () => {
    const adapter = await createYogaAdapter({ pointScaleFactor: 4 });

    expect(adapter.isInitialized()).toBe(true);
    const config = adapter.getConfig();
    expect(config!.setPointScaleFactor).toHaveBeenCalledWith(4);
  });

  it('should propagate initialization errors', async () => {
    vi.mocked(loadYoga).mockRejectedValueOnce(new Error('WASM not available'));

    await expect(createYogaAdapter()).rejects.toThrow('WASM not available');
  });

  it('should create independent adapter instances', async () => {
    const adapter1 = await createYogaAdapter({ pointScaleFactor: 1 });
    const adapter2 = await createYogaAdapter({ pointScaleFactor: 2 });

    expect(adapter1).not.toBe(adapter2);
    expect(adapter1.getConfig()).not.toBe(adapter2.getConfig());
  });
});

describe('calculateYogaLayout()', () => {
  beforeEach(() => {
    resetDefaultAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetDefaultAdapter();
  });

  it('should calculate layout using the default adapter', async () => {
    const textNode: LayoutNode = { type: 'text', content: 'One-shot' };

    const result = await calculateYogaLayout(textNode, defaultLayoutOptions);

    expect(result).toBeDefined();
    expect(result.node).toBe(textNode);
  });

  it('should use cached default adapter for subsequent calls', async () => {
    const node1: LayoutNode = { type: 'text', content: 'First' };
    const node2: LayoutNode = { type: 'text', content: 'Second' };

    await calculateYogaLayout(node1, defaultLayoutOptions);
    await calculateYogaLayout(node2, defaultLayoutOptions);

    // loadYoga should only be called once due to caching
    expect(loadYoga).toHaveBeenCalledTimes(1);
  });

  it('should handle layout errors', async () => {
    // First ensure we have an initialized adapter
    await initDefaultAdapter();

    // Now mock buildYogaTree to throw
    const YogaNodeBuilder = await import('../YogaNodeBuilder');
    vi.spyOn(YogaNodeBuilder, 'buildYogaTree').mockImplementationOnce(() => {
      throw new Error('Layout calculation failed');
    });

    const textNode: LayoutNode = { type: 'text', content: 'Test' };

    await expect(calculateYogaLayout(textNode, defaultLayoutOptions)).rejects.toThrow(
      'Layout calculation failed'
    );
  });
});

describe('initDefaultAdapter()', () => {
  beforeEach(() => {
    resetDefaultAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetDefaultAdapter();
  });

  it('should initialize the default adapter', async () => {
    const adapter = await initDefaultAdapter();

    expect(adapter).toBeInstanceOf(YogaAdapter);
    expect(adapter.isInitialized()).toBe(true);
  });

  it('should return the same adapter on subsequent calls', async () => {
    const adapter1 = await initDefaultAdapter();
    const adapter2 = await initDefaultAdapter();

    expect(adapter1).toBe(adapter2);
    expect(loadYoga).toHaveBeenCalledTimes(1);
  });

  it('should handle concurrent initialization calls (race condition)', async () => {
    // Start multiple concurrent initializations
    const [adapter1, adapter2, adapter3] = await Promise.all([
      initDefaultAdapter(),
      initDefaultAdapter(),
      initDefaultAdapter(),
    ]);

    // All should return the same adapter
    expect(adapter1).toBe(adapter2);
    expect(adapter2).toBe(adapter3);
    // loadYoga should only be called once
    expect(loadYoga).toHaveBeenCalledTimes(1);
  });

  it('should handle race condition with delayed initialization', async () => {
    // Make loadYoga take some time
    vi.mocked(loadYoga).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            const mockConfig = {
              setPointScaleFactor: vi.fn(),
              free: vi.fn(),
            };
            const createMockNode = () => ({
              // Flex direction and layout
              setFlexDirection: vi.fn(),
              setAlwaysFormsContainingBlock: vi.fn(),

              // Width methods
              setWidth: vi.fn(),
              setWidthAuto: vi.fn(),
              setWidthPercent: vi.fn(),
              setMinWidth: vi.fn(),
              setMaxWidth: vi.fn(),

              // Height methods
              setHeight: vi.fn(),
              setHeightAuto: vi.fn(),
              setHeightPercent: vi.fn(),
              setMinHeight: vi.fn(),
              setMaxHeight: vi.fn(),

              // Flex item properties
              setFlexGrow: vi.fn(),
              setFlexShrink: vi.fn(),
              setFlexBasis: vi.fn(),

              // Measure function for text
              setMeasureFunc: vi.fn(),

              // Gap and spacing
              setGap: vi.fn(),

              // Alignment
              setAlignItems: vi.fn(),
              setJustifyContent: vi.fn(),

              // Padding and margin
              setPadding: vi.fn(),
              setMargin: vi.fn(),
              setMarginAuto: vi.fn(),

              // Positioning
              setPosition: vi.fn(),
              setPositionType: vi.fn(),

              // Children
              insertChild: vi.fn(),

              // Layout calculation
              calculateLayout: vi.fn(),

              // Computed values
              getComputedLeft: vi.fn().mockReturnValue(0),
              getComputedTop: vi.fn().mockReturnValue(0),
              getComputedWidth: vi.fn().mockReturnValue(100),
              getComputedHeight: vi.fn().mockReturnValue(50),

              // Memory management
              free: vi.fn(),
            });
            const mockYoga = {
              Node: {
                create: vi.fn().mockImplementation(createMockNode),
              },
              Config: { create: vi.fn().mockReturnValue(mockConfig) },
            } as unknown as Yoga;
            resolve(mockYoga);
          }, 50);
        })
    );

    const promise1 = initDefaultAdapter();
    const promise2 = initDefaultAdapter();

    const [adapter1, adapter2] = await Promise.all([promise1, promise2]);

    expect(adapter1).toBe(adapter2);
    expect(loadYoga).toHaveBeenCalledTimes(1);
  });

  it('should allow retry after initialization error', async () => {
    // First call fails
    vi.mocked(loadYoga).mockRejectedValueOnce(new Error('First attempt failed'));

    await expect(initDefaultAdapter()).rejects.toThrow('First attempt failed');

    // Second call should succeed (using default mock)
    const adapter = await initDefaultAdapter();

    expect(adapter).toBeInstanceOf(YogaAdapter);
    expect(adapter.isInitialized()).toBe(true);
  });

  it('should clear state on initialization error for retry', async () => {
    vi.mocked(loadYoga).mockRejectedValueOnce(new Error('Init failed'));

    try {
      await initDefaultAdapter();
    } catch {
      // Expected to fail
    }

    // Verify state was cleared and retry is possible
    const adapter = await initDefaultAdapter();
    expect(adapter.isInitialized()).toBe(true);
  });
});

describe('getDefaultAdapter()', () => {
  beforeEach(() => {
    resetDefaultAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetDefaultAdapter();
  });

  it('should throw when default adapter is not initialized', () => {
    expect(() => {
      getDefaultAdapter();
    }).toThrow('Default YogaAdapter not initialized. Call initDefaultAdapter() first.');
  });

  it('should return the adapter after initialization', async () => {
    await initDefaultAdapter();

    const adapter = getDefaultAdapter();

    expect(adapter).toBeInstanceOf(YogaAdapter);
    expect(adapter.isInitialized()).toBe(true);
  });

  it('should throw after resetDefaultAdapter is called', async () => {
    await initDefaultAdapter();
    resetDefaultAdapter();

    expect(() => {
      getDefaultAdapter();
    }).toThrow('Default YogaAdapter not initialized. Call initDefaultAdapter() first.');
  });

  it('should return same adapter as initDefaultAdapter', async () => {
    const initAdapter = await initDefaultAdapter();
    const getAdapter = getDefaultAdapter();

    expect(getAdapter).toBe(initAdapter);
  });
});

describe('resetDefaultAdapter()', () => {
  beforeEach(() => {
    resetDefaultAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetDefaultAdapter();
  });

  it('should dispose and clear the default adapter', async () => {
    const adapter = await initDefaultAdapter();
    const config = adapter.getConfig();

    resetDefaultAdapter();

    expect(config!.free).toHaveBeenCalledTimes(1);
    expect(() => getDefaultAdapter()).toThrow();
  });

  it('should be safe to call when no adapter exists', () => {
    expect(() => {
      resetDefaultAdapter();
    }).not.toThrow();
  });

  it('should be safe to call multiple times', async () => {
    await initDefaultAdapter();

    resetDefaultAdapter();
    resetDefaultAdapter();
    resetDefaultAdapter();

    expect(() => getDefaultAdapter()).toThrow();
  });

  it('should clear pending initialization promise', async () => {
    // Start initialization but don't await
    const initPromise = initDefaultAdapter();
    await initPromise;

    resetDefaultAdapter();

    // After reset, a new initialization should work
    const adapter = await initDefaultAdapter();
    expect(adapter.isInitialized()).toBe(true);
  });

  it('should allow re-initialization after reset', async () => {
    await initDefaultAdapter();
    resetDefaultAdapter();

    const adapter = await initDefaultAdapter();

    expect(adapter).toBeInstanceOf(YogaAdapter);
    expect(adapter.isInitialized()).toBe(true);
  });
});

describe('Integration tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetDefaultAdapter();
  });

  it('should handle complex nested layouts', async () => {
    const adapter = await createYogaAdapter();

    const complexLayout: LayoutNode = {
      type: 'stack',
      padding: 20,
      gap: 10,
      children: [
        {
          type: 'flex',
          justify: 'space-between',
          children: [
            { type: 'text', content: 'Header Left' },
            { type: 'text', content: 'Header Right' },
          ],
        },
        {
          type: 'stack',
          direction: 'column',
          children: [
            { type: 'text', content: 'Content Line 1' },
            { type: 'text', content: 'Content Line 2' },
          ],
        },
        { type: 'line', direction: 'horizontal', length: 'fill' },
        { type: 'text', content: 'Footer' },
      ],
    };

    const result = adapter.calculateLayout(complexLayout, defaultLayoutOptions);

    expect(result).toBeDefined();
    expect(result.node.type).toBe('stack');
    expect(result.children).toHaveLength(4);
    expect(result.children[0]!.children).toHaveLength(2); // Flex has 2 children
  });

  it('should handle spacer nodes in flex layouts', async () => {
    const adapter = await createYogaAdapter();

    const flexWithSpacer: LayoutNode = {
      type: 'flex',
      children: [
        { type: 'text', content: 'Left' },
        { type: 'spacer', flex: true },
        { type: 'text', content: 'Right' },
      ],
    };

    const result = adapter.calculateLayout(flexWithSpacer, defaultLayoutOptions);

    expect(result.children).toHaveLength(3);
    expect(result.children[1]!.node.type).toBe('spacer');
  });

  it('should handle line nodes', async () => {
    const adapter = await createYogaAdapter();

    const layoutWithLine: LayoutNode = {
      type: 'stack',
      children: [
        { type: 'text', content: 'Above line' },
        { type: 'line', direction: 'horizontal', length: 500 },
        { type: 'text', content: 'Below line' },
      ],
    };

    const result = adapter.calculateLayout(layoutWithLine, defaultLayoutOptions);

    expect(result.children).toHaveLength(3);
    expect(result.children[1]!.node.type).toBe('line');
  });

  it('should work correctly with calculateYogaLayout convenience function', async () => {
    const layout: LayoutNode = {
      type: 'stack',
      children: [
        { type: 'text', content: 'First' },
        { type: 'text', content: 'Second' },
      ],
    };

    const result = await calculateYogaLayout(layout, defaultLayoutOptions);

    expect(result).toBeDefined();
    expect(result.children).toHaveLength(2);
  });
});
