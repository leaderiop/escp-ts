/**
 * Control Flow Components Example
 *
 * Demonstrates: If, Switch, Case, For
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
} from "../../src/jsx";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

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
    style: { width: 576, padding: 20 },
    children: [
      Text({
        style: { bold: true, doubleWidth: true },
        children: "Control Flow",
      }),
      Line({ char: "=", length: "fill" }),

      // If - Conditional rendering
      Text({ style: { bold: true }, children: "If Component:" }),
      Stack({
        style: { gap: 5, padding: 10 },
        children: [
          // Simple condition
          If({
            condition: { path: "user.isPremium", operator: "eq", value: true },
            else: Text({ children: "Standard Member" }),
            children: Text({
              style: { bold: true },
              children: "* PREMIUM MEMBER *",
            }),
          }),

          // Numeric comparison
          If({
            condition: { path: "user.balance", operator: "gt", value: 100 },
            children: Text({ children: "Balance over $100 - Free shipping!" }),
          }),

          // String comparison
          If({
            condition: { path: "user.role", operator: "eq", value: "admin" },
            children: Text({
              style: { italic: true },
              children: "[Admin Access Granted]",
            }),
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Switch/Case - Multi-branch selection
      Text({ style: { bold: true }, children: "Switch/Case Component:" }),
      Stack({
        style: { gap: 5, padding: 10 },
        children: [
          Text({ children: "User role display:" }),
          Switch({
            path: "user.role",
            default: Text({ children: "Unknown Role" }),
            children: [
              Case({
                value: "admin",
                children: Text({
                  style: { bold: true },
                  children: "Administrator",
                }),
              }),
              Case({
                value: "moderator",
                children: Text({ children: "Moderator" }),
              }),
              Case({
                value: ["user", "guest"],
                children: Text({ children: "Regular User" }),
              }),
            ],
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // For - Array iteration
      Text({ style: { bold: true }, children: "For Component:" }),
      Stack({
        style: { gap: 5, padding: 10 },
        children: [
          Text({ children: "Order Items:" }),
          Line({ char: "-", length: "fill" }),

          // Header
          Flex({
            style: { bold: true },
            children: [
              Text({ style: { width: 200 }, children: "Item" }),
              Text({ style: { width: 80 }, align: "right", children: "Qty" }),
              Text({ style: { width: 100 }, align: "right", children: "Price" }),
            ],
          }),

          Line({ char: "-", length: "fill" }),

          // Items with For loop
          For({
            items: "items",
            as: "item",
            indexAs: "idx",
            children: Flex({
              children: [
                Stack({
                  style: { width: 200 },
                  children: Template({ template: "{{item.name}}" }),
                }),
                Stack({
                  style: { width: 80 },
                  children: Template({
                    template: "{{item.qty}}",
                    align: "right",
                  }),
                }),
                Stack({
                  style: { width: 100 },
                  children: Template({
                    template: "${{item.price}}",
                    align: "right",
                  }),
                }),
              ],
            }),
          }),

          Line({ char: "-", length: "fill" }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // For with separator
      Text({ style: { bold: true }, children: "For with Separator:" }),
      Stack({
        style: { padding: 10 },
        children: [
          For({
            items: "statuses",
            as: "status",
            separator: Text({ children: " -> " }),
            children: Template({ template: "{{status}}" }),
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // For with empty state
      Text({ style: { bold: true }, children: "For with Empty State:" }),
      Stack({
        style: { padding: 10 },
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
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, "Control Flow Components", "components-03-controls");
}

main().catch(console.error);
