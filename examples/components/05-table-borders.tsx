/**
 * Table Borders Example
 *
 * Demonstrates: Table component with full grid borders
 * Border styles: ASCII (+,-,|), Single-line CP437, Double-line CP437
 *
 * Spacing Strategy: Uses margins instead of Spacer components for cleaner,
 * more maintainable layout with proper visual hierarchy.
 */

import { LayoutEngine } from "../../src";
import { Stack, Flex, Layout, Text, Line } from "../../src/jsx";
import { Table } from "../../src/jsx/components";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

async function main() {
  printSection("Table Borders");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  const doc = Layout({
    style: { padding: 10 },
    children: [
      // Title Section
      Text({
        style: { bold: true, doubleWidth: true },
        children: "Table Borders",
      }),
      Line({ style: { margin: { top: 4, bottom: 20 } }, char: "=", length: "fill" }),

      // SECTION 1: Border Style Comparison
      Text({
        style: { bold: true, margin: { bottom: 6 } },
        children: "Border Style Comparison",
      }),
      Text({
        style: { margin: { bottom: 12 } },
        children: "Same data rendered with ASCII, Single-line, and Double-line borders",
      }),

      Flex({
        style: { gap: 20, margin: { bottom: 20 } },
        children: [
          // Column 1: ASCII Border
          Stack({
            style: { width: "30%" },
            children: [
              Text({
                style: { bold: true, margin: { bottom: 6 } },
                children: "ASCII (+,-,|)",
              }),
              Table({
                columns: [
                  { header: "Item", key: "item", width: "45%" },
                  { header: "Qty", key: "qty", width: "25%", align: "right" },
                  { header: "Price", key: "price", width: "30%", align: "right" },
                ],
                data: [
                  { item: "Widget A", qty: 10, price: "$25.00" },
                  { item: "Widget B", qty: 5, price: "$45.00" },
                  { item: "Widget C", qty: 20, price: "$15.00" },
                ],
                border: "ascii",
              }),
            ],
          }),

          // Column 2: Single-line Border
          Stack({
            style: { width: "30%" },
            children: [
              Text({
                style: { bold: true, margin: { bottom: 6 } },
                children: "Single-line CP437",
              }),
              Table({
                columns: [
                  { header: "Item", key: "item", width: "45%" },
                  { header: "Qty", key: "qty", width: "25%", align: "right" },
                  { header: "Price", key: "price", width: "30%", align: "right" },
                ],
                data: [
                  { item: "Widget A", qty: 10, price: "$25.00" },
                  { item: "Widget B", qty: 5, price: "$45.00" },
                  { item: "Widget C", qty: 20, price: "$15.00" },
                ],
                border: "single",
              }),
            ],
          }),

          // Column 3: Double-line Border
          Stack({
            style: { width: "30%" },
            children: [
              Text({
                style: { bold: true, margin: { bottom: 6 } },
                children: "Double-line CP437",
              }),
              Table({
                columns: [
                  { header: "Item", key: "item", width: "45%" },
                  { header: "Qty", key: "qty", width: "25%", align: "right" },
                  { header: "Price", key: "price", width: "30%", align: "right" },
                ],
                data: [
                  { item: "Widget A", qty: 10, price: "$25.00" },
                  { item: "Widget B", qty: 5, price: "$45.00" },
                  { item: "Widget C", qty: 20, price: "$15.00" },
                ],
                border: "double",
              }),
            ],
          }),
        ],
      }),

      // Section Separator
      Line({ style: { margin: { top: 5, bottom: 20 } }, char: "-", length: "fill" }),

      // SECTION 2: Practical Use Cases
      Text({
        style: { bold: true, margin: { bottom: 12 } },
        children: "Practical Use Cases",
      }),

      Flex({
        style: { gap: 40, margin: { bottom: 20 } },
        children: [
          // Use Case 1: Inventory Report (ASCII - universal compatibility)
          Stack({
            style: { width: "45%" },
            children: [
              Text({
                style: { bold: true, margin: { bottom: 4 } },
                children: "Inventory Report (ASCII)",
              }),
              Text({
                style: { margin: { bottom: 10 } },
                children: "Universal compatibility for any printer",
              }),
              Table({
                columns: [
                  { header: "Product", key: "name", width: "35%" },
                  { header: "SKU", key: "sku", width: "20%" },
                  { header: "Stock", key: "stock", width: "20%", align: "right" },
                  { header: "Status", key: "status", width: "25%" },
                ],
                data: [
                  { name: "Keyboard Pro", sku: "KB-101", stock: 45, status: "OK" },
                  { name: "Webcam HD", sku: "WC-200", stock: 8, status: "LOW" },
                  { name: "USB Hub", sku: "UH-400", stock: 120, status: "OK" },
                  { name: "Headphones", sku: "HP-300", stock: 3, status: "CRIT" },
                ],
                border: "ascii",
              }),
            ],
          }),

          // Use Case 2: Invoice (Double - professional emphasis)
          Stack({
            style: { width: "45%" },
            children: [
              Text({
                style: { bold: true, margin: { bottom: 4 } },
                children: "Invoice Total (Double)",
              }),
              Text({
                style: { margin: { bottom: 10 } },
                children: "Professional look for financial documents",
              }),
              Table({
                columns: [
                  { header: "Description", key: "desc", width: "60%" },
                  { header: "Amount", key: "amount", width: "40%", align: "right" },
                ],
                data: [
                  { desc: "Professional Services", amount: "$3,000.00" },
                  { desc: "Software License", amount: "$995.00" },
                  { desc: "Hardware", amount: "$2,598.00" },
                  { desc: "Subtotal", amount: "$6,593.00" },
                  { desc: "Tax (8.25%)", amount: "$544.00" },
                  { desc: "TOTAL DUE", amount: "$7,137.00" },
                ],
                border: "double",
              }),
            ],
          }),
        ],
      }),

      // Section Separator
      Line({ style: { margin: { top: 5, bottom: 20 } }, char: "-", length: "fill" }),

      // SECTION 3: Department/Status Tables (Single-line)
      Text({
        style: { bold: true, margin: { bottom: 6 } },
        children: "Department Reports (Single-line)",
      }),
      Text({
        style: { margin: { bottom: 12 } },
        children: "Clean professional appearance with CP437 box-drawing characters",
      }),

      Flex({
        style: { gap: 100, margin: { bottom: 15 } },
        children: [
          // Department Budget
          Stack({
            style: { width: "40%" },
            children: [
              Table({
                columns: [
                  { header: "Department", key: "dept", width: "38%" },
                  { header: "Manager", key: "manager", width: "32%" },
                  { header: "Budget", key: "budget", width: "30%", align: "right" },
                ],
                data: [
                  { dept: "Engineering", manager: "J. Smith", budget: "$2,500,000" },
                  { dept: "Marketing", manager: "B. Johnson", budget: "$800,000" },
                  { dept: "Sales", manager: "A. Brown", budget: "$1,200,000" },
                ],
                border: "single",
              }),
            ],
          }),

          // Project Status
          Stack({
            style: { width: "40%" },
            children: [
              Table({
                columns: [
                  { header: "Project", key: "project", width: "42%" },
                  { header: "Status", key: "status", width: "28%" },
                  { header: "Due Date", key: "due", width: "30%", align: "right" },
                ],
                data: [
                  { project: "Website Redesign", status: "Active", due: "2024-03-15" },
                  { project: "Mobile App v2", status: "Review", due: "2024-04-01" },
                  { project: "API Gateway", status: "Complete", due: "2024-02-28" },
                ],
                border: "single",
              }),
            ],
          }),
        ],
      }),

      // Final separator
      Line({ style: { margin: { top: 10 } }, char: "=", length: "fill" }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, "Table Borders", "components-05-table-borders");
}

main().catch(console.error);
