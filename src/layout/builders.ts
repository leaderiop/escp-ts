/**
 * Fluent Builder Classes for ESC/P2 Layout System
 *
 * These builders provide a fluent API for constructing virtual layout trees.
 * Each builder creates a specific type of layout node (Stack, Flex)
 * and allows method chaining for configuration.
 */

import type {
  LayoutNode,
  StackNode,
  FlexNode,
  TextNode,
  SpacerNode,
  LineNode,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
  WidthSpec,
  HeightSpec,
  PaddingSpec,
  MarginSpec,
  HAlign,
  VAlign,
  JustifyContent,
  StyleProps,
  PositionMode,
  ContentCondition,
  TextOrientation,
  TextOverflow,
  DataCondition,
  DataContext,
  ContentResolver,
} from './nodes';

// ==================== TEXT OPTIONS ====================

/**
 * Options for creating text nodes
 */
export interface TextOptions extends StyleProps {
  /** Horizontal alignment */
  align?: HAlign;
  /** Width specification */
  width?: WidthSpec;
  /** Text orientation: 'horizontal' (default) or 'vertical' */
  orientation?: TextOrientation;
  /** Overflow behavior: 'visible' (default), 'clip', or 'ellipsis' */
  overflow?: TextOverflow;
}

// ==================== STACK BUILDER ====================

/**
 * Builder for Stack layout nodes
 *
 * Stack arranges children in a single direction (vertical by default).
 *
 * @example
 * ```typescript
 * stack()
 *   .align('center')
 *   .gap(10)
 *   .text('Title', { bold: true })
 *   .text('Subtitle')
 *   .build()
 * ```
 */
export class StackBuilder {
  private node: StackNode = {
    type: 'stack',
    direction: 'column',
    children: [],
  };

  // === LAYOUT CONFIGURATION ===

  /** Set stack direction */
  direction(dir: 'column' | 'row'): this {
    this.node.direction = dir;
    return this;
  }

  /** Set gap between children (in dots) */
  gap(dots: number): this {
    this.node.gap = dots;
    return this;
  }

  /** Set horizontal alignment of children */
  align(align: HAlign): this {
    this.node.align = align;
    return this;
  }

  /** Set vertical alignment of children (for row direction) */
  vAlign(align: VAlign): this {
    this.node.vAlign = align;
    return this;
  }

  /** Set width */
  width(w: WidthSpec): this {
    this.node.width = w;
    return this;
  }

  /** Set height */
  height(h: HeightSpec): this {
    this.node.height = h;
    return this;
  }

  /** Set padding */
  padding(p: PaddingSpec): this {
    this.node.padding = p;
    return this;
  }

  /** Set margin */
  margin(m: MarginSpec): this {
    this.node.margin = m;
    return this;
  }

  // === STYLE CONFIGURATION (inherited by children) ===

  /** Set bold style (inherited) */
  bold(on: boolean = true): this {
    this.node.bold = on;
    return this;
  }

  /** Set italic style (inherited) */
  italic(on: boolean = true): this {
    this.node.italic = on;
    return this;
  }

  /** Set underline style (inherited) */
  underline(on: boolean = true): this {
    this.node.underline = on;
    return this;
  }

  /** Set double width (inherited) */
  doubleWidth(on: boolean = true): this {
    this.node.doubleWidth = on;
    return this;
  }

  /** Set double height (inherited) */
  doubleHeight(on: boolean = true): this {
    this.node.doubleHeight = on;
    return this;
  }

  /** Set CPI (inherited) */
  cpi(value: number): this {
    this.node.cpi = value;
    return this;
  }

  // === SIZE CONSTRAINTS ===

  /** Set minimum width in dots */
  minWidth(dots: number): this {
    this.node.minWidth = dots;
    return this;
  }

  /** Set maximum width in dots */
  maxWidth(dots: number): this {
    this.node.maxWidth = dots;
    return this;
  }

  /** Set minimum height in dots */
  minHeight(dots: number): this {
    this.node.minHeight = dots;
    return this;
  }

  /** Set maximum height in dots */
  maxHeight(dots: number): this {
    this.node.maxHeight = dots;
    return this;
  }

  // === POSITIONING ===

  /** Set positioning mode: 'static' (default) or 'absolute' */
  position(mode: PositionMode): this {
    this.node.position = mode;
    return this;
  }

  /** Set absolute X position in dots */
  posX(dots: number): this {
    this.node.posX = dots;
    return this;
  }

  /** Set absolute Y position in dots */
  posY(dots: number): this {
    this.node.posY = dots;
    return this;
  }

  /**
   * Set absolute position (shorthand for position('absolute') + posX + posY)
   *
   * **PRINTER WARNING - USE WITH CAUTION**:
   * - Coordinates are relative to parent container, NOT page origin
   * - May create overlapping content which is unreadable on printed paper
   * - Absolute items are removed from document flow, affecting sibling layout
   * - Pagination may not correctly handle absolute positioned items
   *
   * For small visual adjustments, consider `relativePosition()` instead,
   * which keeps the element in document flow.
   */
  absolutePosition(x: number, y: number): this {
    this.node.position = 'absolute';
    this.node.posX = x;
    this.node.posY = y;
    return this;
  }

  /**
   * Set relative position with offsets (element stays in flow but rendered offset)
   *
   * **RECOMMENDED** for printer output. The element remains in document flow
   * (siblings are not affected) but is rendered at an offset from its calculated position.
   * This is safer than absolutePosition() for printer layouts.
   *
   * @example
   * ```typescript
   * // Nudge text down by 5 dots for visual alignment
   * text('Subscript').relativePosition(0, 5)
   * ```
   */
  relativePosition(offsetX: number, offsetY: number): this {
    this.node.position = 'relative';
    this.node.offsetX = offsetX;
    this.node.offsetY = offsetY;
    return this;
  }

  // === CONDITIONAL CONTENT ===

  /** Set condition for showing this node */
  when(condition: ContentCondition): this {
    this.node.when = condition;
    return this;
  }

  /** Set fallback node to show when condition is false */
  fallback(node: LayoutNode | StackBuilder | FlexBuilder): this {
    this.node.fallback = node instanceof StackBuilder || node instanceof FlexBuilder
      ? node.build()
      : node;
    return this;
  }

  // === CHILD NODES ===

  /** Add a text child */
  text(content: string, opts?: TextOptions): this {
    const textNode: TextNode = {
      type: 'text',
      content,
      ...opts,
    };
    this.node.children.push(textNode);
    return this;
  }

  /**
   * Add a text child with dynamic content from data context
   * The resolver function is called during node resolution with the data context
   *
   * @example
   * ```typescript
   * stack()
   *   .textFrom(ctx => `Hello, ${ctx.data.name}!`)
   *   .textFrom(ctx => `Item ${ctx.index + 1} of ${ctx.total}`)
   *   .build()
   * ```
   */
  textFrom<T = unknown>(resolver: ContentResolver<T>, opts?: TextOptions): this {
    const textNode: TextNode = {
      type: 'text',
      content: '', // Fallback if resolver not called
      contentResolver: resolver as ContentResolver,
      ...opts,
    };
    this.node.children.push(textNode);
    return this;
  }

  /** Add a spacer child */
  spacer(height?: number): this {
    const spacerNode: SpacerNode = {
      type: 'spacer',
      height,
    };
    this.node.children.push(spacerNode);
    return this;
  }

  /** Add a horizontal line */
  line(char: string = '-', length?: number | 'fill'): this {
    const lineNode: LineNode = {
      type: 'line',
      direction: 'horizontal',
      char,
      length,
    };
    this.node.children.push(lineNode);
    return this;
  }

  /** Add any layout node or builder as a child */
  add(child: LayoutNode | StackBuilder | FlexBuilder | GridBuilder): this {
    if (child instanceof StackBuilder || child instanceof FlexBuilder || child instanceof GridBuilder) {
      this.node.children.push(child.build());
    } else {
      this.node.children.push(child);
    }
    return this;
  }

  /** @deprecated Use add() instead. Add any layout node as a child */
  child(node: LayoutNode): this {
    return this.add(node);
  }

  /** Add a nested stack using a configure callback */
  stack(configure: (builder: StackBuilder) => void): this {
    const builder = new StackBuilder();
    configure(builder);
    this.node.children.push(builder.build());
    return this;
  }

  /** Add a nested flex using a configure callback */
  flex(configure: (builder: FlexBuilder) => void): this {
    const builder = new FlexBuilder();
    configure(builder);
    this.node.children.push(builder.build());
    return this;
  }

  /** Build and return the stack node */
  build(): StackNode {
    return this.node;
  }
}

// ==================== FLEX BUILDER ====================

/**
 * Builder for Flex layout nodes
 *
 * Flex arranges children horizontally with flexible distribution.
 *
 * @example
 * ```typescript
 * flex()
 *   .justify('space-between')
 *   .text('Left')
 *   .text('Right')
 *   .build()
 * ```
 */
export class FlexBuilder {
  private node: FlexNode = {
    type: 'flex',
    children: [],
  };

  // === LAYOUT CONFIGURATION ===

  /** Set gap between children (in dots) */
  gap(dots: number): this {
    this.node.gap = dots;
    return this;
  }

  /** Set horizontal distribution mode */
  justify(mode: JustifyContent): this {
    this.node.justify = mode;
    return this;
  }

  /** Set vertical alignment of items */
  alignItems(align: VAlign): this {
    this.node.alignItems = align;
    return this;
  }

  // NOTE: wrap() and rowGap() were removed because flex-wrap is incompatible
  // with printer pagination. Use Stack for multi-line layouts.

  /** Set width */
  width(w: WidthSpec): this {
    this.node.width = w;
    return this;
  }

  /** Set height */
  height(h: HeightSpec): this {
    this.node.height = h;
    return this;
  }

  /** Set padding */
  padding(p: PaddingSpec): this {
    this.node.padding = p;
    return this;
  }

  /** Set margin */
  margin(m: MarginSpec): this {
    this.node.margin = m;
    return this;
  }

  // === STYLE CONFIGURATION (inherited by children) ===

  /** Set bold style (inherited) */
  bold(on: boolean = true): this {
    this.node.bold = on;
    return this;
  }

  /** Set italic style (inherited) */
  italic(on: boolean = true): this {
    this.node.italic = on;
    return this;
  }

  /** Set underline style (inherited) */
  underline(on: boolean = true): this {
    this.node.underline = on;
    return this;
  }

  /** Set double width (inherited) */
  doubleWidth(on: boolean = true): this {
    this.node.doubleWidth = on;
    return this;
  }

  /** Set double height (inherited) */
  doubleHeight(on: boolean = true): this {
    this.node.doubleHeight = on;
    return this;
  }

  /** Set CPI (inherited) */
  cpi(value: number): this {
    this.node.cpi = value;
    return this;
  }

  // === SIZE CONSTRAINTS ===

  /** Set minimum width in dots */
  minWidth(dots: number): this {
    this.node.minWidth = dots;
    return this;
  }

  /** Set maximum width in dots */
  maxWidth(dots: number): this {
    this.node.maxWidth = dots;
    return this;
  }

  /** Set minimum height in dots */
  minHeight(dots: number): this {
    this.node.minHeight = dots;
    return this;
  }

  /** Set maximum height in dots */
  maxHeight(dots: number): this {
    this.node.maxHeight = dots;
    return this;
  }

  // === POSITIONING ===

  /** Set positioning mode: 'static' (default) or 'absolute' */
  position(mode: PositionMode): this {
    this.node.position = mode;
    return this;
  }

  /** Set absolute X position in dots */
  posX(dots: number): this {
    this.node.posX = dots;
    return this;
  }

  /** Set absolute Y position in dots */
  posY(dots: number): this {
    this.node.posY = dots;
    return this;
  }

  /**
   * Set absolute position (shorthand for position('absolute') + posX + posY)
   *
   * **PRINTER WARNING - USE WITH CAUTION**:
   * - Coordinates are relative to parent container, NOT page origin
   * - May create overlapping content which is unreadable on printed paper
   * - Absolute items are removed from document flow, affecting sibling layout
   * - Pagination may not correctly handle absolute positioned items
   *
   * For small visual adjustments, consider `relativePosition()` instead,
   * which keeps the element in document flow.
   */
  absolutePosition(x: number, y: number): this {
    this.node.position = 'absolute';
    this.node.posX = x;
    this.node.posY = y;
    return this;
  }

  /**
   * Set relative position with offsets (element stays in flow but rendered offset)
   *
   * **RECOMMENDED** for printer output. The element remains in document flow
   * (siblings are not affected) but is rendered at an offset from its calculated position.
   * This is safer than absolutePosition() for printer layouts.
   *
   * @example
   * ```typescript
   * // Nudge text down by 5 dots for visual alignment
   * text('Subscript').relativePosition(0, 5)
   * ```
   */
  relativePosition(offsetX: number, offsetY: number): this {
    this.node.position = 'relative';
    this.node.offsetX = offsetX;
    this.node.offsetY = offsetY;
    return this;
  }

  // === CONDITIONAL CONTENT ===

  /** Set condition for showing this node */
  when(condition: ContentCondition): this {
    this.node.when = condition;
    return this;
  }

  /** Set fallback node to show when condition is false */
  fallback(node: LayoutNode | StackBuilder | FlexBuilder): this {
    this.node.fallback = node instanceof StackBuilder || node instanceof FlexBuilder
      ? node.build()
      : node;
    return this;
  }

  // === CHILD NODES ===

  /** Add a text child */
  text(content: string, opts?: TextOptions): this {
    const textNode: TextNode = {
      type: 'text',
      content,
      ...opts,
    };
    this.node.children.push(textNode);
    return this;
  }

  /**
   * Add a text child with dynamic content from data context
   * The resolver function is called during node resolution with the data context
   *
   * @example
   * ```typescript
   * flex()
   *   .textFrom(ctx => ctx.data.label)
   *   .spacer()
   *   .textFrom(ctx => `$${ctx.data.price.toFixed(2)}`)
   *   .build()
   * ```
   */
  textFrom<T = unknown>(resolver: ContentResolver<T>, opts?: TextOptions): this {
    const textNode: TextNode = {
      type: 'text',
      content: '', // Fallback if resolver not called
      contentResolver: resolver as ContentResolver,
      ...opts,
    };
    this.node.children.push(textNode);
    return this;
  }

  /** Add a flexible spacer (grows to fill space) */
  spacer(width?: number): this {
    const spacerNode: SpacerNode = {
      type: 'spacer',
      width,
      flex: width === undefined,
    };
    this.node.children.push(spacerNode);
    return this;
  }

  /** Add any layout node or builder as a child */
  add(child: LayoutNode | StackBuilder | FlexBuilder | GridBuilder): this {
    if (child instanceof StackBuilder || child instanceof FlexBuilder || child instanceof GridBuilder) {
      this.node.children.push(child.build());
    } else {
      this.node.children.push(child);
    }
    return this;
  }

  /** @deprecated Use add() instead. Add any layout node as a child */
  child(node: LayoutNode): this {
    return this.add(node);
  }

  /** Add a nested stack using a configure callback */
  stack(configure: (builder: StackBuilder) => void): this {
    const builder = new StackBuilder();
    configure(builder);
    this.node.children.push(builder.build());
    return this;
  }

  /** Add a nested flex using a configure callback */
  flex(configure: (builder: FlexBuilder) => void): this {
    const builder = new FlexBuilder();
    configure(builder);
    this.node.children.push(builder.build());
    return this;
  }

  /** Build and return the flex node */
  build(): FlexNode {
    return this.node;
  }
}

// ==================== FACTORY FUNCTIONS ====================

/**
 * Create a new stack builder
 *
 * @example
 * ```typescript
 * stack()
 *   .align('center')
 *   .text('Hello')
 *   .text('World')
 *   .build()
 * ```
 */
export function stack(): StackBuilder {
  return new StackBuilder();
}

/**
 * Create a new flex builder
 *
 * @example
 * ```typescript
 * flex()
 *   .justify('space-between')
 *   .text('Left')
 *   .text('Right')
 *   .build()
 * ```
 */
export function flex(): FlexBuilder {
  return new FlexBuilder();
}

/**
 * Create a text node directly
 *
 * @example
 * ```typescript
 * text('Hello', { bold: true, align: 'center' })
 * ```
 */
export function text(content: string, opts?: TextOptions): TextNode {
  return {
    type: 'text',
    content,
    ...opts,
  };
}

/**
 * Create a spacer node directly
 *
 * @example
 * ```typescript
 * spacer(20) // Fixed 20-dot spacer
 * spacer()   // Flexible spacer (grows in flex)
 * ```
 */
export function spacer(size?: number, flex?: boolean): SpacerNode {
  return {
    type: 'spacer',
    width: size,
    height: size,
    flex: flex ?? (size === undefined),
  };
}

/**
 * Create a horizontal line node
 *
 * @example
 * ```typescript
 * line('-', 'fill') // Line that fills available width
 * line('=', 200)    // 200-dot line with '=' character
 * ```
 */
export function line(char: string = '-', length?: number | 'fill'): LineNode {
  return {
    type: 'line',
    direction: 'horizontal',
    char,
    length,
  };
}

// ==================== TEMPLATE BUILDER ====================

/**
 * Builder for Template nodes with {{variable}} interpolation
 *
 * @example
 * ```typescript
 * template('Hello {{name}}!')
 *   .data({ name: 'World' })
 *   .bold()
 *   .build()
 * ```
 */
export class TemplateBuilder {
  private node: TemplateNode;

  constructor(templateString: string) {
    this.node = {
      type: 'template',
      template: templateString,
    };
  }

  /** Set local data to merge with context data */
  data(d: Record<string, unknown>): this {
    this.node.data = d;
    return this;
  }

  /** Set horizontal alignment */
  align(a: HAlign): this {
    this.node.align = a;
    return this;
  }

  /** Set width */
  width(w: WidthSpec): this {
    this.node.width = w;
    return this;
  }

  /** Set padding */
  padding(p: PaddingSpec): this {
    this.node.padding = p;
    return this;
  }

  /** Set margin */
  margin(m: MarginSpec): this {
    this.node.margin = m;
    return this;
  }

  // === STYLE CONFIGURATION ===

  /** Set bold style */
  bold(on: boolean = true): this {
    this.node.bold = on;
    return this;
  }

  /** Set italic style */
  italic(on: boolean = true): this {
    this.node.italic = on;
    return this;
  }

  /** Set underline style */
  underline(on: boolean = true): this {
    this.node.underline = on;
    return this;
  }

  /** Set double width */
  doubleWidth(on: boolean = true): this {
    this.node.doubleWidth = on;
    return this;
  }

  /** Set double height */
  doubleHeight(on: boolean = true): this {
    this.node.doubleHeight = on;
    return this;
  }

  /** Set CPI */
  cpi(value: number): this {
    this.node.cpi = value;
    return this;
  }

  /** Build and return the template node */
  build(): TemplateNode {
    return this.node;
  }
}

// ==================== CONDITIONAL BUILDER ====================

/**
 * Builder for Conditional nodes with if/else-if/else branching
 *
 * @example
 * ```typescript
 * conditional()
 *   .if({ path: 'user.isPremium', operator: 'eq', value: true })
 *   .then(text('Premium Member!', { bold: true }))
 *   .else(text('Standard Member'))
 *   .build()
 * ```
 */
export class ConditionalBuilder {
  private node: ConditionalNode;

  constructor() {
    // Initialize with placeholder - will be set by if()
    this.node = {
      type: 'conditional',
      condition: () => false,
      then: { type: 'spacer', height: 0 },
    };
  }

  /** Set the primary condition using a DataCondition */
  if(condition: DataCondition | ((ctx: DataContext) => boolean)): this {
    this.node.condition = condition;
    return this;
  }

  /** Set the primary condition using path, operator, and value */
  ifPath(path: string, operator: DataCondition['operator'], value?: unknown): this {
    const condition: DataCondition = { path, operator, value };
    this.node.condition = condition;
    return this;
  }

  /** Set the node to render when condition is true */
  then(node: LayoutNode | StackBuilder | FlexBuilder): this {
    this.node.then = node instanceof StackBuilder || node instanceof FlexBuilder
      ? node.build()
      : node;
    return this;
  }

  /** Add an else-if branch */
  elseIf(
    condition: DataCondition | ((ctx: DataContext) => boolean),
    thenNode: LayoutNode | StackBuilder | FlexBuilder
  ): this {
    if (!this.node.elseIf) {
      this.node.elseIf = [];
    }
    this.node.elseIf.push({
      condition,
      then: thenNode instanceof StackBuilder || thenNode instanceof FlexBuilder
        ? thenNode.build()
        : thenNode,
    });
    return this;
  }

  /** Add an else-if branch using path, operator, and value */
  elseIfPath(
    path: string,
    operator: DataCondition['operator'],
    value: unknown,
    thenNode: LayoutNode | StackBuilder | FlexBuilder
  ): this {
    return this.elseIf({ path, operator, value }, thenNode);
  }

  /** Set the node to render when all conditions are false */
  else(node: LayoutNode | StackBuilder | FlexBuilder): this {
    this.node.else = node instanceof StackBuilder || node instanceof FlexBuilder
      ? node.build()
      : node;
    return this;
  }

  /** Build and return the conditional node */
  build(): ConditionalNode {
    return this.node;
  }
}

// ==================== SWITCH BUILDER ====================

/**
 * Builder for Switch nodes with case matching
 *
 * @example
 * ```typescript
 * switchOn('order.status')
 *   .case('pending', text('Pending'))
 *   .case('shipped', text('Shipped', { bold: true }))
 *   .case(['delivered', 'completed'], text('Done'))
 *   .default(text('Unknown'))
 *   .build()
 * ```
 */
export class SwitchBuilder {
  private node: SwitchNode;

  constructor(path: string) {
    this.node = {
      type: 'switch',
      path,
      cases: [],
    };
  }

  /** Add a case branch */
  case(
    value: unknown | unknown[],
    thenNode: LayoutNode | StackBuilder | FlexBuilder
  ): this {
    this.node.cases.push({
      value,
      then: thenNode instanceof StackBuilder || thenNode instanceof FlexBuilder
        ? thenNode.build()
        : thenNode,
    });
    return this;
  }

  /** Set the default node when no cases match */
  default(node: LayoutNode | StackBuilder | FlexBuilder): this {
    this.node.default = node instanceof StackBuilder || node instanceof FlexBuilder
      ? node.build()
      : node;
    return this;
  }

  /** Build and return the switch node */
  build(): SwitchNode {
    return this.node;
  }
}

// ==================== EACH BUILDER ====================

/**
 * Builder for Each nodes that iterate over arrays
 *
 * @example
 * ```typescript
 * each('order.items')
 *   .as('item')
 *   .render(
 *     flex()
 *       .add(template('{{item.name}}'))
 *       .spacer()
 *       .add(template('{{item.price | currency}}'))
 *   )
 *   .separator(line('-', 'fill'))
 *   .empty(text('No items'))
 *   .build()
 * ```
 */
export class EachBuilder {
  private node: EachNode;

  constructor(itemsPath: string) {
    this.node = {
      type: 'each',
      items: itemsPath,
      render: { type: 'spacer', height: 0 }, // Placeholder
    };
  }

  /** Set the variable name for current item (default: 'item') */
  as(name: string): this {
    this.node.as = name;
    return this;
  }

  /** Set the variable name for current index (default: 'index') */
  indexAs(name: string): this {
    this.node.indexAs = name;
    return this;
  }

  /** Set the node template to render for each item */
  render(node: LayoutNode | StackBuilder | FlexBuilder | TemplateBuilder): this {
    this.node.render = node instanceof StackBuilder || node instanceof FlexBuilder || node instanceof TemplateBuilder
      ? node.build()
      : node;
    return this;
  }

  /** Set the node to render when array is empty */
  empty(node: LayoutNode | StackBuilder | FlexBuilder): this {
    this.node.empty = node instanceof StackBuilder || node instanceof FlexBuilder
      ? node.build()
      : node;
    return this;
  }

  /** Set the separator node between items */
  separator(node: LayoutNode | StackBuilder | FlexBuilder): this {
    this.node.separator = node instanceof StackBuilder || node instanceof FlexBuilder
      ? node.build()
      : node;
    return this;
  }

  // === LAYOUT CONFIGURATION ===

  /** Set width */
  width(w: WidthSpec): this {
    this.node.width = w;
    return this;
  }

  /** Set padding */
  padding(p: PaddingSpec): this {
    this.node.padding = p;
    return this;
  }

  /** Set margin */
  margin(m: MarginSpec): this {
    this.node.margin = m;
    return this;
  }

  /** Build and return the each node */
  build(): EachNode {
    return this.node;
  }
}

// ==================== FACTORY FUNCTIONS FOR NEW BUILDERS ====================

/**
 * Create a new template builder for text with {{variable}} interpolation
 *
 * @param templateString - Template string with {{variable}} placeholders
 *
 * @example
 * ```typescript
 * template('Hello {{name}}!')
 *   .bold()
 *   .build()
 * ```
 */
export function template(templateString: string): TemplateBuilder {
  return new TemplateBuilder(templateString);
}

/**
 * Create a new conditional builder for if/else-if/else branching
 *
 * @example
 * ```typescript
 * conditional()
 *   .ifPath('user.isPremium', 'eq', true)
 *   .then(text('Premium!'))
 *   .else(text('Standard'))
 *   .build()
 * ```
 */
export function conditional(): ConditionalBuilder {
  return new ConditionalBuilder();
}

/**
 * Create a new switch builder for case matching
 *
 * @param path - Path to the value to switch on
 *
 * @example
 * ```typescript
 * switchOn('status')
 *   .case('active', text('Active'))
 *   .case('pending', text('Pending'))
 *   .default(text('Unknown'))
 *   .build()
 * ```
 */
export function switchOn(path: string): SwitchBuilder {
  return new SwitchBuilder(path);
}

/**
 * Create a new each builder for iterating over arrays
 *
 * @param itemsPath - Path to the array in data context
 *
 * @example
 * ```typescript
 * each('items')
 *   .as('item')
 *   .render(template('{{item.name}}: {{item.price | currency}}'))
 *   .empty(text('No items'))
 *   .build()
 * ```
 */
export function each(itemsPath: string): EachBuilder {
  return new EachBuilder(itemsPath);
}

// ============================================================================
// GridBuilder - Simple grid layout using Flex rows
// ============================================================================

interface GridCellOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  cpi?: 10 | 12 | 15;
}

interface GridCellData {
  content: string;
  options: GridCellOptions | null;
}

/**
 * GridBuilder creates a simple grid layout using stacked Flex rows.
 *
 * Note: This is a compatibility layer since native CSS Grid is not supported
 * by the Yoga layout engine. The grid is rendered as stacked flex rows.
 *
 * @example
 * ```typescript
 * grid([100, 'fill', 150])
 *   .columnGap(20)
 *   .rowGap(5)
 *   .cell('Name', { bold: true })
 *   .cell('Description', { bold: true })
 *   .cell('Price', { bold: true, align: 'right' })
 *   .headerRow()
 *   .cell('Widget').cell('A useful widget').cell('$10.00', { align: 'right' }).row()
 *   .build()
 * ```
 */
export class GridBuilder {
  private columnWidths: (number | 'fill')[];
  private colGap: number = 0;
  private rGap: number = 0;
  private rows: GridCellData[][] = [];
  private currentRow: GridCellData[] = [];

  constructor(columnWidths: (number | 'fill')[]) {
    this.columnWidths = columnWidths;
  }

  /** Set gap between columns */
  columnGap(gap: number): this {
    this.colGap = gap;
    return this;
  }

  /** Set gap between rows */
  rowGap(gap: number): this {
    this.rGap = gap;
    return this;
  }

  /** Add a cell to the current row */
  cell(content: string, options?: GridCellOptions): this {
    this.currentRow.push({ content, options: options ?? null });
    return this;
  }

  /** Finalize current row as header row */
  headerRow(): this {
    this.rows.push([...this.currentRow]);
    this.currentRow = [];
    return this;
  }

  /** Finalize current row as data row */
  row(): this {
    this.rows.push([...this.currentRow]);
    this.currentRow = [];
    return this;
  }

  /** Build the grid as a StackNode */
  build(): StackNode {
    const rowNodes: FlexNode[] = this.rows.map((row) => {
      const children: StackNode[] = row.map((cell, colIndex) => {
        const width = this.columnWidths[colIndex] ?? 'auto';
        const opts = cell.options;

        const textNode: TextNode = {
          type: 'text',
          content: cell.content,
        };

        // Only set properties if they have a value
        if (opts?.bold) textNode.bold = opts.bold;
        if (opts?.italic) textNode.italic = opts.italic;
        if (opts?.underline) textNode.underline = opts.underline;
        if (opts?.cpi) textNode.cpi = opts.cpi;

        // Wrap in stack to control width and alignment
        const wrapperNode: StackNode = {
          type: 'stack',
          children: [textNode],
          flexGrow: width === 'fill' ? 1 : 0,
          flexShrink: width === 'fill' ? 1 : 0,
          align: opts?.align ?? 'left',
        };

        // Only set width if it's a fixed number
        if (typeof width === 'number') {
          wrapperNode.width = width;
        }

        return wrapperNode;
      });

      const flexNode: FlexNode = {
        type: 'flex',
        children,
        gap: this.colGap,
        width: '100%',
      };

      return flexNode;
    });

    return {
      type: 'stack',
      children: rowNodes,
      gap: this.rGap,
      width: '100%',
    };
  }
}

/**
 * Create a grid layout with specified column widths.
 *
 * @param columnWidths - Array of column widths (number for fixed dots, 'fill' for flexible)
 * @returns GridBuilder instance
 *
 * @example
 * ```typescript
 * grid([60, 'fill', 100, 120])
 *   .columnGap(20)
 *   .rowGap(5)
 *   .cell('QTY', { bold: true, align: 'center' })
 *   .cell('DESCRIPTION', { bold: true })
 *   .cell('UNIT PRICE', { bold: true, align: 'right' })
 *   .cell('TOTAL', { bold: true, align: 'right' })
 *   .headerRow()
 *   .cell('5').cell('Widget').cell('$10.00').cell('$50.00').row()
 *   .build()
 * ```
 */
export function grid(columnWidths: (number | 'fill')[]): GridBuilder {
  return new GridBuilder(columnWidths);
}
