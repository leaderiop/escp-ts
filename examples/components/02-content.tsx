/**
 * Content Components Example
 *
 * Demonstrates: Text, Line, Template
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
  Spacer,
} from "../../src/jsx";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

// Calculate printable width: 13.6 inches * 360 DPI = 4896 dots
const PRINTABLE_WIDTH = Math.round(13.6 * 360);
// Column width for 3-column layout with gaps
const COLUMN_GAP = 60;
const COLUMN_WIDTH = Math.floor((PRINTABLE_WIDTH - COLUMN_GAP * 2) / 3);

async function main() {
  printSection("Content Components");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  // Set data for template interpolation
  engine.setData({
    customer: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 (555) 123-4567",
    },
    order: {
      number: "ORD-2024-001",
      date: "2024-12-15",
      total: "$125.00",
    },
  });

  const doc = Layout({
    style: { padding: 10 },
    children: [
      // Title
      Text({
        style: { bold: true, doubleWidth: true },
        children: "Content Components",
      }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 20 } }),

      // Row 1: Text styles and Line types (3 columns)
      Flex({
        style: { gap: COLUMN_GAP },
        children: [
          // Column 1: Text Styles
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "Text Styles" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { gap: 5, padding: { top: 5 } },
                children: [
                  Text({ children: "Plain text" }),
                  Text({ style: { bold: true }, children: "Bold text" }),
                  Text({ style: { italic: true }, children: "Italic text" }),
                  Text({ style: { underline: true }, children: "Underlined" }),
                  Text({ style: { bold: true, italic: true }, children: "Bold + Italic" }),
                  Text({ style: { doubleWidth: true }, children: "Double W" }),
                  Text({ style: { doubleHeight: true }, children: "Double H" }),
                  Text({ style: { condensed: true }, children: "Condensed (more chars/line)" }),
                ],
              }),
            ],
          }),

          // Column 2: Text Alignment
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "Text Alignment" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { gap: 5, padding: { top: 5 } },
                children: [
                  Text({ align: "left", children: "Left (default)" }),
                  Text({ align: "center", children: "Center aligned" }),
                  Text({ align: "right", children: "Right aligned" }),
                ],
              }),
            ],
          }),

          // Column 3: Line Types
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ style: { bold: true }, children: "Line Types" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { gap: 8, padding: { top: 5 } },
                children: [
                  Text({ children: "Single:" }),
                  Line({ char: "-", length: "fill" }),
                  Text({ children: "Double:" }),
                  Line({ char: "=", length: "fill" }),
                  Text({ children: "Dotted:" }),
                  Line({ char: ".", length: "fill" }),
                  Text({ children: "Star:" }),
                  Line({ char: "*", length: "fill" }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 10 } }),

      // Row 2: Template Component (full width)
      Text({ style: { bold: true }, children: "Template Component" }),
      Line({ char: "-", length: "fill" }),
      Spacer({ style: { height: 5 } }),

      Flex({
        style: { gap: COLUMN_GAP },
        children: [
          // Customer info
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ children: "Customer Info:" }),
              Stack({
                style: { padding: { left: 20, top: 5 }, gap: 3 },
                children: [
                  Template({ template: "Name: {{customer.name}}" }),
                  Template({ template: "Email: {{customer.email}}" }),
                  Template({ template: "Phone: {{customer.phone}}" }),
                ],
              }),
            ],
          }),

          // Order info
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ children: "Order Info:" }),
              Stack({
                style: { padding: { left: 20, top: 5 }, gap: 3 },
                children: [
                  Template({ template: "Order #{{order.number}}" }),
                  Template({ template: "Date: {{order.date}}" }),
                  Template({
                    template: "Total: {{order.total}}",
                    style: { bold: true },
                  }),
                ],
              }),
            ],
          }),

          // Template with alignment
          Stack({
            style: { width: COLUMN_WIDTH },
            children: [
              Text({ children: "Aligned Template:" }),
              Flex({
                style: { padding: { top: 5 } },
                children: [
                  Text({ children: "Order Total:" }),
                  Spacer({ flex: true }),
                  Template({
                    template: "{{order.total}}",
                    style: { bold: true },
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
  await renderPreview(output, "Content Components", "components-02-content");
}

main().catch(console.error);
