/**
 * Data Display Components Example
 *
 * Demonstrates: Table, TableRow, TableCell, List, ListItem, Card, Badge
 */

import { LayoutEngine } from "../../src";
import { Stack, Flex, Layout, Text, Line } from "../../src/jsx";
import {
  Table,
  TableRow,
  TableCell,
  List,
  Card,
  Badge,
} from "../../src/jsx/components";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

async function main() {
  printSection("Data Display Components");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  // Set data for data-bound components
  engine.setData({
    products: [
      { name: "Laptop Pro", sku: "LP-001", price: "$1,299.00", stock: 15 },
      { name: "Wireless Mouse", sku: "WM-042", price: "$29.99", stock: 150 },
      { name: "USB-C Hub", sku: "UH-108", price: "$49.99", stock: 75 },
      { name: 'Monitor 27"', sku: "MN-270", price: "$399.00", stock: 8 },
    ],
    notes: [
      "Handle with care",
      "Fragile items included",
      "Customer requested gift wrap",
    ],
  });

  // Use wider layout to fit content without truncation
  // At 10 CPI: 36 dots per character
  // 1800 dots = 50 chars wide (comfortable for typical content)
  const doc = Layout({
    style: { width: 1800, padding: 20 },
    children: [
      Text({
        style: { bold: true, doubleWidth: true },
        children: "Data Display",
      }),
      Line({ char: "=", length: "fill" }),

      // Badge - Status indicators
      Text({ style: { bold: true }, children: "Badge Component:" }),
      Stack({
        style: { padding: 10, gap: 10 },
        children: [
          Flex({
            style: { gap: 20 },
            children: [
              Text({ children: "Order Status:" }),
              Badge({ variant: "success", children: "PAID" }),
            ],
          }),
          Flex({
            style: { gap: 20 },
            children: [
              Text({ children: "Inventory:" }),
              Badge({ variant: "warning", children: "LOW STOCK" }),
            ],
          }),
          Flex({
            style: { gap: 20 },
            children: [
              Text({ children: "Shipping:" }),
              Badge({ variant: "error", children: "DELAYED" }),
            ],
          }),
          Flex({
            style: { gap: 20 },
            children: [
              Text({ children: "Category:" }),
              Badge({ variant: "default", children: "ELECTRONICS" }),
            ],
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Card - Grouped content
      Text({ style: { bold: true }, children: "Card Component:" }),
      Stack({
        style: { padding: 10, gap: 15 },
        children: [
          Card({
            title: "Customer Information",
            children: Stack({
              style: { gap: 3 },
              children: [
                Text({ children: "John Doe" }),
                Text({ children: "john@example.com" }),
                Text({ children: "+1 (555) 123-4567" }),
              ],
            }),
          }),

          Card({
            title: "Shipping Address",
            border: "=",
            children: Stack({
              style: { gap: 3 },
              children: [
                Text({ children: "123 Main Street" }),
                Text({ children: "Suite 456" }),
                Text({ children: "New York, NY 10001" }),
              ],
            }),
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // List - Bullet and numbered lists
      Text({ style: { bold: true }, children: "List Component:" }),
      Stack({
        style: { padding: 10, gap: 15 },
        children: [
          Text({ children: "Bullet List:" }),
          List({
            variant: "bullet",
            children: [
              Text({ children: "First item" }),
              Text({ children: "Second item" }),
              Text({ children: "Third item" }),
            ],
          }),

          Text({ children: "Numbered List:" }),
          List({
            variant: "numbered",
            children: [
              Text({ children: "Step one" }),
              Text({ children: "Step two" }),
              Text({ children: "Step three" }),
            ],
          }),

          Text({ children: "Custom Bullet:" }),
          List({
            variant: "bullet",
            bullet: "->",
            indent: 80, // "-> " is 3 chars = 108 dots, use 80 for tight spacing
            children: [
              Text({ children: "Arrow item A" }),
              Text({ children: "Arrow item B" }),
            ],
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Table - Column-based with static data
      Text({
        style: { bold: true },
        children: "Table Component (Static Data):",
      }),
      Stack({
        style: { padding: 10 },
        children: [
          Table({
            // Column widths calculated for 10 CPI (36 dots/char):
            // - Product: 12 chars max = 432 dots, use 450
            // - SKU: 6 chars = 216 dots, use 220
            // - Price: 8 chars = 288 dots, use 300 (incl. alignment padding)
            // - Stock: 5 chars = 180 dots, use 200
            columns: [
              { header: "Product", key: "name", width: 450 },
              { header: "SKU", key: "sku", width: 220 },
              { header: "Price", key: "price", width: 300, align: "right" },
              { header: "Stock", key: "stock", width: 200, align: "right" },
            ],
            data: [
              { name: "Keyboard", sku: "KB-101", price: "$79.99", stock: 45 },
              { name: "Webcam HD", sku: "WC-200", price: "$89.99", stock: 30 },
              {
                name: "Headphones",
                sku: "HP-300",
                price: "$149.99",
                stock: 22,
              },
            ],
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Table - Data-bound
      Text({
        style: { bold: true },
        children: "Table Component (Data-Bound):",
      }),
      Stack({
        style: { padding: 10 },
        children: [
          Table({
            columns: [
              { header: "Product", key: "name", width: 450 },
              { header: "SKU", key: "sku", width: 220 },
              { header: "Price", key: "price", width: 300, align: "right" },
              { header: "Stock", key: "stock", width: 200, align: "right" },
            ],
            items: "products",
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Table - Children-based (manual rows)
      Text({
        style: { bold: true },
        children: "Table Component (Manual Rows):",
      }),
      Stack({
        style: { padding: 10 },
        children: [
          Table({
            children: [
              TableRow({
                style: { bold: true },
                children: [
                  TableCell({ width: 200, children: "Description" }),
                  TableCell({ width: 100, align: "right", children: "Amount" }),
                ],
              }),
              TableRow({
                children: [
                  TableCell({ width: 200, children: "Subtotal" }),
                  TableCell({
                    width: 100,
                    align: "right",
                    children: "$299.97",
                  }),
                ],
              }),
              TableRow({
                children: [
                  TableCell({ width: 200, children: "Tax (8%)" }),
                  TableCell({ width: 100, align: "right", children: "$24.00" }),
                ],
              }),
              TableRow({
                style: { bold: true },
                children: [
                  TableCell({ width: 200, children: "TOTAL" }),
                  TableCell({
                    width: 100,
                    align: "right",
                    children: "$323.97",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, "Data Display Components", "components-04-data-display");
}

main().catch(console.error);
