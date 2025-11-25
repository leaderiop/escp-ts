/**
 * Fluent Builder Classes for ESC/P2 Layout System
 *
 * These builders provide a fluent API for constructing virtual layout trees.
 * Each builder creates a specific type of layout node (Stack, Flex, Grid)
 * and allows method chaining for configuration.
 */

import type {
  LayoutNode,
  StackNode,
  FlexNode,
  GridNode,
  GridRowNode,
  TextNode,
  SpacerNode,
  LineNode,
  WidthSpec,
  HeightSpec,
  PaddingSpec,
  HAlign,
  VAlign,
  JustifyContent,
  StyleProps,
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
}

/**
 * Options for grid cells
 */
export interface CellOptions extends StyleProps {
  /** Horizontal alignment within cell */
  align?: HAlign;
  /** Vertical alignment within cell */
  vAlign?: VAlign;
  /** Column span (default: 1) */
  colSpan?: number;
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

  /** Add a nested grid using a configure callback */
  grid(columns: WidthSpec[], configure: (builder: GridBuilder) => void): this {
    const builder = new GridBuilder(columns);
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

  /** Add a nested grid using a configure callback */
  grid(columns: WidthSpec[], configure: (builder: GridBuilder) => void): this {
    const builder = new GridBuilder(columns);
    configure(builder);
    this.node.children.push(builder.build());
    return this;
  }

  /** Build and return the flex node */
  build(): FlexNode {
    return this.node;
  }
}

// ==================== GRID BUILDER ====================

/**
 * Builder for Grid layout nodes (table-like)
 *
 * Grid arranges children in a table with defined columns and rows.
 *
 * @example
 * ```typescript
 * grid([200, 'fill', 150])
 *   .columnGap(10)
 *   .rowGap(5)
 *   .cell('Qty', { bold: true }).cell('Item', { bold: true }).cell('Price', { bold: true }).row()
 *   .cell('5').cell('Widget A').cell('$10.00', { align: 'right' }).row()
 *   .build()
 * ```
 */
export class GridBuilder {
  private node: GridNode;
  private currentRow: LayoutNode[] = [];
  private currentRowStyle: StyleProps = {};
  private isHeaderRow: boolean = false;

  constructor(columns: WidthSpec[]) {
    this.node = {
      type: 'grid',
      columns,
      rows: [],
    };
  }

  // === LAYOUT CONFIGURATION ===

  /** Set gap between columns (in dots) */
  columnGap(dots: number): this {
    this.node.columnGap = dots;
    return this;
  }

  /** Set gap between rows (in dots) */
  rowGap(dots: number): this {
    this.node.rowGap = dots;
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

  /** Set CPI (inherited) */
  cpi(value: number): this {
    this.node.cpi = value;
    return this;
  }

  // === ROW/CELL BUILDING ===

  /** Add a cell to the current row - accepts string, node, or builder */
  cell(content: string | LayoutNode | StackBuilder | FlexBuilder | GridBuilder, opts?: CellOptions): this {
    let cellNode: LayoutNode;

    if (typeof content === 'string') {
      cellNode = {
        type: 'text',
        content,
        align: opts?.align,
        ...opts,
      } as TextNode;
    } else if (content instanceof StackBuilder || content instanceof FlexBuilder || content instanceof GridBuilder) {
      cellNode = content.build();
    } else {
      cellNode = content;
    }

    this.currentRow.push(cellNode);
    return this;
  }

  /** End current row and start a new one */
  row(height?: number): this {
    if (this.currentRow.length > 0) {
      const rowNode: GridRowNode = {
        cells: this.currentRow,
        height,
        isHeader: this.isHeaderRow,
        ...this.currentRowStyle,
      };
      this.node.rows.push(rowNode);
      this.currentRow = [];
      this.currentRowStyle = {};
      this.isHeaderRow = false;
    }
    return this;
  }

  /** Mark the current row as a header row and end it */
  headerRow(height?: number): this {
    this.isHeaderRow = true;
    return this.row(height);
  }

  /** Set styles for the current row being built */
  rowStyle(style: StyleProps): this {
    this.currentRowStyle = { ...this.currentRowStyle, ...style };
    return this;
  }

  /** Build and return the grid node */
  build(): GridNode {
    // Finalize any pending row
    if (this.currentRow.length > 0) {
      this.row();
    }
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
 * Create a new grid builder with specified column widths
 *
 * @param columns - Array of column width specifications
 *
 * @example
 * ```typescript
 * grid([200, 'fill', 150])
 *   .cell('A').cell('B').cell('C').row()
 *   .build()
 * ```
 */
export function grid(columns: WidthSpec[]): GridBuilder {
  return new GridBuilder(columns);
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
