/**
 * Tests for Data Display Components (Table, List, Card, Badge)
 *
 * These tests verify that data display components correctly produce LayoutNode structures.
 * They target the critical defects identified:
 * - Column Collapse: Table columns merging - widths not respected
 * - Numbered List Zero-Indexed: Lists start at 0 instead of 1
 */

import { describe, it, expect } from 'vitest';
import { Table, TableRow, TableCell } from '../data-display/Table';
import { List, ListItem } from '../data-display/List';
import { Card } from '../data-display/Card';
import { Badge } from '../data-display/Badge';
import { Text } from '../content/Text';
import type {
  StackNode,
  FlexNode,
  TextNode,
  LineNode,
  EachNode,
  TemplateNode,
} from '../../../layout/nodes';

describe('Data Display Components', () => {
  // ==================== TABLE COMPONENT ====================

  describe('Table', () => {
    describe('children-based mode', () => {
      it('should return a stack node', () => {
        const node = Table({ children: [] });
        expect(node.type).toBe('stack');
      });

      it('should wrap children with separator lines', () => {
        const row = TableRow({
          children: [
            TableCell({ children: 'Cell 1' }),
            TableCell({ children: 'Cell 2' }),
          ],
        });
        const node = Table({ children: row }) as StackNode;

        // First child should be a separator line
        expect((node.children[0] as LineNode).type).toBe('line');
        // Last child should be a separator line
        expect((node.children[node.children.length - 1] as LineNode).type).toBe('line');
      });

      it('should use custom separator character', () => {
        const node = Table({ separator: '=', children: [] }) as StackNode;
        expect((node.children[0] as LineNode).char).toBe('=');
      });
    });

    describe('column-based mode - Critical Bug Area', () => {
      /**
       * BUG #3: Column Collapse - Table columns merging - widths not respected
       * These tests verify that column widths are properly applied to cells.
       */

      const columns = [
        { header: 'Name', key: 'name', width: 100 },
        { header: 'Price', key: 'price', width: 50, align: 'right' as const },
        { header: 'Qty', key: 'qty', width: 30 },
      ];

      it('should apply column widths to header cells', () => {
        const node = Table({
          columns,
          data: [],
          showHeader: true,
        }) as StackNode;

        // First child is the header row (Flex)
        const headerRow = node.children[0] as FlexNode;
        expect(headerRow.type).toBe('flex');

        // Each cell should have the specified width
        const cells = headerRow.children as StackNode[];
        expect((cells[0] as StackNode).width).toBe(100);
        expect((cells[1] as StackNode).width).toBe(50);
        expect((cells[2] as StackNode).width).toBe(30);
      });

      it('should apply column widths to data cells', () => {
        const data = [{ name: 'Apple', price: 1.99, qty: 5 }];

        const node = Table({
          columns,
          data,
          showHeader: false,
        }) as StackNode;

        // First child is separator, second is data row
        const dataRow = node.children[1] as FlexNode;
        expect(dataRow.type).toBe('flex');

        const cells = dataRow.children as StackNode[];
        expect((cells[0] as StackNode).width).toBe(100);
        expect((cells[1] as StackNode).width).toBe(50);
        expect((cells[2] as StackNode).width).toBe(30);
      });

      it('should default to auto width when column width not specified', () => {
        const columnsNoWidth = [
          { header: 'Name', key: 'name' },
          { header: 'Price', key: 'price' },
        ];

        const node = Table({
          columns: columnsNoWidth,
          data: [],
          showHeader: true,
        }) as StackNode;

        const headerRow = node.children[0] as FlexNode;
        const cells = headerRow.children as StackNode[];
        expect((cells[0] as StackNode).width).toBe('auto');
        expect((cells[1] as StackNode).width).toBe('auto');
      });

      it('should apply column alignment to header cells', () => {
        const node = Table({
          columns,
          data: [],
          showHeader: true,
        }) as StackNode;

        const headerRow = node.children[0] as FlexNode;
        const cells = headerRow.children as StackNode[];

        // Second column has align: 'right'
        const rightAlignCell = cells[1] as StackNode;
        const textNode = rightAlignCell.children[0] as TextNode;
        expect(textNode.align).toBe('right');
      });

      it('should apply column alignment to data cells', () => {
        const data = [{ name: 'Apple', price: 1.99, qty: 5 }];

        const node = Table({
          columns,
          data,
          showHeader: false,
        }) as StackNode;

        const dataRow = node.children[1] as FlexNode;
        const cells = dataRow.children as StackNode[];

        // Second column has align: 'right'
        const rightAlignCell = cells[1] as StackNode;
        const textNode = rightAlignCell.children[0] as TextNode;
        expect(textNode.align).toBe('right');
      });

      it('should apply gap between columns', () => {
        const node = Table({
          columns,
          data: [],
          showHeader: true,
        }) as StackNode;

        const headerRow = node.children[0] as FlexNode;
        expect(headerRow.gap).toBe(10);
      });
    });

    describe('data binding with items', () => {
      it('should create For node when items prop is provided', () => {
        const columns = [
          { header: 'Name', key: 'name', width: 100 },
        ];

        const node = Table({
          columns,
          items: 'products',
          showHeader: false,
        }) as StackNode;

        // Find the For node (after separator line)
        const forNode = node.children.find(
          (child) => (child as EachNode).type === 'each'
        ) as EachNode;

        expect(forNode).toBeDefined();
        expect(forNode.items).toBe('products');
        expect(forNode.as).toBe('row');
      });

      it('should use Template for data cell content', () => {
        const columns = [
          { header: 'Name', key: 'name', width: 100 },
        ];

        const node = Table({
          columns,
          items: 'products',
          showHeader: false,
        }) as StackNode;

        const forNode = node.children.find(
          (child) => (child as EachNode).type === 'each'
        ) as EachNode;

        // The render template should contain Template nodes
        const rowFlex = forNode.render as FlexNode;
        const cellStack = rowFlex.children[0] as StackNode;
        const template = cellStack.children[0] as TemplateNode;

        expect(template.type).toBe('template');
        expect(template.template).toBe('{{row.name}}');
      });
    });

    describe('header rendering', () => {
      it('should render header when showHeader is true (default)', () => {
        const columns = [{ header: 'Name', key: 'name' }];
        const node = Table({ columns, data: [] }) as StackNode;

        // First child should be the header row
        const headerRow = node.children[0] as FlexNode;
        expect(headerRow.type).toBe('flex');

        // Check header text is bold
        const cellStack = headerRow.children[0] as StackNode;
        const headerText = cellStack.children[0] as TextNode;
        expect(headerText.bold).toBe(true);
      });

      it('should not render header when showHeader is false', () => {
        const columns = [{ header: 'Name', key: 'name' }];
        const node = Table({
          columns,
          data: [],
          showHeader: false,
        }) as StackNode;

        // First child should be a line separator, not header row
        expect((node.children[0] as LineNode).type).toBe('line');
      });
    });

    describe('multiple data rows', () => {
      it('should render all data rows', () => {
        const columns = [{ header: 'Name', key: 'name' }];
        const data = [
          { name: 'Apple' },
          { name: 'Banana' },
          { name: 'Cherry' },
        ];

        const node = Table({
          columns,
          data,
          showHeader: false,
        }) as StackNode;

        // Count flex rows (data rows)
        const dataRows = node.children.filter(
          (child) => (child as FlexNode).type === 'flex'
        );
        expect(dataRows).toHaveLength(3);
      });
    });

    describe('style application', () => {
      it('should apply header style', () => {
        const columns = [{ header: 'Name', key: 'name' }];
        const node = Table({
          columns,
          data: [],
          headerStyle: { bold: true },
        }) as StackNode;

        const headerRow = node.children[0] as FlexNode;
        expect(headerRow.bold).toBe(true);
      });

      it('should apply row style', () => {
        const columns = [{ header: 'Name', key: 'name' }];
        const data = [{ name: 'Test' }];
        const node = Table({
          columns,
          data,
          rowStyle: { italic: true },
          showHeader: false,
        }) as StackNode;

        // Second child is the data row
        const dataRow = node.children[1] as FlexNode;
        expect(dataRow.italic).toBe(true);
      });

      it('should apply table style', () => {
        const columns = [{ header: 'Name', key: 'name' }];
        const node = Table({
          columns,
          data: [],
          style: { width: 500 },
        }) as StackNode;

        expect(node.width).toBe(500);
      });
    });
  });

  // ==================== TABLE ROW COMPONENT ====================

  describe('TableRow', () => {
    it('should return a flex node', () => {
      const node = TableRow({ children: [] });
      expect(node.type).toBe('flex');
    });

    it('should include children', () => {
      const node = TableRow({
        children: [
          TableCell({ children: 'A' }),
          TableCell({ children: 'B' }),
        ],
      }) as FlexNode;

      expect(node.children).toHaveLength(2);
    });

    it('should have default gap', () => {
      const node = TableRow({ children: [] }) as FlexNode;
      expect(node.gap).toBe(10);
    });

    it('should apply custom style', () => {
      const node = TableRow({
        style: { gap: 20 },
        children: [],
      }) as FlexNode;

      expect(node.gap).toBe(20);
    });
  });

  // ==================== TABLE CELL COMPONENT ====================

  describe('TableCell', () => {
    it('should return a stack node', () => {
      const node = TableCell({ children: 'Content' });
      expect(node.type).toBe('stack');
    });

    it('should apply width', () => {
      const node = TableCell({ width: 100, children: 'Content' }) as StackNode;
      expect(node.width).toBe(100);
    });

    it('should default to auto width', () => {
      const node = TableCell({ children: 'Content' }) as StackNode;
      expect(node.width).toBe('auto');
    });

    it('should convert string children to Text', () => {
      const node = TableCell({ children: 'Hello' }) as StackNode;
      expect((node.children[0] as TextNode).type).toBe('text');
      expect((node.children[0] as TextNode).content).toBe('Hello');
    });

    it('should apply alignment to text children', () => {
      const node = TableCell({
        align: 'right',
        children: 'Price',
      }) as StackNode;

      const textNode = node.children[0] as TextNode;
      expect(textNode.align).toBe('right');
    });

    it('should pass through LayoutNode children', () => {
      const customChild = Text({ children: 'Custom', style: { bold: true } });
      const node = TableCell({ children: customChild }) as StackNode;

      expect((node.children[0] as TextNode).content).toBe('Custom');
    });
  });

  // ==================== LIST COMPONENT ====================

  describe('List', () => {
    describe('basic structure', () => {
      it('should return a stack node', () => {
        const node = List({ children: [] });
        expect(node.type).toBe('stack');
      });

      it('should have gap between items', () => {
        const node = List({ children: [] }) as StackNode;
        expect(node.gap).toBe(3);
      });
    });

    describe('numbered list indexing - Critical Bug Area', () => {
      /**
       * BUG #5: Numbered List Zero-Indexed - Lists start at 0 instead of 1
       * These tests verify that numbered lists start at 1, not 0.
       */

      it('should start numbered list at 1 in manual children mode', () => {
        const node = List({
          variant: 'numbered',
          children: [
            Text({ children: 'First item' }),
            Text({ children: 'Second item' }),
            Text({ children: 'Third item' }),
          ],
        }) as StackNode;

        // Check the first item bullet
        const firstItemFlex = node.children[0] as FlexNode;
        const bulletText = firstItemFlex.children[0] as TextNode;
        expect(bulletText.content).toBe('1.');

        // Check the second item bullet
        const secondItemFlex = node.children[1] as FlexNode;
        const secondBullet = secondItemFlex.children[0] as TextNode;
        expect(secondBullet.content).toBe('2.');

        // Check the third item bullet
        const thirdItemFlex = node.children[2] as FlexNode;
        const thirdBullet = thirdItemFlex.children[0] as TextNode;
        expect(thirdBullet.content).toBe('3.');
      });

      it('should use _listIndex for data-bound numbered lists', () => {
        const node = List({
          variant: 'numbered',
          items: 'todos',
        }) as StackNode;

        const forNode = node.children[0] as EachNode;
        expect(forNode.indexAs).toBe('_listIndex');

        // The template should use _listIndex
        const itemFlex = forNode.render as FlexNode;
        const bulletStack = itemFlex.children[0] as StackNode;
        const bulletTemplate = bulletStack.children[0] as TemplateNode;

        expect(bulletTemplate.template).toBe('{{_listIndex}}.');
      });

      it('should NOT start at 0 - regression test', () => {
        const node = List({
          variant: 'numbered',
          children: [Text({ children: 'Only item' })],
        }) as StackNode;

        const itemFlex = node.children[0] as FlexNode;
        const bulletText = itemFlex.children[0] as TextNode;

        // This is the critical test: bullet should be "1." not "0."
        expect(bulletText.content).not.toBe('0.');
        expect(bulletText.content).toBe('1.');
      });
    });

    describe('bullet list', () => {
      it('should use default bullet character', () => {
        const node = List({
          variant: 'bullet',
          children: [Text({ children: 'Item' })],
        }) as StackNode;

        const itemFlex = node.children[0] as FlexNode;
        const bulletText = itemFlex.children[0] as TextNode;
        expect(bulletText.content).toBe('*');
      });

      it('should use custom bullet character', () => {
        const node = List({
          variant: 'bullet',
          bullet: '-',
          children: [Text({ children: 'Item' })],
        }) as StackNode;

        const itemFlex = node.children[0] as FlexNode;
        const bulletText = itemFlex.children[0] as TextNode;
        expect(bulletText.content).toBe('-');
      });
    });

    describe('none variant', () => {
      it('should have empty bullet for none variant', () => {
        const node = List({
          variant: 'none',
          children: [Text({ children: 'Item' })],
        }) as StackNode;

        const itemFlex = node.children[0] as FlexNode;
        const bulletText = itemFlex.children[0] as TextNode;
        expect(bulletText.content).toBe('');
      });
    });

    describe('indentation', () => {
      it('should apply default indent width for bullet variant', () => {
        // Default indent for bullet variant is 40 dots (enough for 1 char at 10 CPI)
        const node = List({
          variant: 'bullet',
          children: [Text({ children: 'Item' })],
        }) as StackNode;

        const itemFlex = node.children[0] as FlexNode;
        const bulletText = itemFlex.children[0] as TextNode;
        expect(bulletText.width).toBe(40);
      });

      it('should apply default indent width for numbered variant', () => {
        // Default indent for numbered variant is 80 dots (enough for "99." at 10 CPI)
        const node = List({
          variant: 'numbered',
          children: [Text({ children: 'Item' })],
        }) as StackNode;

        const itemFlex = node.children[0] as FlexNode;
        const bulletText = itemFlex.children[0] as TextNode;
        expect(bulletText.width).toBe(80);
      });

      it('should apply custom indent width', () => {
        const node = List({
          indent: 60,
          children: [Text({ children: 'Item' })],
        }) as StackNode;

        const itemFlex = node.children[0] as FlexNode;
        const bulletText = itemFlex.children[0] as TextNode;
        expect(bulletText.width).toBe(60);
      });
    });

    describe('data binding', () => {
      it('should create For node when items prop is provided', () => {
        const node = List({ items: 'todos' }) as StackNode;

        const forNode = node.children[0] as EachNode;
        expect(forNode.type).toBe('each');
        expect(forNode.items).toBe('todos');
      });

      it('should use custom item variable name', () => {
        const node = List({
          items: 'products',
          as: 'product',
        }) as StackNode;

        const forNode = node.children[0] as EachNode;
        expect(forNode.as).toBe('product');

        // Check template uses correct variable
        const itemFlex = forNode.render as FlexNode;
        const itemTemplate = itemFlex.children[1] as TemplateNode;
        expect(itemTemplate.template).toBe('{{product}}');
      });
    });

    describe('style application', () => {
      it('should apply custom style', () => {
        const node = List({
          style: { gap: 10 },
          children: [],
        }) as StackNode;

        expect(node.gap).toBe(10);
      });
    });
  });

  // ==================== LIST ITEM COMPONENT ====================

  describe('ListItem', () => {
    it('should return a flex node when bullet is provided', () => {
      const node = ListItem({ bullet: '*', children: 'Content' });
      expect(node.type).toBe('flex');
    });

    it('should include bullet text', () => {
      const node = ListItem({ bullet: '-', children: 'Content' }) as FlexNode;

      const bulletText = node.children[0] as TextNode;
      expect(bulletText.content).toBe('-');
      expect(bulletText.width).toBe(20);
    });

    it('should include content after bullet', () => {
      const node = ListItem({
        bullet: '*',
        children: Text({ children: 'Item text' }),
      }) as FlexNode;

      expect(node.children).toHaveLength(2);
      expect((node.children[1] as TextNode).content).toBe('Item text');
    });

    it('should handle string children directly when no bullet', () => {
      const node = ListItem({ children: 'Just text' });
      expect(node.type).toBe('text');
      expect((node as TextNode).content).toBe('Just text');
    });

    it('should handle array children when no bullet', () => {
      const node = ListItem({
        children: [
          Text({ children: 'Part 1' }),
          Text({ children: 'Part 2' }),
        ],
      }) as StackNode;

      expect(node.type).toBe('stack');
      expect(node.children).toHaveLength(2);
    });
  });

  // ==================== CARD COMPONENT ====================

  describe('Card', () => {
    describe('basic structure', () => {
      it('should return a stack node', () => {
        const node = Card({ children: [] });
        expect(node.type).toBe('stack');
      });

      it('should have fill width by default', () => {
        const node = Card({ children: [] }) as StackNode;
        expect(node.width).toBe('fill');
      });

      it('should have top and bottom border lines', () => {
        const node = Card({ children: [] }) as StackNode;

        // First child should be border line
        expect((node.children[0] as LineNode).type).toBe('line');
        expect((node.children[0] as LineNode).char).toBe('-');

        // Last child should be border line
        const lastChild = node.children[node.children.length - 1] as LineNode;
        expect(lastChild.type).toBe('line');
      });
    });

    describe('title rendering', () => {
      it('should render title when provided', () => {
        const node = Card({ title: 'My Card', children: [] }) as StackNode;

        // Second child should be title text
        const titleNode = node.children[1] as TextNode;
        expect(titleNode.type).toBe('text');
        expect(titleNode.content).toBe('My Card');
        expect(titleNode.bold).toBe(true);
      });

      it('should have separator after title', () => {
        const node = Card({ title: 'Title', children: [] }) as StackNode;

        // Third child should be separator line after title
        const separator = node.children[2] as LineNode;
        expect(separator.type).toBe('line');
      });

      it('should not render title when not provided', () => {
        const node = Card({ children: Text({ children: 'Content' }) }) as StackNode;

        // Second child should be the content stack, not a title
        const contentArea = node.children[1] as StackNode;
        expect(contentArea.type).toBe('stack');
      });
    });

    describe('content area', () => {
      it('should wrap content in stack with padding', () => {
        const node = Card({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        // Find content stack (after border, possibly after title)
        const contentStack = node.children.find(
          (child) =>
            (child as StackNode).type === 'stack' &&
            (child as StackNode).padding !== undefined
        ) as StackNode;

        expect(contentStack).toBeDefined();
        expect(contentStack.padding).toEqual({ left: 10, right: 10 });
      });

      it('should include all children in content area', () => {
        const node = Card({
          children: [
            Text({ children: 'Line 1' }),
            Text({ children: 'Line 2' }),
          ],
        }) as StackNode;

        const contentStack = node.children.find(
          (child) =>
            (child as StackNode).type === 'stack' &&
            (child as StackNode).padding !== undefined
        ) as StackNode;

        // Content stack should have children property containing our items
        expect(contentStack.children).toBeDefined();
      });
    });

    describe('border customization', () => {
      it('should use custom border character', () => {
        const node = Card({ border: '=', children: [] }) as StackNode;

        const topBorder = node.children[0] as LineNode;
        expect(topBorder.char).toBe('=');

        const bottomBorder = node.children[node.children.length - 1] as LineNode;
        expect(bottomBorder.char).toBe('=');
      });
    });

    describe('style application', () => {
      it('should apply custom style', () => {
        const node = Card({
          style: { width: 300 },
          children: [],
        }) as StackNode;

        expect(node.width).toBe(300);
      });
    });
  });

  // ==================== BADGE COMPONENT ====================

  describe('Badge', () => {
    describe('basic structure', () => {
      it('should return a text node', () => {
        const node = Badge({ children: 'Status' });
        expect(node.type).toBe('text');
      });

      it('should wrap content in brackets', () => {
        const node = Badge({ children: 'OK' }) as TextNode;
        expect(node.content).toBe('[OK]');
      });

      it('should handle numeric children', () => {
        const node = Badge({ children: 42 }) as TextNode;
        expect(node.content).toBe('[42]');
      });
    });

    describe('variants', () => {
      it('should apply default variant (no special styles)', () => {
        const node = Badge({ variant: 'default', children: 'Info' }) as TextNode;
        expect(node.bold).toBeUndefined();
        expect(node.italic).toBeUndefined();
      });

      it('should apply success variant (bold)', () => {
        const node = Badge({ variant: 'success', children: 'Done' }) as TextNode;
        expect(node.bold).toBe(true);
      });

      it('should apply warning variant (italic)', () => {
        const node = Badge({ variant: 'warning', children: 'Warn' }) as TextNode;
        expect(node.italic).toBe(true);
      });

      it('should apply error variant (bold + doubleWidth)', () => {
        const node = Badge({ variant: 'error', children: 'Error' }) as TextNode;
        expect(node.bold).toBe(true);
        expect(node.doubleWidth).toBe(true);
      });
    });

    describe('style application', () => {
      it('should apply custom style', () => {
        const node = Badge({
          style: { underline: true },
          children: 'Custom',
        }) as TextNode;

        expect(node.underline).toBe(true);
      });

      it('should merge variant style with custom style', () => {
        const node = Badge({
          variant: 'success',
          style: { italic: true },
          children: 'Merged',
        }) as TextNode;

        // Custom style should override/merge with variant
        expect(node.italic).toBe(true);
      });
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Data Display Integration', () => {
    it('should compose Table with Card', () => {
      const columns = [
        { header: 'Item', key: 'item', width: 100 },
        { header: 'Price', key: 'price', width: 50 },
      ];

      const card = Card({
        title: 'Price List',
        children: Table({
          columns,
          data: [{ item: 'Apple', price: '1.99' }],
        }),
      }) as StackNode;

      expect(card.type).toBe('stack');
      // Should have title and table content
      const contentStack = card.children.find(
        (child) =>
          (child as StackNode).type === 'stack' &&
          (child as StackNode).padding !== undefined
      ) as StackNode;
      expect(contentStack).toBeDefined();
    });

    it('should compose List items with Badge', () => {
      const list = List({
        variant: 'bullet',
        children: [
          Badge({ variant: 'success', children: 'Completed' }),
          Badge({ variant: 'warning', children: 'Pending' }),
        ],
      }) as StackNode;

      expect(list.children).toHaveLength(2);
    });
  });
});
