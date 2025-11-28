/**
 * Example 13: Margins
 *
 * Demonstrates margin support for layout nodes:
 * - Uniform margins (single number)
 * - Per-side margins (object with top/right/bottom/left)
 * - Margins on different node types (stack, flex, grid, text)
 * - Difference between padding and margin
 *
 * Run: npx tsx examples/13-margins.ts
 */

import { LayoutEngine, stack, flex, grid } from "../src/index";
import { renderPreview, DEFAULT_PAPER, printSection } from "./_helpers";

async function main() {
  printSection("Margins Demo");

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text("MARGINS DEMO", { bold: true, doubleWidth: true, align: "center" })
    .line("=", "fill")
    .spacer(20)

    // Explanation
    .text("Margins add space OUTSIDE a node (between siblings).", {
      italic: true,
    })
    .text("Padding adds space INSIDE a node (between border and content).", {
      italic: true,
    })
    .spacer(20)

    // Uniform margin example
    .text("UNIFORM MARGINS", { bold: true, underline: true })
    .spacer(10)
    .text("Items with margin(20) - note extra spacing between them:")
    .spacer(10)
    .add(
      stack()
        .gap(0) // No gap - spacing comes from margins
        .add(stack().margin(20).padding(10).text("Item 1 with 20px margin"))
        .add(stack().margin(20).padding(10).text("Item 2 with 20px margin"))
        .add(stack().margin(20).padding(10).text("Item 3 with 20px margin"))
    )
    .spacer(30)

    // Per-side margin example
    .text("PER-SIDE MARGINS", { bold: true, underline: true })
    .spacer(10)
    .text("Using margin({ top: 10, right: 50, bottom: 30, left: 100 }):")
    .spacer(10)
    .add(
      stack()
        .margin({ top: 10, right: 50, bottom: 30, left: 100 })
        .padding(10)
        .text("Content with asymmetric margins")
        .text("Left margin: 100, Right margin: 50")
        .text("Top margin: 10, Bottom margin: 30")
    )
    .spacer(30)

    // Margin vs Padding comparison
    .text("MARGIN VS PADDING COMPARISON", { bold: true, underline: true })
    .spacer(10)
    .add(
      flex()
        .gap(30)
        .add(
          stack()
            .width(300)
            .text("Padding (20):", { bold: true })
            .add(
              stack()
                .padding(20)
                .text("Content with padding")
                .text("Space is inside the box")
            )
        )
        .add(
          stack()
            .width(300)
            .text("Margin (20):", { bold: true })
            .add(
              stack()
                .margin(20)
                .text("Content with margin")
                .text("Space is outside the box")
            )
        )
    )
    .spacer(30)

    // Margins in flex layout
    .text("MARGINS IN FLEX LAYOUT", { bold: true, underline: true })
    .spacer(10)
    .text("Horizontal margins create space between flex items:")
    .spacer(10)
    .add(
      flex()
        .gap(0) // No gap - using margins instead
        .add(stack().margin({ left: 0, right: 30 }).text("Left item"))
        .add(stack().margin({ left: 30, right: 30 }).text("Center item"))
        .add(stack().margin({ left: 30, right: 0 }).text("Right item"))
    )
    .spacer(30)

    // Margins in grid
    .text("MARGINS IN GRID", { bold: true, underline: true })
    .spacer(10)
    .text("Grid with margin around the entire table:")
    .spacer(10)
    .add(
      grid([150, 150, 150])
        .margin({ top: 10, right: 20, bottom: 10, left: 20 })
        .columnGap(10)
        .rowGap(5)
        .cell("Header 1", { bold: true })
        .cell("Header 2", { bold: true })
        .cell("Header 3", { bold: true })
        .headerRow()
        .cell("A1")
        .cell("A2")
        .cell("A3")
        .row()
        .cell("B1")
        .cell("B2")
        .cell("B3")
        .row()
    )
    .spacer(30)

    // Combining margin and padding
    .text("COMBINING MARGIN AND PADDING", { bold: true, underline: true })
    .spacer(10)
    .text("Both can be used together for fine control:")
    .spacer(10)
    .add(
      stack()
        .margin(30) // Outer spacing
        .padding(20) // Inner spacing
        .text("This node has both margin(30) and padding(20)")
        .text("Total offset from siblings: 30 + 20 = 50 dots")
    )
    .spacer(30)

    // Footer
    .line("-", "fill")
    .text("End of Margins Demo", { align: "center", italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, "Margins Demo", "13-margins");
}

main().catch(console.error);
