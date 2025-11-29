/**
 * Decorative Components Example
 *
 * Demonstrates: Divider, Border, Box, Panel, Section
 */

import { LayoutEngine } from "../../src";
import { Stack, Layout, Text, Line } from "../../src/jsx";
import { Divider, Border, Box, Panel, Section } from "../../src/jsx/components";
import { Badge, Label } from "../../src/jsx/components";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";

async function main() {
  printSection("Decorative Components");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  const doc = Layout({
    style: { width: 576, padding: 20 },
    children: [
      Text({ style: { bold: true, doubleWidth: true }, children: "Decorative" }),
      Line({ char: "=", length: "fill" }),

      // Divider - Enhanced separators
      Text({ style: { bold: true }, children: "Divider Component:" }),
      Stack({
        style: { padding: 10, gap: 5 },
        children: [
          Text({ children: "Single divider:" }),
          Divider({ variant: "single" }),

          Text({ children: "Double divider:" }),
          Divider({ variant: "double" }),

          Text({ children: "Thick divider:" }),
          Divider({ variant: "thick" }),

          Text({ children: "Dashed divider:" }),
          Divider({ variant: "dashed" }),

          Text({ children: "Custom spacing (15):" }),
          Divider({ variant: "single", spacing: 15 }),
          Text({ children: "After divider" }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Border - ASCII box drawing
      Text({ style: { bold: true }, children: "Border Component:" }),
      Stack({
        style: { padding: 10, gap: 15 },
        children: [
          Text({ children: "Single border:" }),
          Border({
            variant: "single",
            children: Stack({
              style: { padding: 5 },
              children: [
                Text({ children: "Content inside" }),
                Text({ children: "a single border" }),
              ],
            }),
          }),

          Text({ children: "Double border:" }),
          Border({
            variant: "double",
            children: Stack({
              style: { padding: 5 },
              children: [
                Text({ children: "Content inside" }),
                Text({ children: "a double border" }),
              ],
            }),
          }),

          Text({ children: "Rounded border:" }),
          Border({
            variant: "rounded",
            children: Stack({
              style: { padding: 5 },
              children: [
                Text({ children: "Content inside" }),
                Text({ children: "a rounded border" }),
              ],
            }),
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Box - Container with padding
      Text({ style: { bold: true }, children: "Box Component:" }),
      Stack({
        style: { padding: 10, gap: 15 },
        children: [
          Text({ children: "Simple box (padding only):" }),
          Box({
            padding: 15,
            children: Text({ children: "Padded content" }),
          }),

          Text({ children: "Box with border:" }),
          Box({
            border: true,
            padding: 10,
            children: Stack({
              children: [
                Text({ children: "Bordered box" }),
                Text({ children: "with padding" }),
              ],
            }),
          }),

          Text({ children: "Box with double border:" }),
          Box({
            border: true,
            borderVariant: "double",
            padding: 10,
            children: Text({ children: "Double bordered box" }),
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Panel - Titled container
      Text({ style: { bold: true }, children: "Panel Component:" }),
      Stack({
        style: { padding: 10, gap: 15 },
        children: [
          Panel({
            title: "Simple Panel",
            children: Stack({
              children: [
                Text({ children: "Panel content goes here." }),
                Text({ children: "Multiple lines supported." }),
              ],
            }),
          }),

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

          Panel({
            title: "Warning",
            headerActions: Badge({ variant: "warning", children: "ALERT" }),
            children: Text({
              children: "Low stock on several items. Please review inventory.",
            }),
          }),
        ],
      }),

      Line({ char: "-", length: "fill" }),

      // Section - Semantic grouping
      Text({ style: { bold: true }, children: "Section Component:" }),
      Stack({
        style: { padding: 10 },
        children: [
          Section({
            title: "Introduction",
            level: 2,
            children: Stack({
              children: [
                Text({
                  children:
                    "Sections provide semantic grouping with automatic heading and margins.",
                }),
              ],
            }),
          }),

          Section({
            title: "Features",
            level: 3,
            children: Stack({
              style: { gap: 3 },
              children: [
                Text({ children: "- Automatic margins" }),
                Text({ children: "- Configurable heading level" }),
                Text({ children: "- Clean visual hierarchy" }),
              ],
            }),
          }),

          Section({
            title: "Conclusion",
            level: 3,
            children: Text({
              children: "Sections help organize your document content.",
            }),
          }),
        ],
      }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, "Decorative Components", "components-06-decorative");
}

main().catch(console.error);
