/**
 * Typography Components Example
 *
 * Demonstrates: Heading, Paragraph, Label, Caption, Code
 * Layout: Uses full page width with horizontal sections
 */

import { LayoutEngine } from "../../src";
import { Stack, Flex, Layout, Text, Line, Spacer } from "../../src/jsx";
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
    style: { padding: 10 },
    children: [
      // Title
      Text({ style: { bold: true, doubleWidth: true }, children: "Typography Components" }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 20 } }),

      // Row 1: Heading levels (3 columns)
      Flex({
        style: { gap: 60 },
        children: [
          // Column 1: Heading Levels
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: "Heading Levels" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 8 },
                children: [
                  Heading({ level: 1, children: "H1 Heading" }),
                  Heading({ level: 2, children: "H2 Heading" }),
                  Heading({ level: 3, children: "H3 Heading" }),
                  Heading({ level: 4, children: "H4 Heading" }),
                ],
              }),
            ],
          }),

          // Column 2: Heading with Underline
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: "Heading Underline" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 8 },
                children: [
                  Heading({ level: 1, underline: true, children: "H1 Underlined" }),
                  Heading({ level: 2, underline: true, children: "H2 Underlined" }),
                  Heading({ level: 3, underline: "*", children: "H3 Custom *" }),
                ],
              }),
            ],
          }),

          // Column 3: Heading Alignment
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: "Heading Alignment" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Heading({ level: 3, align: "left", children: "Left" }),
                  Heading({ level: 3, align: "center", children: "Center" }),
                  Heading({ level: 3, align: "right", children: "Right" }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 10 } }),

      // Row 2: Label and Caption (2 columns)
      Flex({
        style: { gap: 60 },
        children: [
          // Label Component
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: "Label Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Label({ label: "Name", value: "John Doe" }),
                  Label({ label: "Email", value: "john@example.com" }),
                  Label({ label: "Phone", value: "+1 (555) 123-4567" }),
                  Label({
                    label: "Status",
                    children: Badge({ variant: "success", children: "ACTIVE" }),
                  }),
                  Line({ char: "-", length: "fill" }),
                  Text({ children: "Customization:" }),
                  Label({ label: "No colon", value: "Custom", colon: false }),
                  Label({ label: "Wide", value: "200px label", labelWidth: 200 }),
                ],
              }),
            ],
          }),

          // Caption Component
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: "Caption Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Text({ children: "Main content here" }),
                  Caption({ children: "Caption - smaller italic text for descriptions" }),
                  Text({ children: "Another item" }),
                  Caption({ align: "right", children: "Right-aligned caption" }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 10 } }),

      // Row 3: Paragraph and Code (2 columns)
      Flex({
        style: { gap: 60 },
        children: [
          // Paragraph Component
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: "Paragraph Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 } },
                children: [
                  Paragraph({
                    children: "Paragraphs have automatic margins above and below, making them perfect for body text.",
                  }),
                  Paragraph({
                    children: "Notice the spacing between paragraphs is handled automatically.",
                  }),
                  Paragraph({
                    indent: 50,
                    children: "This paragraph has an indent. The first line starts further in.",
                  }),
                ],
              }),
            ],
          }),

          // Code Component
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: "Code Component" }),
              Line({ char: "-", length: "fill" }),
              Stack({
                style: { padding: { top: 5 }, gap: 10 },
                children: [
                  Text({ children: "Inline: Use " }),
                  Code({ inline: true, children: "console.log()" }),

                  Text({ children: "Code block with border:" }),
                  Code({
                    children: "const sum = items.reduce((s, i) => s + i.price, 0);",
                  }),

                  Text({ children: "Without border:" }),
                  Code({
                    border: false,
                    children: "npm install escp-ts",
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
  await renderPreview(output, "Typography Components", "components-05-typography");
}

main().catch(console.error);
