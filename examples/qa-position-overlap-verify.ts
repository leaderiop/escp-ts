/**
 * QA Test: Position Overlap Verification
 *
 * Specifically tests overlapping element behavior and
 * verifies the Y-coordinate accuracy for absolute positioning.
 *
 * Run: npx tsx examples/qa-position-overlap-verify.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Position Overlap Verification');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('POSITION OVERLAP VERIFICATION', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // ============================================================
    // TEST A: Simple Y accuracy test
    // ============================================================
    .text('TEST A: Y-Position Accuracy', { bold: true, underline: true })
    .text('Each label should appear at its exact Y coordinate:')
    .add(
      stack()
        .height(300)
        .add(stack().absolutePosition(100, 300).text('[Y=300]'))
        .add(stack().absolutePosition(100, 350).text('[Y=350]'))
        .add(stack().absolutePosition(100, 400).text('[Y=400]'))
        .add(stack().absolutePosition(100, 450).text('[Y=450]'))
        .add(stack().absolutePosition(100, 500).text('[Y=500]'))
        // Add reference markers at X=400
        .add(stack().absolutePosition(400, 300).text('---- 300'))
        .add(stack().absolutePosition(400, 350).text('---- 350'))
        .add(stack().absolutePosition(400, 400).text('---- 400'))
        .add(stack().absolutePosition(400, 450).text('---- 450'))
        .add(stack().absolutePosition(400, 500).text('---- 500'))
    )
    .spacer(250)

    // ============================================================
    // TEST B: X accuracy test
    // ============================================================
    .text('TEST B: X-Position Accuracy', { bold: true, underline: true })
    .text('Each label should appear at its exact X coordinate:')
    .add(
      stack()
        .height(80)
        .add(stack().absolutePosition(100, 700).text('[X=100]'))
        .add(stack().absolutePosition(300, 700).text('[X=300]'))
        .add(stack().absolutePosition(500, 700).text('[X=500]'))
        .add(stack().absolutePosition(700, 700).text('[X=700]'))
        .add(stack().absolutePosition(900, 700).text('[X=900]'))
        .add(stack().absolutePosition(1100, 700).text('[X=1100]'))
    )
    .spacer(20)

    // ============================================================
    // TEST C: Overlapping text verification
    // ============================================================
    .text('TEST C: Exact Overlap - Only Top Layer Visible', { bold: true, underline: true })
    .text('You should ONLY see "TOP" - if you see A, B, or M there is a bug:')
    .add(
      stack()
        .height(100)
        .add(stack().absolutePosition(200, 900).text('AAAAAAAAAAAAAAAAAAAA'))
        .add(stack().absolutePosition(200, 900).text('BBBBBBBBBBBBBBBBBBBB'))
        .add(stack().absolutePosition(200, 900).text('MMMMMMMMMMMMMMMMMMMM'))
        .add(stack().absolutePosition(200, 900).text('TOP LAYER ONLY VISIB'))
    )
    .spacer(50)

    // ============================================================
    // TEST D: Diagonal placement verification
    // ============================================================
    .text('TEST D: Diagonal Pattern (50px X/Y increments)', { bold: true, underline: true })
    .add(
      stack()
        .height(200)
        .add(stack().absolutePosition(100, 1050).text('[0]'))
        .add(stack().absolutePosition(150, 1100).text('[1]'))
        .add(stack().absolutePosition(200, 1150).text('[2]'))
        .add(stack().absolutePosition(250, 1200).text('[3]'))
        .add(stack().absolutePosition(300, 1250).text('[4]'))
    )
    .spacer(200)

    // ============================================================
    // TEST E: Absolute with different container positions
    // ============================================================
    .text('TEST E: Absolute Inside Offset Container', { bold: true, underline: true })
    .text('Container at margin-left:200, child absolute at 300,1500')
    .text('Question: Is 300 relative to container or page?')
    .add(
      stack()
        .margin({ left: 200 })
        .height(80)
        .text('[Container starts here at margin-left:200]')
        .add(
          stack()
            .absolutePosition(300, 1500)
            .text('[Absolute 300,1500]')
        )
    )
    .spacer(50)

    // ============================================================
    // TEST F: Flow continuity after absolute
    // ============================================================
    .text('TEST F: Flow Continuity After Absolute', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .text('[1] Normal flow item')
        .text('[2] Normal flow item')
        .add(
          stack()
            .absolutePosition(800, 1650)
            .text('[ABSOLUTE at 800,1650]')
        )
        .text('[3] Should be directly after [2], not affected by absolute')
        .text('[4] Normal flow continues')
        .text('[5] Normal flow continues')
    )
    .spacer(20)

    // ============================================================
    // TEST G: Near-zero positioning
    // ============================================================
    .text('TEST G: Near-Zero and Zero Positioning', { bold: true, underline: true })
    .add(
      stack()
        .height(100)
        .add(stack().absolutePosition(0, 1850).text('[0,1850] - At X=0'))
        .add(stack().absolutePosition(5, 1870).text('[5,1870] - At X=5'))
        .add(stack().absolutePosition(1, 1890).text('[1,1890] - At X=1'))
    )
    .spacer(50)

    // Footer
    .line('-', 'fill')
    .text('End of Position Overlap Verification', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Position Overlap Verification', 'qa-position-overlap-verify');
}

main().catch(console.error);
