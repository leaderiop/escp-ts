/**
 * Content Components Example
 *
 * Demonstrates: Text, Line, Template
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
    style: { width: 576, padding: 20 },
    children: [
      // Text - Basic usage
      Text({
        style: { bold: true, doubleWidth: true },
        children: "Text Component",
      }),
      Line({ char: "=", length: "fill" }),

      Stack({
        style: { gap: 5, padding: { top: 10, bottom: 10 } },
        children: [
          Text({ children: "Plain text" }),
          Text({ style: { bold: true }, children: "Bold text" }),
          Text({ style: { italic: true }, children: "Italic text" }),
          Text({ style: { underline: true }, children: "Underlined text" }),
          Text({
            style: { bold: true, italic: true },
            children: "Bold + Italic",
          }),
          Text({ style: { doubleWidth: true }, children: "Double width" }),
          Text({ style: { doubleHeight: true }, children: "Double height" }),
          Text({
            style: { condensed: true },
            children: "Condensed text (more characters per line)",
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Text alignment
      Text({ style: { bold: true }, children: "Text Alignment:" }),
      Stack({
        style: { gap: 5, padding: 10, width: "fill" },
        children: [
          Text({ align: "left", children: "Left aligned (default)" }),
          Text({ align: "center", children: "Center aligned" }),
          Text({ align: "right", children: "Right aligned" }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Line - Separators
      Text({ style: { bold: true }, children: "Line Component:" }),
      Stack({
        style: { gap: 10, padding: 10 },
        children: [
          Text({ children: "Single line:" }),
          Line({ char: "-", length: "fill" }),

          Text({ children: "Double line:" }),
          Line({ char: "=", length: "fill" }),

          Text({ children: "Dotted line:" }),
          Line({ char: ".", length: "fill" }),

          Text({ children: "Star line:" }),
          Line({ char: "*", length: "fill" }),

          Text({ children: "Fixed length (200):" }),
          Line({ char: "-", length: 200 }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Template - Variable interpolation
      Text({ style: { bold: true }, children: "Template Component:" }),
      Stack({
        style: { gap: 5, padding: 10 },
        children: [
          Template({ template: "Customer: {{customer.name}}" }),
          Template({ template: "Email: {{customer.email}}" }),
          Template({ template: "Phone: {{customer.phone}}" }),
          Line({ char: "-", length: "fill" }),
          Template({ template: "Order #{{order.number}}" }),
          Template({ template: "Date: {{order.date}}" }),
          Template({
            template: "Total: {{order.total}}",
            style: { bold: true },
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Template with alignment
      Text({ style: { bold: true }, children: "Template with Alignment:" }),
      Flex({
        style: { padding: 10 },
        children: [
          Text({ style: { width: 150 }, children: "Order Total:" }),
          Spacer({ flex: true }),
          Template({
            template: "{{order.total}}",
            style: { bold: true },
            align: "right",
          }),
        ],
      }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, "Content Components", "components-02-content");
}

main().catch(console.error);
