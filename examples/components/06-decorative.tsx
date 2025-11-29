/**
 * Decorative Components Example
 *
 * Demonstrates: Divider, Border, Box, BoxedText, Panel, Section
 * Layout: Uses full page width with horizontal sections
 *
 * NEW: CP437 box-drawing character support for borders
 */

import { LayoutEngine } from "../../src";
import { Stack, Flex, Layout, Text, Line, Spacer } from "../../src/jsx";
import { Divider, Border, Box, BoxedText, Panel, Section } from "../../src/jsx/components";
import { Badge, Label } from "../../src/jsx/components";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";


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
        style: { gap: 60 },
        children: [
          // Column 1: Divider Component
          Stack({
            style: { width: '32%' },
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

          // Column 2: Border Component (ASCII and CP437)
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: "Border Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 10 },
                children: [
                  Text({ children: "ASCII Single:" }),
                  Border({
                    variant: "single",
                    children: Stack({
                      style: { padding: 5 },
                      children: [Text({ children: "Content" })],
                    }),
                  }),
                  Text({ children: "CP437 Single:" }),
                  Border({
                    variant: "cp437-single",
                    children: Stack({
                      style: { padding: 5 },
                      children: [Text({ children: "Content" })],
                    }),
                  }),
                  Text({ children: "CP437 Double:" }),
                  Border({
                    variant: "cp437-double",
                    children: Stack({
                      style: { padding: 5 },
                      children: [Text({ children: "Content" })],
                    }),
                  }),
                ],
              }),
            ],
          }),

          // Column 3: BoxedText Component (NEW)
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: "BoxedText Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 10 },
                children: [
                  Text({ children: "Single border:" }),
                  BoxedText({
                    borderStyle: "single",
                    padding: 2,
                    children: "Hello World",
                  }),
                  Text({ children: "Double border:" }),
                  BoxedText({
                    borderStyle: "double",
                    padding: 2,
                    children: "Important!",
                  }),
                  Text({ children: "ASCII fallback:" }),
                  BoxedText({
                    borderStyle: "ascii",
                    padding: 1,
                    children: "Universal",
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
        style: { gap: 60 },
        children: [
          // Simple Panel
          Stack({
            style: { width: '32%' },
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
            style: { width: '32%' },
            children: [
              Panel({
                title: "Order Status",
                headerActions: Badge({ variant: "success", children: "SHIPPED" }),
                children: Stack({
                  style: { gap: 3 },
                  children: [
                    Label({ label: "Order", labelWidth: 300, value: "12345" }),
                    Label({ label: "Date", labelWidth: 300, value: "2024-12-15" }),
                    Label({ label: "Carrier", labelWidth: 300, value: "FedEx" }),
                  ],
                }),
              }),
            ],
          }),

          // Warning Panel
          Stack({
            style: { width: '32%' },
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
        style: { gap: 60 },
        children: [
          Stack({
            style: { width: '32%' },
            children: [
              Section({
                title: "Introduction",
                level: 2,
                children: Text({
                  children: "Semantic grouping for docs.",
                }),
              }),
            ],
          }),

          Stack({
            style: { width: '32%' },
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
            style: { width: '32%' },
            children: [
              Section({
                title: "Conclusion",
                level: 3,
                children: Text({
                  children: "Organize content cleanly.",
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
