/**
 * Control Flow Components Example
 *
 * Demonstrates: If, Switch, Case, For
 * Layout: Uses full page width with horizontal sections
 */

import { LayoutEngine } from "../../src";
import {
  Stack,
  Flex,
  Layout,
  Text,
  Line,
  Template,
  If,
  Switch,
  Case,
  For,
  Spacer,
} from "../../src/jsx";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

// Calculate printable width: 13.6 inches * 360 DPI = 4896 dots
const PRINTABLE_WIDTH = Math.round(13.6 * 360);
// Column width for 2-column layout with gap
const COLUMN_GAP = 80;
const COLUMN_WIDTH = Math.floor((PRINTABLE_WIDTH - COLUMN_GAP) / 2);

async function main() {
  printSection("Control Flow Components");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  // Set data for conditionals and iteration
  engine.setData({
    user: {
      name: "John Doe",
      isPremium: true,
      role: "admin",
      balance: 150.0,
    },
    items: [
      { name: "Widget A", price: 25.0, qty: 2 },
      { name: "Widget B", price: 15.5, qty: 3 },
      { name: "Widget C", price: 42.0, qty: 1 },
    ],
    emptyList: [],
    statuses: ["pending", "processing", "shipped", "delivered"],
  });

  const doc = Layout({
    style: { padding: 10 },
    children: [
      // Title
      Text({
        style: { bold: true, doubleWidth: true },
        children: "Control Flow Components",
      }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 20 } }),

      // Row 1: If and Switch (2 columns)
      Flex({
        style: { gap: COLUMN_GAP },
        children: [
          // Column 1: If Component
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "If Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { gap: 8, padding: { top: 5 } },
                children: [
                  // Simple condition
                  Text({ children: "Premium check:" }),
                  If({
                    condition: { path: "user.isPremium", operator: "eq", value: true },
                    else: Text({ children: "  Standard Member" }),
                    children: Text({
                      style: { bold: true },
                      children: "  * PREMIUM MEMBER *",
                    }),
                  }),

                  // Numeric comparison
                  Text({ children: "Balance check:" }),
                  If({
                    condition: { path: "user.balance", operator: "gt", value: 100 },
                    children: Text({ children: "  Balance > $100 - Free shipping!" }),
                  }),

                  // String comparison
                  Text({ children: "Role check:" }),
                  If({
                    condition: { path: "user.role", operator: "eq", value: "admin" },
                    children: Text({
                      style: { italic: true },
                      children: "  [Admin Access Granted]",
                    }),
                  }),
                ],
              }),
            ],
          }),

          // Column 2: Switch/Case Component
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "Switch/Case Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { gap: 5, padding: { top: 5 } },
                children: [
                  Text({ children: "User role display:" }),
                  Switch({
                    path: "user.role",
                    default: Text({ children: "  Unknown Role" }),
                    children: [
                      Case({
                        value: "admin",
                        children: Text({
                          style: { bold: true },
                          children: "  Administrator",
                        }),
                      }),
                      Case({
                        value: "moderator",
                        children: Text({ children: "  Moderator" }),
                      }),
                      Case({
                        value: ["user", "guest"],
                        children: Text({ children: "  Regular User" }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 10 } }),

      // Row 2: For Component (full width)
      Text({ style: { bold: true }, children: "For Component" }),
      Line({ char: "-", length: "fill" }),
      Spacer({ style: { height: 5 } }),

      // Order items table
      Text({ children: "Order Items:" }),
      Line({ char: "-", length: 1400 }),

      // Header
      Flex({
        style: { bold: true },
        children: [
          Text({ style: { width: 500 }, children: "Item" }),
          Text({ style: { width: 200 }, align: "right", children: "Qty" }),
          Text({ style: { width: 300 }, align: "right", children: "Price" }),
        ],
      }),
      Line({ char: "-", length: 1400 }),

      // Items with For loop
      For({
        items: "items",
        as: "item",
        children: Flex({
          children: [
            Stack({
              style: { width: 500 },
              children: Template({ template: "{{item.name}}" }),
            }),
            Stack({
              style: { width: 200 },
              children: Template({ template: "{{item.qty}}", align: "right" }),
            }),
            Stack({
              style: { width: 300 },
              children: Template({ template: "${{item.price}}", align: "right" }),
            }),
          ],
        }),
      }),
      Line({ char: "-", length: 1400 }),

      Spacer({ style: { height: 15 } }),

      // For with separator and empty state (2 columns)
      Flex({
        style: { gap: COLUMN_GAP },
        children: [
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "For with Separator:" }),
              Stack({
                style: { padding: { top: 5 } },
                children: [
                  For({
                    items: "statuses",
                    as: "status",
                    separator: Text({ children: " -> " }),
                    children: Template({ template: "{{status}}" }),
                  }),
                ],
              }),
            ],
          }),

          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "For with Empty State:" }),
              Stack({
                style: { padding: { top: 5 } },
                children: [
                  For({
                    items: "emptyList",
                    as: "item",
                    empty: Text({
                      style: { italic: true },
                      children: "No items to display",
                    }),
                    children: Template({ template: "{{item}}" }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 10 } }),
      Line({ char: "=", length: "fill" }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, "Control Flow Components", "components-03-controls");
}

main().catch(console.error);
