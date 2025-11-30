/**
 * Data Display Components Example
 *
 * Demonstrates: Table, TableRow, TableCell, List, ListItem, Card, Badge
 * Layout: Uses full page width with horizontal sections
 */

import { LayoutEngine } from '@escp/jsx';
import { Stack, Flex, Layout, Text, Line, Spacer } from '@escp/jsx';
import {
  Table,
  TableRow,
  TableCell,
  List,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

async function main() {
  printSection('Data Display Components');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  // Set data for data-bound components
  engine.setData({
    products: [
      { name: 'Laptop Pro', sku: 'LP-001', price: '$1,299.00', stock: 15 },
      { name: 'Wireless Mouse', sku: 'WM-042', price: '$29.99', stock: 150 },
      { name: 'USB-C Hub', sku: 'UH-108', price: '$49.99', stock: 75 },
      { name: 'Monitor 27"', sku: 'MN-270', price: '$399.00', stock: 8 },
    ],
    notes: ['Handle with care', 'Fragile items included', 'Customer requested gift wrap'],
  });

  // Layout uses full printable width (no explicit width = uses availableWidth)
  const doc = Layout({
    style: { padding: 10 },
    children: [
      // Title
      Text({
        style: { bold: true, doubleWidth: true },
        children: 'Data Display Components',
      }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 20 } }),

      // Row 1: Badge, Card (side by side)
      Flex({
        style: { gap: 60 },
        children: [
          // Column 1: Badge Component
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Badge Component' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { gap: 8, padding: { left: 10, top: 5 } },
                children: [
                  Flex({
                    style: { gap: 10 },
                    children: [
                      Text({ children: 'Order:' }),
                      Badge({ variant: 'success', children: 'PAID' }),
                    ],
                  }),
                  Flex({
                    style: { gap: 10 },
                    children: [
                      Text({ children: 'Stock:' }),
                      Badge({ variant: 'warning', children: 'LOW' }),
                    ],
                  }),
                  Flex({
                    style: { gap: 10 },
                    children: [
                      Text({ children: 'Ship:' }),
                      Badge({ variant: 'error', children: 'DELAYED' }),
                    ],
                  }),
                  Flex({
                    style: { gap: 10 },
                    children: [
                      Text({ children: 'Type:' }),
                      Badge({ variant: 'default', children: 'ELECTRONICS' }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Column 2: Card Component
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Card Component' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { gap: 10, padding: { top: 5 } },
                children: [
                  Card({
                    children: [
                      CardHeader({
                        children: CardTitle({ children: 'Customer Info' }),
                      }),
                      CardContent({
                        style: { gap: 2 },
                        children: [
                          Text({ children: 'John Doe' }),
                          Text({ children: 'john@example.com' }),
                          Text({ children: '+1 (555) 123-4567' }),
                        ],
                      }),
                    ],
                  }),
                  Card({
                    border: 'double',
                    children: [
                      CardHeader({
                        children: CardTitle({ children: 'Address' }),
                      }),
                      CardContent({
                        style: { gap: 2 },
                        children: [
                          Text({ children: '123 Main Street' }),
                          Text({ children: 'New York, NY 10001' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Column 3: List Component
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'List Component' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { gap: 10, padding: { top: 5 } },
                children: [
                  Text({ children: 'Bullet:' }),
                  List({
                    variant: 'bullet',
                    children: [Text({ children: 'First item' }), Text({ children: 'Second item' })],
                  }),
                  Text({ children: 'Numbered:' }),
                  List({
                    variant: 'numbered',
                    children: [Text({ children: 'Step one' }), Text({ children: 'Step two' })],
                  }),
                  Text({ children: 'Custom (->):' }),
                  List({
                    variant: 'bullet',
                    bullet: '->',
                    indent: 80,
                    children: [Text({ children: 'Arrow A' }), Text({ children: 'Arrow B' })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 10 } }),

      // Row 2: Table Component (full width)
      Text({ style: { bold: true }, children: 'Table Component' }),
      Line({ char: '-', length: 'fill' }),
      Spacer({ style: { height: 5 } }),

      // Static data table
      Text({ children: 'Static Data:' }),
      Table({
        columns: [
          { header: 'Product', key: 'name', width: 500 },
          { header: 'SKU', key: 'sku', width: 300 },
          { header: 'Price', key: 'price', width: 350, align: 'right' },
          { header: 'Stock', key: 'stock', width: 250, align: 'right' },
        ],
        data: [
          { name: 'Keyboard Pro', sku: 'KB-101', price: '$79.99', stock: 45 },
          { name: 'Webcam HD', sku: 'WC-200', price: '$89.99', stock: 30 },
          { name: 'Headphones Elite', sku: 'HP-300', price: '$149.99', stock: 22 },
        ],
      }),

      Spacer({ style: { height: 15 } }),

      // Data-bound table
      Text({ children: 'Data-Bound (from engine.setData):' }),
      Table({
        columns: [
          { header: 'Product', key: 'name', width: 500 },
          { header: 'SKU', key: 'sku', width: 300 },
          { header: 'Price', key: 'price', width: 350, align: 'right' },
          { header: 'Stock', key: 'stock', width: 250, align: 'right' },
        ],
        items: 'products',
      }),

      Spacer({ style: { height: 15 } }),

      // Manual rows table (invoice style)
      Text({ children: 'Manual Rows (Invoice):' }),
      Table({
        children: [
          TableRow({
            style: { bold: true },
            children: [
              TableCell({ width: 600, children: 'Description' }),
              TableCell({ width: 300, align: 'right', children: 'Amount' }),
            ],
          }),
          TableRow({
            children: [
              TableCell({ width: 600, children: 'Subtotal' }),
              TableCell({ width: 300, align: 'right', children: '$299.97' }),
            ],
          }),
          TableRow({
            children: [
              TableCell({ width: 600, children: 'Tax (8%)' }),
              TableCell({ width: 300, align: 'right', children: '$24.00' }),
            ],
          }),
          TableRow({
            style: { bold: true },
            children: [
              TableCell({ width: 600, children: 'TOTAL' }),
              TableCell({ width: 300, align: 'right', children: '$323.97' }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 10 } }),
      Line({ char: '=', length: 'fill' }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, 'Data Display Components', 'components-04-data-display');
}

main().catch(console.error);
