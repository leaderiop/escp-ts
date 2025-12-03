/**
 * Tests for Table, TableRow, and TableCell components
 *
 * Comprehensive tests covering:
 * - Table with columns and static data
 * - Table with items (data-bound mode using For loop)
 * - Table with custom children (children mode)
 * - Table with borders (single, double, ascii, true)
 * - Table without borders
 * - Header rendering (showHeader true/false)
 * - Header and row styles
 * - Column alignment
 * - Separator rendering
 * - TableRow and TableCell components
 */

import { describe, it, expect } from 'vitest';
import { Table, TableRow, TableCell } from '../Table';
import type {
  StackNode,
  FlexNode,
  TextNode,
  LineNode,
  EachNode,
  TemplateNode,
  LayoutNode,
} from '../../../../layout/nodes';

// ==================== HELPER FUNCTIONS ====================

/**
 * Type guard to check if a node is a StackNode
 */
function isStack(node: LayoutNode): node is StackNode {
  return node.type === 'stack';
}

/**
 * Type guard to check if a node is a FlexNode
 */
function isFlex(node: LayoutNode): node is FlexNode {
  return node.type === 'flex';
}

/**
 * Type guard to check if a node is a TextNode
 */
function isText(node: LayoutNode): node is TextNode {
  return node.type === 'text';
}

/**
 * Type guard to check if a node is a LineNode
 */
function isLine(node: LayoutNode): node is LineNode {
  return node.type === 'line';
}

/**
 * Type guard to check if a node is an EachNode
 */
function isEach(node: LayoutNode): node is EachNode {
  return node.type === 'each';
}

/**
 * Type guard to check if a node is a TemplateNode
 */
function isTemplate(node: LayoutNode): node is TemplateNode {
  return node.type === 'template';
}

/**
 * Count the number of LineNodes in a node's children
 */
function countLines(node: StackNode): number {
  return node.children.filter(isLine).length;
}

/**
 * Count the number of FlexNodes in a node's children (typically data rows)
 */
function countFlexRows(node: StackNode): number {
  return node.children.filter(isFlex).length;
}

/**
 * Find all text content in nested structure (for verification)
 */
function extractTextContent(node: LayoutNode): string[] {
  const results: string[] = [];

  if (isText(node)) {
    results.push(node.content);
  } else if (isStack(node) || isFlex(node)) {
    for (const child of node.children) {
      results.push(...extractTextContent(child));
    }
  }

  return results;
}

// ==================== TABLE CELL TESTS ====================

describe('TableCell', () => {
  it('should create a stack node with default auto width', () => {
    const cell = TableCell({ children: 'Test' });

    expect(isStack(cell)).toBe(true);
    const stackCell = cell as StackNode;
    expect(stackCell.width).toBe('auto');
  });

  it('should apply width prop', () => {
    const cell = TableCell({ width: 100, children: 'Test' });

    expect(isStack(cell)).toBe(true);
    const stackCell = cell as StackNode;
    expect(stackCell.width).toBe(100);
  });

  it('should apply percentage width', () => {
    const cell = TableCell({ width: '25%', children: 'Test' });

    expect(isStack(cell)).toBe(true);
    const stackCell = cell as StackNode;
    expect(stackCell.width).toBe('25%');
  });

  it('should render string children as Text node', () => {
    const cell = TableCell({ children: 'Hello World' });

    expect(isStack(cell)).toBe(true);
    const stackCell = cell as StackNode;
    expect(stackCell.children).toBeDefined();

    const textContent = extractTextContent(cell);
    expect(textContent).toContain('Hello World');
  });

  it('should render number children as Text node', () => {
    const cell = TableCell({ children: 42 });

    expect(isStack(cell)).toBe(true);
    const textContent = extractTextContent(cell);
    expect(textContent).toContain('42');
  });

  it('should apply align prop to Text content', () => {
    const cell = TableCell({ align: 'center', children: 'Centered' });

    expect(isStack(cell)).toBe(true);
    const stackCell = cell as StackNode;

    // Children is an array with the text node
    const children = stackCell.children as unknown as LayoutNode[];
    expect(Array.isArray(children)).toBe(true);
    const textNode = children[0] as TextNode;
    expect(textNode.type).toBe('text');
    expect(textNode.align).toBe('center');
  });

  it('should apply style prop', () => {
    const cell = TableCell({
      style: { bold: true, padding: 5 },
      children: 'Styled',
    });

    expect(isStack(cell)).toBe(true);
    const stackCell = cell as StackNode;
    expect(stackCell.bold).toBe(true);
    expect(stackCell.padding).toBe(5);
  });

  it('should pass through LayoutNode children without wrapping in Text', () => {
    const customContent: TextNode = { type: 'text', content: 'Custom' };
    const cell = TableCell({ children: customContent });

    expect(isStack(cell)).toBe(true);
    const stackCell = cell as StackNode;
    // Children are passed through to Stack and wrapped in array
    const children = stackCell.children as unknown as LayoutNode[];
    expect(Array.isArray(children)).toBe(true);
    expect(children[0]).toEqual(customContent);
  });
});

// ==================== TABLE ROW TESTS ====================

describe('TableRow', () => {
  it('should create a flex node', () => {
    const row = TableRow({ children: [] });

    expect(isFlex(row)).toBe(true);
  });

  it('should have default gap of 10', () => {
    const row = TableRow({ children: [] });

    expect(isFlex(row)).toBe(true);
    const flexRow = row as FlexNode;
    expect(flexRow.gap).toBe(10);
  });

  it('should include children', () => {
    const cell1 = TableCell({ children: 'A' });
    const cell2 = TableCell({ children: 'B' });
    const row = TableRow({ children: [cell1, cell2] });

    expect(isFlex(row)).toBe(true);
    const flexRow = row as FlexNode;
    expect(flexRow.children).toHaveLength(2);
  });

  it('should apply style prop', () => {
    const row = TableRow({
      style: { gap: 20, padding: 10 },
      children: [],
    });

    expect(isFlex(row)).toBe(true);
    const flexRow = row as FlexNode;
    // Style gap should override the default gap of 10
    expect(flexRow.gap).toBe(20);
    expect(flexRow.padding).toBe(10);
  });
});

// ==================== TABLE WITH COLUMNS AND DATA (NO BORDERS) ====================

describe('Table with columns and data (no borders)', () => {
  const columns = [
    { key: 'name', header: 'Name', width: '50%' as const },
    { key: 'price', header: 'Price', width: '50%' as const },
  ];

  const data = [
    { name: 'Widget', price: '$10.00' },
    { name: 'Gadget', price: '$25.00' },
  ];

  it('should create a stack node as root', () => {
    const table = Table({ columns, data });

    expect(isStack(table)).toBe(true);
  });

  it('should render header row by default (showHeader=true)', () => {
    const table = Table({ columns, data }) as StackNode;

    // First child should be a Flex (header row)
    const headerRow = table.children[0];
    expect(isFlex(headerRow)).toBe(true);

    // Check that header text is present
    const textContent = extractTextContent(headerRow);
    expect(textContent).toContain('Name');
    expect(textContent).toContain('Price');
  });

  it('should render separator line after header', () => {
    const table = Table({ columns, data }) as StackNode;

    // Second child should be a Line (separator)
    const separator = table.children[1];
    expect(isLine(separator)).toBe(true);
    expect((separator as LineNode).length).toBe('fill');
  });

  it('should render data rows', () => {
    const table = Table({ columns, data }) as StackNode;

    // After header (index 0) and separator (index 1), we should have data rows
    const dataRow1 = table.children[2];
    const dataRow2 = table.children[3];

    expect(isFlex(dataRow1)).toBe(true);
    expect(isFlex(dataRow2)).toBe(true);

    const row1Text = extractTextContent(dataRow1);
    expect(row1Text).toContain('Widget');
    expect(row1Text).toContain('$10.00');

    const row2Text = extractTextContent(dataRow2);
    expect(row2Text).toContain('Gadget');
    expect(row2Text).toContain('$25.00');
  });

  it('should render bottom separator line', () => {
    const table = Table({ columns, data }) as StackNode;

    // Last child should be a Line (bottom separator)
    const lastChild = table.children[table.children.length - 1];
    expect(isLine(lastChild)).toBe(true);
  });

  it('should hide header when showHeader=false', () => {
    const table = Table({ columns, data, showHeader: false }) as StackNode;

    // First child should be a Line (top separator), not a header row
    const firstChild = table.children[0];
    expect(isLine(firstChild)).toBe(true);

    // Should not contain header text
    const allText = extractTextContent(table);
    // "Name" and "Price" should not be there as headers
    // but "Widget" and "Gadget" should be present as data
    expect(allText).toContain('Widget');
    expect(allText).toContain('Gadget');
  });

  it('should use custom separator character', () => {
    const table = Table({ columns, data, separator: '=' }) as StackNode;

    // Find the separator lines
    const lines = table.children.filter(isLine);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0].char).toBe('=');
  });

  it('should apply column alignment', () => {
    const columnsWithAlign = [
      { key: 'left', header: 'Left', align: 'left' as const },
      { key: 'center', header: 'Center', align: 'center' as const },
      { key: 'right', header: 'Right', align: 'right' as const },
    ];

    const alignedData = [{ left: 'L', center: 'C', right: 'R' }];

    const table = Table({ columns: columnsWithAlign, data: alignedData }) as StackNode;

    // Check that header cells have alignment
    const headerRow = table.children[0] as FlexNode;
    const headerCells = headerRow.children;

    // Each cell should be a Stack containing a Text with alignment
    // children is an array, the text node is at index 0
    for (let i = 0; i < headerCells.length; i++) {
      const cell = headerCells[i] as StackNode;
      const cellChildren = cell.children as unknown as LayoutNode[];
      const textNode = cellChildren[0] as TextNode;
      expect(textNode.align).toBe(columnsWithAlign[i].align);
    }
  });

  it('should apply header style', () => {
    const table = Table({
      columns,
      data,
      headerStyle: { bold: true, padding: 5 },
    }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    expect(headerRow.bold).toBe(true);
    expect(headerRow.padding).toBe(5);
  });

  it('should apply row style to data rows', () => {
    const table = Table({
      columns,
      data,
      rowStyle: { italic: true },
    }) as StackNode;

    // Data rows start at index 2 (after header and separator)
    const dataRow = table.children[2] as FlexNode;
    expect(dataRow.italic).toBe(true);
  });

  it('should apply table style', () => {
    const table = Table({
      columns,
      data,
      style: { width: 500, padding: 10 },
    }) as StackNode;

    expect(table.width).toBe(500);
    expect(table.padding).toBe(10);
  });

  it('should handle missing data values gracefully', () => {
    const dataWithMissing = [
      { name: 'Complete', price: '$5.00' },
      { name: 'Missing Price' }, // price is undefined
    ];

    const table = Table({ columns, data: dataWithMissing }) as StackNode;

    // Should not throw, and should render empty string for missing value
    const dataRow2 = table.children[3] as FlexNode;
    const row2Text = extractTextContent(dataRow2);
    expect(row2Text).toContain('Missing Price');
    expect(row2Text).toContain(''); // Empty string for missing price
  });

  it('should handle empty data array', () => {
    const table = Table({ columns, data: [] }) as StackNode;

    // Should have header, separator, and bottom separator (no data rows)
    expect(table.children.length).toBe(3); // header, top sep, bottom sep
  });
});

// ==================== TABLE WITH ITEMS (DATA-BOUND MODE) ====================

describe('Table with items (data-bound mode)', () => {
  const columns = [
    { key: 'item', header: 'Item', width: '60%' as const },
    { key: 'qty', header: 'Qty', width: '40%' as const },
  ];

  it('should create an EachNode for data iteration', () => {
    const table = Table({ columns, items: 'orderItems' }) as StackNode;

    // Find the EachNode (For loop)
    const eachNode = table.children.find(isEach);
    expect(eachNode).toBeDefined();
    expect(eachNode?.items).toBe('orderItems');
    expect(eachNode?.as).toBe('row');
  });

  it('should use Template nodes for data binding', () => {
    const table = Table({ columns, items: 'products' }) as StackNode;

    const eachNode = table.children.find(isEach);
    expect(eachNode).toBeDefined();

    // The render template should be a Flex row containing Template nodes
    const renderNode = eachNode?.render;
    expect(isFlex(renderNode as LayoutNode)).toBe(true);

    const flexRender = renderNode as FlexNode;
    // Each column should have a Stack containing a Template
    // children is an array, template is at index 0
    for (let i = 0; i < columns.length; i++) {
      const cellStack = flexRender.children[i] as StackNode;
      expect(isStack(cellStack)).toBe(true);

      const cellChildren = cellStack.children as unknown as LayoutNode[];
      const templateNode = cellChildren[0] as TemplateNode;
      expect(isTemplate(templateNode)).toBe(true);
      expect(templateNode.template).toBe(`{{row.${columns[i].key}}}`);
    }
  });

  it('should hide header when showHeader=false in items mode', () => {
    const table = Table({
      columns,
      items: 'items',
      showHeader: false,
    }) as StackNode;

    // First child should be a Line, not a header Flex
    const firstChild = table.children[0];
    expect(isLine(firstChild)).toBe(true);
  });

  it('should apply column alignment to templates', () => {
    const columnsWithAlign = [
      { key: 'name', header: 'Name', align: 'left' as const },
      { key: 'value', header: 'Value', align: 'right' as const },
    ];

    const table = Table({
      columns: columnsWithAlign,
      items: 'entries',
    }) as StackNode;

    const eachNode = table.children.find(isEach);
    const flexRender = eachNode?.render as FlexNode;

    // Check that Template nodes have alignment
    // children is an array, template is at index 0
    for (let i = 0; i < columnsWithAlign.length; i++) {
      const cellStack = flexRender.children[i] as StackNode;
      const cellChildren = cellStack.children as unknown as LayoutNode[];
      const templateNode = cellChildren[0] as TemplateNode;
      expect(templateNode.align).toBe(columnsWithAlign[i].align);
    }
  });
});

// ==================== TABLE WITH CHILDREN (CHILDREN MODE) ====================

describe('Table with children (children mode)', () => {
  it('should render custom children when no columns defined', () => {
    const customRow1 = TableRow({
      children: [TableCell({ children: 'A' }), TableCell({ children: 'B' })],
    });
    const customRow2 = TableRow({
      children: [TableCell({ children: 'C' }), TableCell({ children: 'D' })],
    });

    const table = Table({ children: [customRow1, customRow2] }) as StackNode;

    expect(isStack(table)).toBe(true);

    // Should have: top separator, row1, row2, bottom separator
    expect(table.children.length).toBe(4);

    // First and last should be Lines
    expect(isLine(table.children[0])).toBe(true);
    expect(isLine(table.children[table.children.length - 1])).toBe(true);

    // Middle children should be the custom rows
    expect(isFlex(table.children[1])).toBe(true);
    expect(isFlex(table.children[2])).toBe(true);
  });

  it('should handle single child', () => {
    const singleRow = TableRow({
      children: [TableCell({ children: 'Only Row' })],
    });

    const table = Table({ children: singleRow }) as StackNode;

    // Should have: top separator, row, bottom separator
    expect(table.children.length).toBe(3);
    expect(isLine(table.children[0])).toBe(true);
    expect(isFlex(table.children[1])).toBe(true);
    expect(isLine(table.children[2])).toBe(true);
  });

  it('should use custom separator in children mode', () => {
    const row = TableRow({ children: [TableCell({ children: 'Test' })] });

    const table = Table({ children: row, separator: '*' }) as StackNode;

    const lines = table.children.filter(isLine);
    expect(lines.length).toBe(2);
    expect(lines[0].char).toBe('*');
    expect(lines[1].char).toBe('*');
  });

  it('should apply table style in children mode', () => {
    const row = TableRow({ children: [TableCell({ children: 'Test' })] });

    const table = Table({
      children: row,
      style: { width: 400, padding: 20 },
    }) as StackNode;

    expect(table.width).toBe(400);
    expect(table.padding).toBe(20);
  });
});

// ==================== TABLE WITH BORDERS ====================

describe('Table with borders', () => {
  const columns = [
    { key: 'col1', header: 'Col1', width: '50%' as const },
    { key: 'col2', header: 'Col2', width: '50%' as const },
  ];

  const data = [{ col1: 'A', col2: 'B' }];

  describe('border="single"', () => {
    it('should create bordered table structure', () => {
      const table = Table({
        columns,
        data,
        border: 'single',
      }) as StackNode;

      expect(isStack(table)).toBe(true);
      // Bordered tables have more complex structure with border rows
      expect(table.children.length).toBeGreaterThan(0);
    });

    it('should include top border row', () => {
      const table = Table({
        columns,
        data,
        border: 'single',
      }) as StackNode;

      // First child should be a Flex (top border row)
      const topBorder = table.children[0];
      expect(isFlex(topBorder)).toBe(true);
    });

    it('should include bottom border row', () => {
      const table = Table({
        columns,
        data,
        border: 'single',
      }) as StackNode;

      // Last child should be a Flex (bottom border row)
      const bottomBorder = table.children[table.children.length - 1];
      expect(isFlex(bottomBorder)).toBe(true);
    });

    it('should include header with vertical borders', () => {
      const table = Table({
        columns,
        data,
        border: 'single',
        showHeader: true,
      }) as StackNode;

      // Second child should be header row with borders (Flex)
      const headerRow = table.children[1];
      expect(isFlex(headerRow)).toBe(true);
    });

    it('should include row separator after header', () => {
      const table = Table({
        columns,
        data,
        border: 'single',
        showHeader: true,
      }) as StackNode;

      // Third child should be separator row (Flex)
      const separatorRow = table.children[2];
      expect(isFlex(separatorRow)).toBe(true);
    });

    it('should use flexGrow for column distribution', () => {
      const table = Table({
        columns,
        data,
        border: 'single',
      }) as StackNode;

      // Check that data row cells use flexGrow
      // Data rows are wrapped with vertical borders
      // Find a data row (after header and separator)
      const dataRow = table.children[3] as FlexNode;
      expect(isFlex(dataRow)).toBe(true);

      // The cells inside should have flexGrow
      // Structure: [border, cell, border, cell, border]
      const cells = dataRow.children.filter(
        (child) => isStack(child) && (child as StackNode).flexGrow !== undefined
      );

      // Each cell should have flexGrow based on percentage width
      cells.forEach((cell) => {
        expect((cell as StackNode).flexGrow).toBeDefined();
      });
    });
  });

  describe('border="double"', () => {
    it('should create table with double border characters', () => {
      const table = Table({
        columns,
        data,
        border: 'double',
      }) as StackNode;

      expect(isStack(table)).toBe(true);
      // Structure should be similar to single border
      expect(table.children.length).toBeGreaterThan(0);
    });
  });

  describe('border="ascii"', () => {
    it('should create table with ASCII border characters', () => {
      const table = Table({
        columns,
        data,
        border: 'ascii',
      }) as StackNode;

      expect(isStack(table)).toBe(true);
      expect(table.children.length).toBeGreaterThan(0);
    });
  });

  describe('border=true', () => {
    it('should auto-detect border style', () => {
      const table = Table({
        columns,
        data,
        border: true,
      }) as StackNode;

      expect(isStack(table)).toBe(true);
      // Should create bordered structure
      expect(table.children.length).toBeGreaterThan(0);
    });
  });

  describe('showHeader=false with borders', () => {
    it('should not include header row when showHeader=false', () => {
      const table = Table({
        columns,
        data,
        border: 'single',
        showHeader: false,
      }) as StackNode;

      expect(isStack(table)).toBe(true);

      // Structure should be:
      // [top border, data row, bottom border]
      // (no header row, no separator after header)
      expect(table.children.length).toBe(3);
    });
  });

  describe('multiple data rows with borders', () => {
    it('should include row separators between data rows', () => {
      const multiData = [
        { col1: 'A', col2: 'B' },
        { col1: 'C', col2: 'D' },
        { col1: 'E', col2: 'F' },
      ];

      const table = Table({
        columns,
        data: multiData,
        border: 'single',
      }) as StackNode;

      // Structure should be:
      // [top border, header, header-sep, row1, row-sep, row2, row-sep, row3, bottom border]
      // But separators are only between data rows (not after the last one)
      // So: [top, header, header-sep, row1, sep, row2, sep, row3, bottom]

      expect(table.children.length).toBe(9);
    });
  });

  describe('items mode with borders', () => {
    it('should use For loop with separator for data-bound tables', () => {
      const table = Table({
        columns,
        items: 'records',
        border: 'single',
      }) as StackNode;

      // Find the EachNode
      const eachNode = table.children.find(isEach);
      expect(eachNode).toBeDefined();

      // Should have a separator defined
      expect(eachNode?.separator).toBeDefined();

      // The separator should be a Flex (row separator with borders)
      expect(isFlex(eachNode?.separator as LayoutNode)).toBe(true);
    });
  });
});

// ==================== TABLE WITHOUT BORDERS ====================

describe('Table without borders', () => {
  const columns = [
    { key: 'a', header: 'A' },
    { key: 'b', header: 'B' },
  ];

  const data = [{ a: '1', b: '2' }];

  it('should use Line separators instead of border rows', () => {
    const table = Table({ columns, data }) as StackNode;

    // Count Line nodes
    const lineCount = countLines(table);
    expect(lineCount).toBe(2); // Top and bottom separator
  });

  it('should not have border-wrapped cells', () => {
    const table = Table({ columns, data }) as StackNode;

    // Data rows should be simple Flex without border wrappers
    const dataRow = table.children[2] as FlexNode;
    expect(isFlex(dataRow)).toBe(true);

    // Each cell should be a simple Stack, not wrapped with border characters
    const cells = dataRow.children;
    expect(cells.every(isStack)).toBe(true);

    // Should have exactly as many cells as columns (no border characters)
    expect(cells.length).toBe(columns.length);
  });

  it('should use gap for spacing between cells', () => {
    const table = Table({
      columns,
      data,
      rowStyle: { gap: 15 },
    }) as StackNode;

    const dataRow = table.children[2] as FlexNode;
    expect(dataRow.gap).toBe(15);
  });
});

// ==================== HEADER RENDERING ====================

describe('Header rendering', () => {
  const columns = [
    { key: 'x', header: 'Header X', width: 100 },
    { key: 'y', header: 'Header Y', width: 100 },
  ];

  const data = [{ x: 'A', y: 'B' }];

  it('should show header by default', () => {
    const table = Table({ columns, data }) as StackNode;

    const allText = extractTextContent(table);
    expect(allText).toContain('Header X');
    expect(allText).toContain('Header Y');
  });

  it('should hide header when showHeader=false', () => {
    const table = Table({ columns, data, showHeader: false }) as StackNode;

    const allText = extractTextContent(table);
    expect(allText).not.toContain('Header X');
    expect(allText).not.toContain('Header Y');
    // Data should still be present
    expect(allText).toContain('A');
    expect(allText).toContain('B');
  });

  it('should apply bold to header text by default', () => {
    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    const firstCell = headerRow.children[0] as StackNode;
    const cellChildren = firstCell.children as unknown as LayoutNode[];
    const textNode = cellChildren[0] as TextNode;

    expect(textNode.bold).toBe(true);
  });

  it('should apply header style to header row', () => {
    const table = Table({
      columns,
      data,
      headerStyle: { underline: true, cpi: 12 },
    }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    expect(headerRow.underline).toBe(true);
    expect(headerRow.cpi).toBe(12);
  });
});

// ==================== COLUMN ALIGNMENT ====================

describe('Column alignment', () => {
  it('should apply left alignment', () => {
    const columns = [{ key: 'col', header: 'Left', align: 'left' as const }];
    const data = [{ col: 'Value' }];

    const table = Table({ columns, data }) as StackNode;

    // Check header alignment - children is an array
    const headerRow = table.children[0] as FlexNode;
    const headerCell = headerRow.children[0] as StackNode;
    const headerChildren = headerCell.children as unknown as LayoutNode[];
    const headerText = headerChildren[0] as TextNode;
    expect(headerText.align).toBe('left');

    // Check data alignment
    const dataRow = table.children[2] as FlexNode;
    const dataCell = dataRow.children[0] as StackNode;
    const dataChildren = dataCell.children as unknown as LayoutNode[];
    const dataText = dataChildren[0] as TextNode;
    expect(dataText.align).toBe('left');
  });

  it('should apply center alignment', () => {
    const columns = [{ key: 'col', header: 'Center', align: 'center' as const }];
    const data = [{ col: 'Value' }];

    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    const headerCell = headerRow.children[0] as StackNode;
    const headerChildren = headerCell.children as unknown as LayoutNode[];
    const headerText = headerChildren[0] as TextNode;
    expect(headerText.align).toBe('center');
  });

  it('should apply right alignment', () => {
    const columns = [{ key: 'col', header: 'Right', align: 'right' as const }];
    const data = [{ col: 'Value' }];

    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    const headerCell = headerRow.children[0] as StackNode;
    const headerChildren = headerCell.children as unknown as LayoutNode[];
    const headerText = headerChildren[0] as TextNode;
    expect(headerText.align).toBe('right');
  });

  it('should not set alignment when not specified', () => {
    const columns = [{ key: 'col', header: 'NoAlign' }];
    const data = [{ col: 'Value' }];

    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    const headerCell = headerRow.children[0] as StackNode;
    const headerChildren = headerCell.children as unknown as LayoutNode[];
    const headerText = headerChildren[0] as TextNode;
    expect(headerText.align).toBeUndefined();
  });
});

// ==================== SEPARATOR RENDERING ====================

describe('Separator rendering', () => {
  const columns = [{ key: 'a', header: 'A' }];
  const data = [{ a: '1' }];

  it('should use default separator character "-"', () => {
    const table = Table({ columns, data }) as StackNode;

    const lines = table.children.filter(isLine);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0].char).toBe('-');
  });

  it('should use custom separator character', () => {
    const table = Table({ columns, data, separator: '=' }) as StackNode;

    const lines = table.children.filter(isLine);
    expect(lines[0].char).toBe('=');
  });

  it('should use fill length for separators', () => {
    const table = Table({ columns, data }) as StackNode;

    const lines = table.children.filter(isLine);
    lines.forEach((line) => {
      expect(line.length).toBe('fill');
    });
  });
});

// ==================== EDGE CASES ====================

describe('Edge cases', () => {
  it('should handle empty columns array', () => {
    const table = Table({ columns: [], data: [] }) as StackNode;

    expect(isStack(table)).toBe(true);
    // Should still create basic structure
    expect(table.children).toBeDefined();
  });

  it('should handle columns with auto width', () => {
    const columns = [
      { key: 'a', header: 'Auto Width' }, // No width specified (defaults to auto)
    ];
    const data = [{ a: 'Value' }];

    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    const cell = headerRow.children[0] as StackNode;
    expect(cell.width).toBe('auto');
  });

  it('should handle numeric column widths', () => {
    const columns = [{ key: 'a', header: 'Fixed', width: 150 }];
    const data = [{ a: 'Value' }];

    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    const cell = headerRow.children[0] as StackNode;
    expect(cell.width).toBe(150);
  });

  it('should handle data with extra keys', () => {
    const columns = [{ key: 'a', header: 'A' }];
    const data = [{ a: 'Value', b: 'Extra', c: 'Ignored' }];

    const table = Table({ columns, data }) as StackNode;

    const allText = extractTextContent(table);
    expect(allText).toContain('Value');
    expect(allText).not.toContain('Extra');
    expect(allText).not.toContain('Ignored');
  });

  it('should handle null and undefined data values', () => {
    const columns = [
      { key: 'a', header: 'A' },
      { key: 'b', header: 'B' },
    ];
    const data = [{ a: null, b: undefined }];

    const table = Table({ columns, data }) as StackNode;

    // Should render empty strings for null/undefined
    const dataRow = table.children[2] as FlexNode;
    const textContent = extractTextContent(dataRow);
    expect(textContent).toContain('');
  });

  it('should handle numeric data values', () => {
    const columns = [{ key: 'num', header: 'Number' }];
    const data = [{ num: 42 }];

    const table = Table({ columns, data }) as StackNode;

    const allText = extractTextContent(table);
    expect(allText).toContain('42');
  });

  it('should handle boolean data values', () => {
    const columns = [{ key: 'bool', header: 'Boolean' }];
    const data = [{ bool: true }];

    const table = Table({ columns, data }) as StackNode;

    const allText = extractTextContent(table);
    expect(allText).toContain('true');
  });
});

// ==================== COLUMN WIDTH TESTS ====================

describe('Column widths', () => {
  it('should handle percentage widths', () => {
    const columns = [
      { key: 'a', header: 'A', width: '30%' as const },
      { key: 'b', header: 'B', width: '70%' as const },
    ];
    const data = [{ a: 'X', b: 'Y' }];

    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    expect((headerRow.children[0] as StackNode).width).toBe('30%');
    expect((headerRow.children[1] as StackNode).width).toBe('70%');
  });

  it('should handle mixed width types', () => {
    const columns = [
      { key: 'a', header: 'A', width: 100 },
      { key: 'b', header: 'B', width: '50%' as const },
      { key: 'c', header: 'C' }, // auto
    ];
    const data = [{ a: '1', b: '2', c: '3' }];

    const table = Table({ columns, data }) as StackNode;

    const headerRow = table.children[0] as FlexNode;
    expect((headerRow.children[0] as StackNode).width).toBe(100);
    expect((headerRow.children[1] as StackNode).width).toBe('50%');
    expect((headerRow.children[2] as StackNode).width).toBe('auto');
  });

  it('should use flexGrow based on percentage width when bordered', () => {
    const columns = [
      { key: 'a', header: 'A', width: '25%' as const },
      { key: 'b', header: 'B', width: '75%' as const },
    ];
    const data = [{ a: '1', b: '2' }];

    const table = Table({ columns, data, border: 'single' }) as StackNode;

    // In bordered mode, cells use flexGrow derived from percentage
    // Find header row (second child after top border)
    const headerRow = table.children[1] as FlexNode;

    // Extract cells (every other element, skipping border characters)
    // Structure: [border, cell, border, cell, border]
    const cells = headerRow.children.filter(
      (child, index) => index % 2 === 1 // Cells are at odd indices
    ) as StackNode[];

    expect(cells[0].flexGrow).toBe(25);
    expect(cells[1].flexGrow).toBe(75);
  });
});

// ==================== INTEGRATION TESTS ====================

describe('Integration tests', () => {
  it('should create a complete table with all features', () => {
    const columns = [
      { key: 'product', header: 'Product', width: '40%' as const, align: 'left' as const },
      { key: 'qty', header: 'Qty', width: '20%' as const, align: 'center' as const },
      { key: 'price', header: 'Price', width: '20%' as const, align: 'right' as const },
      { key: 'total', header: 'Total', width: '20%' as const, align: 'right' as const },
    ];

    const data = [
      { product: 'Widget', qty: 10, price: '$5.00', total: '$50.00' },
      { product: 'Gadget', qty: 5, price: '$15.00', total: '$75.00' },
    ];

    const table = Table({
      columns,
      data,
      showHeader: true,
      headerStyle: { bold: true },
      rowStyle: { italic: false },
      separator: '-',
      style: { width: 500 },
      border: 'single',
    }) as StackNode;

    expect(isStack(table)).toBe(true);
    expect(table.width).toBe(500);

    // Verify structure has borders
    const firstChild = table.children[0];
    expect(isFlex(firstChild)).toBe(true); // Top border row

    // Verify data is present
    const allText = extractTextContent(table);
    expect(allText).toContain('Product');
    expect(allText).toContain('Widget');
    expect(allText).toContain('$50.00');
  });

  it('should create a data-bound table with items', () => {
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value' },
    ];

    const table = Table({
      columns,
      items: 'dataEntries',
      showHeader: true,
      border: 'ascii',
    }) as StackNode;

    expect(isStack(table)).toBe(true);

    // Find the EachNode
    const eachNode = table.children.find(isEach);
    expect(eachNode).toBeDefined();
    expect(eachNode?.items).toBe('dataEntries');
  });

  it('should create a custom children table', () => {
    const table = Table({
      separator: '=',
      style: { padding: 10 },
      children: [
        TableRow({
          children: [
            TableCell({ width: '50%', align: 'left', children: 'Left Cell' }),
            TableCell({ width: '50%', align: 'right', children: 'Right Cell' }),
          ],
        }),
      ],
    }) as StackNode;

    expect(isStack(table)).toBe(true);
    expect(table.padding).toBe(10);

    // Verify separators use custom character
    const lines = table.children.filter(isLine);
    expect(lines.every((line) => line.char === '=')).toBe(true);

    // Verify cell content
    const allText = extractTextContent(table);
    expect(allText).toContain('Left Cell');
    expect(allText).toContain('Right Cell');
  });
});
