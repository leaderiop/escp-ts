/**
 * Yoga Layout Adapter
 *
 * Main adapter that integrates Yoga Layout with the escp-ts layout system.
 * This provides an alternative layout engine that uses Facebook's Yoga
 * flexbox implementation instead of the custom layout algorithm.
 *
 * Benefits:
 * - Battle-tested flexbox implementation from Meta
 * - Consistent behavior with CSS Flexbox specification
 * - Support for complex nested layouts
 * - Efficient C++ implementation via WebAssembly
 *
 * Usage:
 * ```typescript
 * const adapter = new YogaAdapter();
 * await adapter.init();
 *
 * const result = adapter.calculateLayout(layoutNode, {
 *   availableWidth: 2160,
 *   availableHeight: 3000,
 *   lineSpacing: 60,
 *   interCharSpace: 0,
 *   style: DEFAULT_STYLE,
 * });
 * ```
 */

import { loadYoga } from 'yoga-layout/load';
import type { Yoga, Config } from 'yoga-layout/load';
import type { LayoutNode } from '../nodes';
import { DEFAULT_STYLE, type ResolvedStyle } from '../nodes';
import type { LayoutResult } from './types';
import type { YogaLayoutContext } from './types';
import { buildYogaTree, freeYogaTree } from './YogaNodeBuilder';
import { extractLayoutResult } from './YogaResultExtractor';

/**
 * Options for configuring the YogaAdapter
 */
export interface YogaAdapterOptions {
  /**
   * Point scale factor for pixel grid rounding.
   * - Set to 1 (default) for precise dot positioning (ideal for printers)
   * - Set to 0 to disable pixel grid rounding
   * - Set to display density for screen rendering
   */
  pointScaleFactor?: number;
}

/**
 * Options for Yoga layout calculation
 */
export interface YogaLayoutOptions {
  /** Available width for layout in dots */
  availableWidth: number;
  /** Available height for layout in dots */
  availableHeight: number;
  /** Line spacing in dots (default text height) */
  lineSpacing: number;
  /** Inter-character spacing in dots */
  interCharSpace: number;
  /** Initial style for text nodes */
  style?: ResolvedStyle;
  /** Starting X position (default 0) */
  startX?: number;
  /** Starting Y position (default 0) */
  startY?: number;
}

/**
 * Yoga Layout Adapter
 *
 * Provides Yoga-based layout calculation for escp-ts layout trees.
 * Must be initialized before use via init() or initYoga().
 */
export class YogaAdapter {
  private yoga: Yoga | null = null;
  private config: Config | null = null;
  private initialized = false;
  private readonly options: Required<YogaAdapterOptions>;

  /**
   * Create a new YogaAdapter
   *
   * @param options - Configuration options for the adapter
   */
  constructor(options: YogaAdapterOptions = {}) {
    this.options = {
      pointScaleFactor: 1, // Precise dot positioning for printers
      ...options,
    };
  }

  /**
   * Initialize the Yoga module
   *
   * This loads the WebAssembly module and must be called before
   * any layout calculations. Safe to call multiple times.
   *
   * @returns Promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.yoga = await loadYoga();

    // Create shared config with printer-optimized settings
    this.config = this.yoga.Config.create();
    this.config.setPointScaleFactor(this.options.pointScaleFactor);

    this.initialized = true;
  }

  /**
   * Initialize with an existing Yoga instance
   *
   * Use this if you've already loaded Yoga elsewhere in your application.
   * Note: When using this method, a default config will be created.
   *
   * @param yoga - Pre-loaded Yoga module instance
   */
  initWithYoga(yoga: Yoga): void {
    this.yoga = yoga;

    // Create config with the pre-loaded Yoga instance
    this.config = yoga.Config.create();
    this.config.setPointScaleFactor(this.options.pointScaleFactor);

    this.initialized = true;
  }

  /**
   * Check if the adapter has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the Yoga instance (throws if not initialized)
   */
  private getYoga(): Yoga {
    if (!this.yoga) {
      throw new Error('YogaAdapter not initialized. Call init() or initWithYoga() first.');
    }
    return this.yoga;
  }

  /**
   * Get the Yoga config (may be null if not initialized)
   */
  getConfig(): Config | null {
    return this.config;
  }

  /**
   * Calculate layout for a layout node tree
   *
   * This is the main entry point for Yoga-based layout calculation.
   * It builds a Yoga node tree, calculates layout, extracts results,
   * and properly frees the Yoga nodes.
   *
   * @param node - The root layout node
   * @param options - Layout options
   * @returns LayoutResult tree with computed positions and sizes
   *
   * @example
   * ```typescript
   * const result = adapter.calculateLayout(
   *   stack().text('Hello').text('World').build(),
   *   {
   *     availableWidth: 2160,
   *     availableHeight: 3000,
   *     lineSpacing: 60,
   *     interCharSpace: 0,
   *   }
   * );
   * ```
   */
  calculateLayout(node: LayoutNode, options: YogaLayoutOptions): LayoutResult {
    const Yoga = this.getYoga();

    // Build context
    const ctx: YogaLayoutContext = {
      availableWidth: options.availableWidth,
      availableHeight: options.availableHeight,
      lineSpacing: options.lineSpacing,
      interCharSpace: options.interCharSpace,
      style: options.style ?? DEFAULT_STYLE,
    };

    // Build Yoga tree with config for proper node configuration
    const mapping = buildYogaTree(Yoga, node, ctx, this.config ?? undefined);

    try {
      // Calculate layout with Yoga
      mapping.yogaNode.calculateLayout(options.availableWidth, options.availableHeight);

      // Extract results
      const startX = options.startX ?? 0;
      const startY = options.startY ?? 0;
      return extractLayoutResult(mapping, startX, startY);
    } finally {
      // Always free Yoga nodes to prevent memory leaks, even on error
      freeYogaTree(mapping);
    }
  }

  /**
   * Calculate layout with automatic initialization
   *
   * Convenience method that initializes if needed and then calculates layout.
   * Use this for one-off layouts where you don't want to manage initialization.
   *
   * @param node - The root layout node
   * @param options - Layout options
   * @returns Promise<LayoutResult> tree with computed positions and sizes
   */
  async calculateLayoutAsync(node: LayoutNode, options: YogaLayoutOptions): Promise<LayoutResult> {
    await this.init();
    return this.calculateLayout(node, options);
  }

  /**
   * Dispose of resources
   *
   * Frees the Yoga config to prevent memory leaks.
   * After calling dispose(), the adapter cannot be used until re-initialized.
   */
  dispose(): void {
    if (this.config) {
      this.config.free();
      this.config = null;
    }
    this.initialized = false;
  }
}

/**
 * Create a pre-initialized YogaAdapter
 *
 * Convenience function for creating an initialized adapter.
 *
 * @param options - Configuration options for the adapter
 * @returns Promise<YogaAdapter> initialized adapter instance
 *
 * @example
 * ```typescript
 * const adapter = await createYogaAdapter();
 * const result = adapter.calculateLayout(node, options);
 * ```
 */
export async function createYogaAdapter(options?: YogaAdapterOptions): Promise<YogaAdapter> {
  const adapter = new YogaAdapter(options);
  await adapter.init();
  return adapter;
}

/**
 * One-shot layout calculation
 *
 * Convenience function for single layout calculations without
 * manually maintaining an adapter instance. Uses the default adapter
 * singleton for performance (avoids loading WASM on each call).
 *
 * @param node - The root layout node
 * @param options - Layout options
 * @returns Promise<LayoutResult> tree with computed positions and sizes
 *
 * @example
 * ```typescript
 * const result = await calculateYogaLayout(
 *   stack().text('Hello').build(),
 *   { availableWidth: 2160, availableHeight: 3000, lineSpacing: 60, interCharSpace: 0 }
 * );
 * ```
 */
export async function calculateYogaLayout(
  node: LayoutNode,
  options: YogaLayoutOptions
): Promise<LayoutResult> {
  // Use the default adapter singleton for performance
  // This avoids loading WASM on every call
  const adapter = await initDefaultAdapter();
  return adapter.calculateLayout(node, options);
}

/**
 * Default singleton adapter instance
 *
 * Use this when you want to share a single Yoga instance across
 * multiple layout calculations. Initialize once with initDefaultAdapter().
 */
let defaultAdapter: YogaAdapter | null = null;

/**
 * Promise for ongoing initialization (prevents race condition)
 */
let initializationPromise: Promise<YogaAdapter> | null = null;

/**
 * Initialize the default adapter singleton
 *
 * This function is safe to call concurrently - multiple calls will
 * share the same initialization promise to prevent race conditions.
 *
 * @returns Promise<YogaAdapter> the initialized default adapter
 */
export async function initDefaultAdapter(): Promise<YogaAdapter> {
  // Return existing adapter if already initialized
  if (defaultAdapter && defaultAdapter.isInitialized()) {
    return defaultAdapter;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization and store the promise to prevent race conditions
  initializationPromise = (async () => {
    try {
      defaultAdapter = new YogaAdapter();
      await defaultAdapter.init();
      return defaultAdapter;
    } catch (error) {
      // Clear state on error so retry is possible
      defaultAdapter = null;
      initializationPromise = null;
      throw error;
    }
  })();

  const adapter = await initializationPromise;
  // Clear the promise after successful initialization (adapter is now ready)
  initializationPromise = null;
  return adapter;
}

/**
 * Get the default adapter (throws if not initialized)
 *
 * @returns The initialized default adapter
 */
export function getDefaultAdapter(): YogaAdapter {
  if (!defaultAdapter || !defaultAdapter.isInitialized()) {
    throw new Error('Default YogaAdapter not initialized. Call initDefaultAdapter() first.');
  }
  return defaultAdapter;
}

/**
 * Reset the default adapter (for testing)
 *
 * Disposes the current default adapter and clears the reference.
 * Also clears any pending initialization promise.
 */
export function resetDefaultAdapter(): void {
  if (defaultAdapter) {
    defaultAdapter.dispose();
    defaultAdapter = null;
  }
  initializationPromise = null;
}
