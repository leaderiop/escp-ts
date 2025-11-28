/**
 * QA Example 51: Grid Layout Edge Cases
 *
 * This example stress-tests grid layouts to expose alignment,
 * column width calculation, and spacing bugs.
 *
 * Test Cases:
 * - Zero column gap
 * - Very small column widths
 * - Long text truncation in cells
 * - Mixed column width specs (fixed, auto, fill, %)
 * - Cell alignment edge cases
 * - Many columns
 * - Single row/column grids
 *
 * Run: npx tsx examples/qa-51-grid-edge-cases.ts
 */

import { LayoutEngine, stack, flex, grid } from "../src/index";
import { renderPreview, DEFAULT_PAPER, printSection } from "./_helpers";

async function main() {
  printSection("QA: Grid Edge Cases");

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(15)
    .padding(30)

    // Title
    .text("GRID EDGE CASES STRESS TEST", { bold: true, doubleWidth: true, align: "center" })
    .line("=", "fill")
    .spacer(10)

    // TEST 1: Zero column gap
    .text("TEST 1: Zero column gap (columns should touch)", { bold: true, underline: true })
    .add(
      grid([100, 100, 100])
        .columnGap(0)
        .rowGap(0)
        .cell("ColA")
        .cell("ColB")
        .cell("ColC")
        .row()
        .cell("Data1")
        .cell("Data2")
        .cell("Data3")
        .row()
    )
    .spacer(10)

    // TEST 2: Very small column widths
    .text("TEST 2: Small column widths (50px each)", { bold: true, underline: true })
    .add(
      grid([50, 50, 50, 50, 50])
        .columnGap(5)
        .cell("A")
        .cell("B")
        .cell("C")
        .cell("D")
        .cell("E")
        .row()
        .cell("1")
        .cell("2")
        .cell("3")
        .cell("4")
        .cell("5")
        .row()
    )
    .spacer(10)

    // TEST 3: Long text truncation
    .text("TEST 3: Long text in narrow columns (should truncate)", { bold: true, underline: true })
    .add(
      grid([80, 80, 80])
        .columnGap(10)
        .cellOverflow("ellipsis")
        .cell("VeryLongTextHere")
        .cell("AnotherLongText")
        .cell("ShortTxt")
        .row()
        .cell("This is way too long for the cell")
        .cell("Normal")
        .cell("OK")
        .row()
    )
    .spacer(10)

    // TEST 4: All alignment combinations
    .text("TEST 4: All cell alignment combinations", { bold: true, underline: true })
    .add(
      grid([150, 150, 150])
        .columnGap(10)
        .rowGap(5)
        .cell("Left", { align: "left", bold: true })
        .cell("Center", { align: "center", bold: true })
        .cell("Right", { align: "right", bold: true })
        .headerRow()
        .cell("LLLL", { align: "left" })
        .cell("CCCC", { align: "center" })
        .cell("RRRR", { align: "right" })
        .row()
        .cell("ShortL", { align: "left" })
        .cell("ShortC", { align: "center" })
        .cell("ShortR", { align: "right" })
        .row()
    )
    .spacer(10)

    // TEST 5: Mixed width specifications
    .text("TEST 5: Mixed width specs (100px, auto, 30%, fill)", { bold: true, underline: true })
    .add(
      grid([100, "auto", "30%", "fill"])
        .columnGap(10)
        .cell("100px", { bold: true })
        .cell("auto", { bold: true })
        .cell("30%", { bold: true })
        .cell("fill", { bold: true })
        .headerRow()
        .cell("Fixed")
        .cell("Size")
        .cell("Percent")
        .cell("Remaining")
        .row()
    )
    .spacer(10)

    // TEST 6: Single column grid
    .text("TEST 6: Single column grid", { bold: true, underline: true })
    .add(
      grid([300])
        .rowGap(5)
        .cell("Row 1 in single column")
        .row()
        .cell("Row 2 in single column")
        .row()
        .cell("Row 3 in single column")
        .row()
    )
    .spacer(10)

    // TEST 7: Many columns (8 columns)
    .text("TEST 7: Many columns (8 columns)", { bold: true, underline: true })
    .add(
      grid([50, 50, 50, 50, 50, 50, 50, 50])
        .columnGap(5)
        .cell("1")
        .cell("2")
        .cell("3")
        .cell("4")
        .cell("5")
        .cell("6")
        .cell("7")
        .cell("8")
        .row()
        .cell("A")
        .cell("B")
        .cell("C")
        .cell("D")
        .cell("E")
        .cell("F")
        .cell("G")
        .cell("H")
        .row()
    )
    .spacer(10)

    // TEST 8: Grid with percentage columns
    .text("TEST 8: Percentage columns (20%, 30%, 50%)", { bold: true, underline: true })
    .add(
      grid(["20%", "30%", "50%"])
        .columnGap(10)
        .cell("20%")
        .cell("30%")
        .cell("50%")
        .row()
        .cell("Small")
        .cell("Medium")
        .cell("Large column with more content")
        .row()
    )
    .spacer(10)

    // TEST 9: Nested stack inside grid cell
    .text("TEST 9: Nested content in grid cells", { bold: true, underline: true })
    .add(
      grid([200, 200])
        .columnGap(20)
        .rowGap(10)
        .cell(
          stack()
            .text("Multi-line")
            .text("cell content")
            .text("in stack")
        )
        .cell(
          flex()
            .gap(5)
            .text("A")
            .text("B")
            .text("C")
        )
        .row()
        .cell("Simple text")
        .cell("Simple text")
        .row()
    )
    .spacer(10)

    // TEST 10: Empty cells
    .text("TEST 10: Grid with empty cells", { bold: true, underline: true })
    .add(
      grid([100, 100, 100])
        .columnGap(10)
        .cell("A1")
        .cell("")
        .cell("C1")
        .row()
        .cell("")
        .cell("B2")
        .cell("")
        .row()
    )
    .spacer(10)

    // Footer
    .line("-", "fill")
    .text("End of Grid Edge Cases Test", { align: "center", italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, "QA: Grid Edge Cases", "qa-51-grid-edge-cases");
}

main().catch(console.error);
