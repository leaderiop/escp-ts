/**
 * QA Example 54: Flex Wrap and Justify Stress Test
 *
 * This example stress-tests flex wrap and justify content
 * combinations to expose alignment and spacing bugs.
 *
 * Test Cases:
 * - All justify modes with single item
 * - All justify modes with wrapped lines
 * - Wrap with different item sizes
 * - rowGap with wrapping
 * - alignItems with wrapped content
 *
 * Run: npx tsx examples/qa-54-flex-wrap-justify.ts
 */

import { LayoutEngine, stack, flex } from "../src/index";
import { renderPreview, DEFAULT_PAPER, printSection } from "./_helpers";

async function main() {
  printSection("QA: Flex Wrap & Justify Stress Test");

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(12)
    .padding(30)

    // Title
    .text("FLEX WRAP & JUSTIFY STRESS TEST", { bold: true, doubleWidth: true, align: "center" })
    .line("=", "fill")
    .spacer(10)

    // TEST 1: All justify modes with single item
    .text("TEST 1: Justify modes with single item", { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .add(
          flex().justify("start").text("start - single")
        )
        .add(
          flex().justify("center").text("center - single")
        )
        .add(
          flex().justify("end").text("end - single")
        )
        .add(
          flex().justify("space-between").text("space-between - single")
        )
        .add(
          flex().justify("space-around").text("space-around - single")
        )
        .add(
          flex().justify("space-evenly").text("space-evenly - single")
        )
    )
    .spacer(10)

    // TEST 2: All justify modes with 3 items
    .text("TEST 2: Justify modes with 3 items", { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .add(
          flex().justify("start").gap(10).text("A").text("B").text("C")
        )
        .add(
          flex().justify("center").gap(10).text("A").text("B").text("C")
        )
        .add(
          flex().justify("end").gap(10).text("A").text("B").text("C")
        )
        .add(
          flex().justify("space-between").text("A").text("B").text("C")
        )
        .add(
          flex().justify("space-around").text("A").text("B").text("C")
        )
        .add(
          flex().justify("space-evenly").text("A").text("B").text("C")
        )
    )
    .spacer(10)

    // TEST 3: Wrap with uniform items
    .text("TEST 3: Wrap with uniform 150px items", { bold: true, underline: true })
    .add(
      flex()
        .wrap("wrap")
        .gap(10)
        .rowGap(10)
        .add(stack().width(150).text("Item 1"))
        .add(stack().width(150).text("Item 2"))
        .add(stack().width(150).text("Item 3"))
        .add(stack().width(150).text("Item 4"))
        .add(stack().width(150).text("Item 5"))
        .add(stack().width(150).text("Item 6"))
        .add(stack().width(150).text("Item 7"))
    )
    .spacer(10)

    // TEST 4: Wrap with varying sizes
    .text("TEST 4: Wrap with varying item widths", { bold: true, underline: true })
    .add(
      flex()
        .wrap("wrap")
        .gap(10)
        .rowGap(10)
        .add(stack().width(200).text("Wide 200"))
        .add(stack().width(100).text("100"))
        .add(stack().width(150).text("Medium 150"))
        .add(stack().width(80).text("80"))
        .add(stack().width(300).text("Very Wide 300"))
        .add(stack().width(120).text("120"))
    )
    .spacer(10)

    // TEST 5: Wrap with justify center
    .text("TEST 5: Wrap + justify center", { bold: true, underline: true })
    .add(
      flex()
        .wrap("wrap")
        .justify("center")
        .gap(10)
        .rowGap(10)
        .add(stack().width(150).text("Item 1"))
        .add(stack().width(150).text("Item 2"))
        .add(stack().width(150).text("Item 3"))
        .add(stack().width(150).text("Item 4"))
        .add(stack().width(150).text("Item 5"))
    )
    .spacer(10)

    // TEST 6: Wrap with space-between
    .text("TEST 6: Wrap + justify space-between", { bold: true, underline: true })
    .add(
      flex()
        .wrap("wrap")
        .justify("space-between")
        .rowGap(10)
        .add(stack().width(150).text("Item 1"))
        .add(stack().width(150).text("Item 2"))
        .add(stack().width(150).text("Item 3"))
        .add(stack().width(150).text("Item 4"))
        .add(stack().width(150).text("Item 5"))
    )
    .spacer(10)

    // TEST 7: Wrap with different heights
    .text("TEST 7: Wrap with varying heights + alignItems", { bold: true, underline: true })
    .add(
      flex()
        .wrap("wrap")
        .gap(10)
        .rowGap(15)
        .alignItems("center")
        .add(stack().width(150).text("Single"))
        .add(stack().width(150).text("Two").text("Lines"))
        .add(stack().width(150).text("One"))
        .add(stack().width(150).text("A").text("B").text("C"))
        .add(stack().width(150).text("Short"))
    )
    .spacer(10)

    // TEST 8: No wrap (overflow check)
    .text("TEST 8: No wrap (items should overflow)", { bold: true, underline: true })
    .add(
      flex()
        .gap(10)
        .add(stack().width(200).text("Item 1"))
        .add(stack().width(200).text("Item 2"))
        .add(stack().width(200).text("Item 3"))
        .add(stack().width(200).text("Item 4"))
        .add(stack().width(200).text("Item 5"))
        .add(stack().width(200).text("Item 6"))
    )
    .spacer(10)

    // TEST 9: Large rowGap
    .text("TEST 9: Wrap with large rowGap (50)", { bold: true, underline: true })
    .add(
      flex()
        .wrap("wrap")
        .gap(10)
        .rowGap(50)
        .add(stack().width(200).text("Row 1 - A"))
        .add(stack().width(200).text("Row 1 - B"))
        .add(stack().width(200).text("Row 1 - C"))
        .add(stack().width(200).text("Row 2 - A"))
        .add(stack().width(200).text("Row 2 - B"))
    )
    .spacer(10)

    // TEST 10: Flex spacers in wrap
    .text("TEST 10: Flex spacer behavior (no wrap)", { bold: true, underline: true })
    .add(
      flex()
        .gap(10)
        .text("Left")
        .spacer()
        .text("Right")
    )
    .add(
      flex()
        .gap(10)
        .text("A")
        .spacer()
        .text("B")
        .spacer()
        .text("C")
    )
    .spacer(10)

    // Footer
    .line("-", "fill")
    .text("End of Flex Wrap & Justify Test", { align: "center", italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, "QA: Flex Wrap", "qa-54-flex-wrap-justify");
}

main().catch(console.error);
