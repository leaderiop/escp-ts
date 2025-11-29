/**
 * Decorative Components Example
 *
 * Demonstrates: Divider, Border, Box, Panel, Section
 * Layout: Uses full page width with horizontal sections
 */

import { LayoutEngine } from "../../src";
import { Stack, Flex, Layout, Text, Line, Spacer } from "../../src/jsx";
import { Divider, Border, Box, Panel, Section } from "../../src/jsx/components";
import { Badge, Label } from "../../src/jsx/components";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

// Calculate printable width: 13.6 inches * 360 DPI = 4896 dots
const PRINTABLE_WIDTH = Math.round(13.6 * 360);
// Column width for 3-column layout with gaps
const COLUMN_GAP = 60;
const COLUMN_WIDTH = Math.floor((PRINTABLE_WIDTH - COLUMN_GAP * 2) / 3);

async function main() {
  printSection("Decorative Components");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  const doc = Layout({
    style: { padding: 10 },
    children: [
      // Title
      Text({ style: { bold: true, doubleWidth: true }, children: "Decorative Components" }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 20 } }),

      // Row 1: Divider and Border (3 columns)
      Flex({
        style: { gap: COLUMN_GAP },
        children: [
          // Column 1: Divider Component
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "Divider Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Text({ children: "Single:" }),
                  Divider({ variant: "single" }),
                  Text({ children: "Double:" }),
                  Divider({ variant: "double" }),
                  Text({ children: "Thick:" }),
                  Divider({ variant: "thick" }),
                  Text({ children: "Dashed:" }),
                  Divider({ variant: "dashed" }),
                ],
              }),
            ],
          }),

          // Column 2: Border Component
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "Border Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 10 },
                children: [
                  Text({ children: "Single:" }),
                  Border({
                    variant: "single",
                    children: Stack({
                      style: { padding: 5 },
                      children: [Text({ children: "Content" })],
                    }),
                  }),
                  Text({ children: "Double:" }),
                  Border({
                    variant: "double",
                    children: Stack({
                      style: { padding: 5 },
                      children: [Text({ children: "Content" })],
                    }),
                  }),
                ],
              }),
            ],
          }),

          // Column 3: Box Component
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "Box Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 10 },
                children: [
                  Text({ children: "Padding only:" }),
                  Box({
                    padding: 10,
                    children: Text({ children: "Padded" }),
                  }),
                  Text({ children: "With border:" }),
                  Box({
                    border: true,
                    padding: 10,
                    children: Text({ children: "Bordered" }),
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

      // Row 2: Panel Component (full width with examples)
      Text({ style: { bold: true }, children: "Panel Component" }),
      Line({ char: "-", length: "fill" }),
      Spacer({ style: { height: 5 } }),

      Flex({
        style: { gap: COLUMN_GAP },
        children: [
          // Simple Panel
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Panel({
                title: "Simple Panel",
                children: Stack({
                  children: [
                    Text({ children: "Panel content here." }),
                    Text({ children: "Multiple lines." }),
                  ],
                }),
              }),
            ],
          }),

          // Panel with Badge
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Panel({
                title: "Order Status",
                headerActions: Badge({ variant: "success", children: "SHIPPED" }),
                children: Stack({
                  style: { gap: 3 },
                  children: [
                    Label({ label: "Order #", value: "12345" }),
                    Label({ label: "Date", value: "2024-12-15" }),
                    Label({ label: "Carrier", value: "FedEx" }),
                  ],
                }),
              }),
            ],
          }),

          // Warning Panel
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Panel({
                title: "Warning",
                headerActions: Badge({ variant: "warning", children: "ALERT" }),
                children: Text({
                  children: "Low stock alert. Review inventory.",
                }),
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 10 } }),

      // Row 3: Section Component (full width)
      Text({ style: { bold: true }, children: "Section Component" }),
      Line({ char: "-", length: "fill" }),
      Spacer({ style: { height: 5 } }),

      Flex({
        style: { gap: COLUMN_GAP },
        children: [
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Section({
                title: "Introduction",
                level: 2,
                children: Text({
                  children: "Sections provide semantic grouping with automatic heading.",
                }),
              }),
            ],
          }),

          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Section({
                title: "Features",
                level: 3,
                children: Stack({
                  style: { gap: 3 },
                  children: [
                    Text({ children: "- Auto margins" }),
                    Text({ children: "- Heading levels" }),
                    Text({ children: "- Clean hierarchy" }),
                  ],
                }),
              }),
            ],
          }),

          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Section({
                title: "Conclusion",
                level: 3,
                children: Text({
                  children: "Sections organize document content effectively.",
                }),
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
  await renderPreview(output, "Decorative Components", "components-06-decorative");
}

main().catch(console.error);
