/**
 * QA Example 53: Positioning Edge Cases
 *
 * This example stress-tests absolute and relative positioning
 * to expose bugs in position calculation.
 *
 * Test Cases:
 * - Absolute positioning at (0,0)
 * - Overlapping absolute elements
 * - Relative positioning with negative offsets
 * - Absolute inside nested containers
 * - Flow not affected by absolute elements
 * - Large position values
 *
 * Run: npx tsx examples/qa-53-positioning-edge-cases.ts
 */

import { LayoutEngine, stack, flex, grid, text } from "../src/index";
import { renderPreview, DEFAULT_PAPER, printSection } from "./_helpers";

async function main() {
  printSection("QA: Positioning Edge Cases");

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(10)
    .padding(30)

    // Title
    .text("POSITIONING EDGE CASES TEST", { bold: true, doubleWidth: true, align: "center" })
    .line("=", "fill")
    .spacer(10)

    // TEST 1: Absolute at origin
    .text("TEST 1: Absolute positioning at (0,0)", { bold: true, underline: true })
    .add(
      stack()
        .text("Normal flow item 1")
        .add(
          stack()
            .absolutePosition(0, 0)
            .text("[ABS 0,0]")
        )
        .text("Normal flow item 2 (should follow item 1)")
    )
    .spacer(20)

    // TEST 2: Multiple absolute elements
    .text("TEST 2: Multiple absolute at same Y", { bold: true, underline: true })
    .add(
      stack()
        .text("Normal content here")
        .add(
          stack()
            .absolutePosition(50, 300)
            .text("[ABS 50,300]")
        )
        .add(
          stack()
            .absolutePosition(400, 300)
            .text("[ABS 400,300]")
        )
        .add(
          stack()
            .absolutePosition(750, 300)
            .text("[ABS 750,300]")
        )
        .text("More normal content")
    )
    .spacer(20)

    // TEST 3: Relative positioning
    .text("TEST 3: Relative positioning offsets", { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .text("Normal: Line 1")
        .add(
          stack()
            .relativePosition(50, 0)
            .text("Relative offset X:50 Y:0")
        )
        .text("Normal: Line 3 (should be in normal flow)")
    )
    .spacer(10)

    // TEST 4: Negative relative offset
    .text("TEST 4: Negative relative offset", { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .text("Normal line before")
        .add(
          stack()
            .relativePosition(-30, -10)
            .text("Relative X:-30 Y:-10")
        )
        .text("Normal line after")
    )
    .spacer(20)

    // TEST 5: Absolute inside nested stack
    .text("TEST 5: Absolute inside nested container", { bold: true, underline: true })
    .add(
      stack()
        .padding(20)
        .text("Outer container start")
        .add(
          stack()
            .padding(15)
            .text("Inner container")
            .add(
              stack()
                .absolutePosition(100, 550)
                .text("[ABS from nested: 100,550]")
            )
            .text("Inner content after abs")
        )
        .text("Outer container end")
    )
    .spacer(20)

    // TEST 6: Flow integrity check
    .text("TEST 6: Flow not affected by absolute", { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .text("Line A")
        .text("Line B")
        .add(
          stack()
            .absolutePosition(600, 700)
            .text("[ABS Element]")
        )
        .text("Line C (should be after B)")
        .text("Line D")
        .text("Line E")
    )
    .spacer(10)

    // TEST 7: Relative in flex
    .text("TEST 7: Relative positioning in flex", { bold: true, underline: true })
    .add(
      flex()
        .gap(30)
        .text("Normal")
        .add(
          stack()
            .relativePosition(0, -15)
            .text("Rel Y:-15")
        )
        .text("Normal")
        .add(
          stack()
            .relativePosition(0, 15)
            .text("Rel Y:15")
        )
        .text("Normal")
    )
    .spacer(10)

    // TEST 8: Overlapping absolute elements
    .text("TEST 8: Overlapping absolutes (same position)", { bold: true, underline: true })
    .add(
      stack()
        .text("Check for overlap at (200, 850)")
        .add(
          stack()
            .absolutePosition(200, 850)
            .text("FIRST ABSOLUTE TEXT")
        )
        .add(
          stack()
            .absolutePosition(200, 850)
            .text("SECOND (OVERLAPS)")
        )
    )
    .spacer(100)

    // Footer
    .line("-", "fill")
    .text("End of Positioning Edge Cases Test", { align: "center", italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, "QA: Positioning", "qa-53-positioning-edge-cases");
}

main().catch(console.error);
