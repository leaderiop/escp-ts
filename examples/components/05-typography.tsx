/**
 * Typography Components Example
 *
 * Demonstrates: Heading, Paragraph, Label, Caption, Code
 */

import { LayoutEngine } from "../../src";
import { Stack, Layout, Text, Line } from "../../src/jsx";
import {
  Heading,
  Paragraph,
  Label,
  Caption,
  Code,
  Badge,
} from "../../src/jsx/components";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

async function main() {
  printSection("Typography Components");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  const doc = Layout({
    style: { width: 576, padding: 20 },
    children: [
      Text({ style: { bold: true, doubleWidth: true }, children: "Typography" }),
      Line({ char: "=", length: "fill" }),

      // Heading - Different levels
      Text({ style: { bold: true }, children: "Heading Component:" }),
      Stack({
        style: { padding: 10, gap: 10 },
        children: [
          Heading({ level: 1, children: "Heading Level 1" }),
          Heading({ level: 2, children: "Heading Level 2" }),
          Heading({ level: 3, children: "Heading Level 3" }),
          Heading({ level: 4, children: "Heading Level 4" }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Heading with underline
      Text({ style: { bold: true }, children: "Heading with Underline:" }),
      Stack({
        style: { padding: 10, gap: 10 },
        children: [
          Heading({ level: 1, underline: true, children: "H1 with underline" }),
          Heading({ level: 2, underline: true, children: "H2 with underline" }),
          Heading({
            level: 3,
            underline: "*",
            children: "H3 with custom underline",
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Heading alignment
      Text({ style: { bold: true }, children: "Heading Alignment:" }),
      Stack({
        style: { padding: 10, gap: 5 },
        children: [
          Heading({ level: 3, align: "left", children: "Left aligned" }),
          Heading({ level: 3, align: "center", children: "Center aligned" }),
          Heading({ level: 3, align: "right", children: "Right aligned" }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Paragraph - Text blocks
      Text({ style: { bold: true }, children: "Paragraph Component:" }),
      Stack({
        style: { padding: 10 },
        children: [
          Paragraph({
            children:
              "This is a paragraph of text. Paragraphs have automatic margins above and below, making them perfect for body text.",
          }),
          Paragraph({
            children:
              "Another paragraph follows. Notice the spacing between paragraphs is handled automatically.",
          }),
          Paragraph({
            indent: 30,
            children:
              "This paragraph has an indent. The first line starts a bit further in.",
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Label - Key-value pairs
      Text({ style: { bold: true }, children: "Label Component:" }),
      Stack({
        style: { padding: 10, gap: 5 },
        children: [
          Label({ label: "Name", value: "John Doe" }),
          Label({ label: "Email", value: "john@example.com" }),
          Label({ label: "Phone", value: "+1 (555) 123-4567" }),
          Label({
            label: "Status",
            children: Badge({ variant: "success", children: "ACTIVE" }),
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Label customization
      Text({ style: { bold: true }, children: "Label Customization:" }),
      Stack({
        style: { padding: 10, gap: 5 },
        children: [
          Label({ label: "Default", value: "With colon" }),
          Label({ label: "No colon", value: "Custom", colon: false }),
          Label({ label: "Wide label", value: "Data", labelWidth: 200 }),
          Label({ label: "Narrow", value: "Small label", labelWidth: 80 }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Caption - Small text
      Text({ style: { bold: true }, children: "Caption Component:" }),
      Stack({
        style: { padding: 10, gap: 5 },
        children: [
          Text({ children: "Main content here" }),
          Caption({
            children: "This is a caption - smaller, italic text for descriptions",
          }),
          Text({ children: "Another item" }),
          Caption({ align: "right", children: "Right-aligned caption" }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Code - Code blocks
      Text({ style: { bold: true }, children: "Code Component:" }),
      Stack({
        style: { padding: 10, gap: 10 },
        children: [
          Text({ children: "Inline code:" }),
          Text({ children: "Use " }),
          Code({ inline: true, children: "console.log()" }),
          Text({ children: " to debug." }),

          Text({ children: "Code block with border:" }),
          Code({
            children:
              "const total = items.reduce((sum, item) => sum + item.price, 0);",
          }),

          Text({ children: "Code block without border:" }),
          Code({
            border: false,
            children: "npm install escp-ts",
          }),
        ],
      }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, "Typography Components", "components-05-typography");
}

main().catch(console.error);
