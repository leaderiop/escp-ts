/**
 * QA PRN Analysis: Margin and Padding Effects on Positioning
 *
 * This test analyzes how margins and padding translate to ESC/P
 * positioning commands.
 *
 * Key Concepts:
 * - Margins affect element position within parent
 * - Padding affects content position within element
 * - Auto margins should center elements
 */
import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview } from './_helpers';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const ZERO_MARGIN_PAPER = {
  widthInches: 8.5,
  heightInches: 11,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  linesPerPage: 66,
};

interface PosCmd {
  type: string;
  offset: number;
  hex: string;
  dots?: number;
  text?: string;
}

function parseMarginPrn(data: Uint8Array): PosCmd[] {
  const cmds: PosCmd[] = [];
  let i = 0;

  while (i < data.length) {
    const b = data[i];

    if (b === 0x1B) {
      const next = data[i + 1];

      if (next === 0x24) { // ESC $
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        cmds.push({
          type: 'ESC_$',
          offset: i,
          hex: `1B 24 ${nL.toString(16).padStart(2, '0')} ${nH.toString(16).padStart(2, '0')}`,
          dots: (nL + nH * 256) * 6,
        });
        i += 4;
      } else if (next === 0x4A) { // ESC J
        const n = data[i + 2] ?? 0;
        cmds.push({
          type: 'ESC_J',
          offset: i,
          hex: `1B 4A ${n.toString(16).padStart(2, '0')}`,
          dots: n * 2,
        });
        i += 3;
      } else if (next === 0x40) {
        cmds.push({ type: 'ESC_@', offset: i, hex: '1B 40' });
        i += 2;
      } else {
        i += 2;
      }
    } else if (b !== undefined && b >= 0x20 && b < 0x7F) {
      let text = '';
      const start = i;
      while (i < data.length && data[i] !== undefined && data[i]! >= 0x20 && data[i]! < 0x7F) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      cmds.push({ type: 'TEXT', offset: start, hex: '', text });
    } else {
      i++;
    }
  }

  return cmds;
}

function analyzeMarginEffect(label: string, data: Uint8Array, expectedFirstTextX: number, expectedFirstTextY: number): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(70));
  console.log(`Expected first text at: (${expectedFirstTextX}, ${expectedFirstTextY})`);

  const cmds = parseMarginPrn(data);

  let x = 0;
  let y = 0;

  console.log('\nCommand Sequence:');
  console.log('-'.repeat(70));

  for (const cmd of cmds) {
    switch (cmd.type) {
      case 'ESC_@':
        console.log(`  [${cmd.offset.toString().padStart(4)}] RESET`);
        x = 0; y = 0;
        break;
      case 'ESC_$':
        console.log(`  [${cmd.offset.toString().padStart(4)}] ESC $ -> X = ${cmd.dots}`);
        x = cmd.dots ?? 0;
        break;
      case 'ESC_J':
        console.log(`  [${cmd.offset.toString().padStart(4)}] ESC J -> Y += ${cmd.dots}`);
        y += cmd.dots ?? 0;
        break;
      case 'TEXT':
        console.log(`  [${cmd.offset.toString().padStart(4)}] TEXT  : "${cmd.text}" at (${x}, ${y})`);
        // Record first text position
        const xMatch = x === expectedFirstTextX;
        const yMatch = y === expectedFirstTextY;
        if (cmds.filter(c => c.type === 'TEXT').indexOf(cmd) === 0) {
          console.log(`         [First text: X ${xMatch ? 'PASS' : `FAIL (expected ${expectedFirstTextX})`}, Y ${yMatch ? 'PASS' : `FAIL (expected ${expectedFirstTextY})`}]`);
        }
        x += (cmd.text?.length ?? 0) * 36;
        break;
    }
  }

  console.log('-'.repeat(70));
}

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('  QA PRN ANALYSIS: MARGIN AND PADDING');
  console.log('='.repeat(70));
  console.log('\nThis test verifies margin and padding translate correctly to positioning.\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ========================================
  // Test 1: No margin, no padding
  // ========================================
  console.log('\n### TEST 1: No margin, no padding ###');
  console.log('Expected: Text at (0, 0)');

  const engine1 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine1.initialize();
  engine1.render(stack().text('NoMargin').build());

  const prn1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-01-none.prn'), prn1);
  analyzeMarginEffect('Test 1: No margin/padding', prn1, 0, 0);
  await renderPreview(prn1, 'Test 1: No margin', 'qa-prn-margin-01-none', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 2: Left margin
  // ========================================
  console.log('\n### TEST 2: Left margin = 50 dots ###');
  console.log('Expected: Text at (50, 0)');

  const engine2 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine2.initialize();
  engine2.render(
    stack()
      .margin({ left: 50 })
      .text('LeftMargin')
      .build()
  );

  const prn2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-02-left.prn'), prn2);
  analyzeMarginEffect('Test 2: Left margin=50', prn2, 50, 0);
  await renderPreview(prn2, 'Test 2: Left margin', 'qa-prn-margin-02-left', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 3: Top margin
  // ========================================
  console.log('\n### TEST 3: Top margin = 100 dots ###');
  console.log('Expected: Text at (0, 100)');

  const engine3 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine3.initialize();
  engine3.render(
    stack()
      .margin({ top: 100 })
      .text('TopMargin')
      .build()
  );

  const prn3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-03-top.prn'), prn3);
  analyzeMarginEffect('Test 3: Top margin=100', prn3, 0, 100);
  await renderPreview(prn3, 'Test 3: Top margin', 'qa-prn-margin-03-top', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 4: Padding
  // ========================================
  console.log('\n### TEST 4: Padding = 30 dots (all sides) ###');
  console.log('Container at (0,0), content inside with 30 dot offset');
  console.log('Expected: Text at (30, 30)');

  const engine4 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine4.initialize();
  engine4.render(
    stack()
      .padding(30)
      .text('Padded')
      .build()
  );

  const prn4 = engine4.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-04-padding.prn'), prn4);
  analyzeMarginEffect('Test 4: Padding=30', prn4, 30, 30);
  await renderPreview(prn4, 'Test 4: Padding', 'qa-prn-margin-04-padding', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 5: Margin + Padding combined
  // ========================================
  console.log('\n### TEST 5: Margin=20 + Padding=30 ###');
  console.log('Expected: Text at (20+30=50, 20+30=50)');

  const engine5 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine5.initialize();
  engine5.render(
    stack()
      .margin(20)
      .padding(30)
      .text('Both')
      .build()
  );

  const prn5 = engine5.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-05-both.prn'), prn5);
  analyzeMarginEffect('Test 5: Margin=20, Padding=30', prn5, 50, 50);
  await renderPreview(prn5, 'Test 5: Both', 'qa-prn-margin-05-both', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 6: Auto margins (centering)
  // ========================================
  console.log('\n### TEST 6: Auto horizontal margins (centering) ###');
  console.log('Page width = 3060 dots, text "Center" = 6 chars * 36 = 216 dots');
  console.log('Expected X = (3060 - 216) / 2 = 1422 dots');

  const engine6 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine6.initialize();
  engine6.render(
    stack()
      .margin('auto')
      .text('Center')
      .build()
  );

  const prn6 = engine6.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-06-auto.prn'), prn6);
  analyzeMarginEffect('Test 6: Auto margins (center)', prn6, 1422, 0);
  await renderPreview(prn6, 'Test 6: Auto margin', 'qa-prn-margin-06-auto', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 7: Nested margins accumulate
  // ========================================
  console.log('\n### TEST 7: Nested margins ###');
  console.log('Outer margin=50, inner margin=30');
  console.log('Expected: Text at (50+30=80, 50+30=80)');

  const engine7 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine7.initialize();
  engine7.render(
    stack()
      .margin(50)
      .add(
        stack()
          .margin(30)
          .text('Nested')
      )
      .build()
  );

  const prn7 = engine7.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-07-nested.prn'), prn7);
  analyzeMarginEffect('Test 7: Nested margins', prn7, 80, 80);
  await renderPreview(prn7, 'Test 7: Nested', 'qa-prn-margin-07-nested', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 8: Grid with cell padding
  // ========================================
  console.log('\n### TEST 8: Grid cell with padding ###');
  console.log('Grid column at X=0, cell padding=20');
  console.log('Expected: Text at (20, 20)');

  const engine8 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine8.initialize();
  engine8.render(
    grid([200, 200])
      .columnGap(0)
      .cell(stack().padding(20).text('Pad').build())
      .cell('NoPad')
      .row()
      .build()
  );

  const prn8 = engine8.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-08-grid-pad.prn'), prn8);
  analyzeMarginEffect('Test 8: Grid cell padding', prn8, 20, 20);
  await renderPreview(prn8, 'Test 8: Grid padding', 'qa-prn-margin-08-grid-pad', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 9: Paper margins affect starting position
  // ========================================
  console.log('\n### TEST 9: Paper margins ###');
  console.log('Paper left margin=100, top margin=50');
  console.log('Expected: Text at (100, 50)');

  const marginPaper = {
    widthInches: 8.5,
    heightInches: 11,
    margins: { top: 50, bottom: 0, left: 100, right: 0 },
    linesPerPage: 66,
  };

  const engine9 = new LayoutEngine({ defaultPaper: marginPaper });
  engine9.initialize();
  engine9.render(stack().text('PaperMargin').build());

  const prn9 = engine9.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-margin-09-paper.prn'), prn9);
  analyzeMarginEffect('Test 9: Paper margins', prn9, 100, 50);
  await renderPreview(prn9, 'Test 9: Paper margin', 'qa-prn-margin-09-paper', { paper: marginPaper });

  // ========================================
  // Summary
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('  VERIFICATION CHECKLIST');
  console.log('='.repeat(70));
  console.log(`
Margin Behavior:
  - left/top margins add to X/Y position
  - Margins on child elements accumulate with parent
  - Auto margins center element horizontally

Padding Behavior:
  - Padding creates internal space within element
  - Content is offset by padding amount
  - Padding + margin both affect final position

Paper Margins:
  - Paper margins set the starting print position
  - Content is rendered relative to paper margins

Critical Bugs to Check:
  [1] Margin values should add directly to position
  [2] Padding should offset content within element bounds
  [3] Auto margins should center correctly
  [4] Nested margins should accumulate
  [5] Paper margins should affect starting position
  [6] Rounding errors in ESC $ conversion
`);
}

main().catch(console.error);
