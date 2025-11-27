/**
 * QA Test: Precise Positioning Analysis
 * Generates minimal PRN output for ESC/P command verification
 */
import { LayoutEngine, stack, flex, grid } from '../src/index';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function analyzeCommands(data: Uint8Array, label: string): void {
  console.log(`\n=== ${label} ===`);
  console.log('Bytes:', data.length);

  const hexParts: string[] = [];
  for (let j = 0; j < Math.min(data.length, 100); j++) {
    hexParts.push((data[j] ?? 0).toString(16).padStart(2, '0'));
  }
  console.log('Hex (first 100):', hexParts.join(' '));
  console.log();

  // Analyze ESC $ and ESC J commands
  let i = 0;
  while (i < data.length) {
    const byte1 = data[i];
    const byte2 = data[i + 1];

    if (byte1 === 0x1B && byte2 === 0x24) {
      const nL = data[i + 2] ?? 0;
      const nH = data[i + 3] ?? 0;
      const pos60th = nL + nH * 256;
      const dotPos = pos60th * 6; // Convert to 360 DPI dots
      console.log(`  ESC $ (0x1B 0x24) at byte ${i}: nL=0x${nL.toString(16).padStart(2, '0')} nH=0x${nH.toString(16).padStart(2, '0')} = ${pos60th} (1/60") = ${dotPos} dots at 360 DPI`);
      i += 4;
    } else if (byte1 === 0x1B && byte2 === 0x4A) {
      const n = data[i + 2] ?? 0;
      const dotAdvance = Math.round((n / 180) * 360);
      console.log(`  ESC J (0x1B 0x4A) at byte ${i}: n=${n} (n/180") = ${dotAdvance} dots vertical advance`);
      i += 3;
    } else {
      i++;
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('  QA POSITIONING ANALYSIS - ESC/P Command Verification');
  console.log('='.repeat(70));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Test 1: Basic horizontal positioning - Flex with zero gap
  console.log('\n### Test 1: Flex Layout with gap=0 ###');
  const engine1 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });

  engine1.initialize();
  const layout1 = stack()
    .add(
      flex()
        .gap(0)
        .add(stack().text('A'))
        .add(stack().text('B'))
        .add(stack().text('C'))
    )
    .build();

  engine1.render(layout1);
  const out1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-positioning-minimal.prn'), out1);
  analyzeCommands(out1, 'Flex gap=0');

  // Test 2: Grid with Zero Gap
  console.log('\n### Test 2: Grid with columnGap=0 ###');
  const engine2 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });

  engine2.initialize();
  const layout2 = grid([100, 100, 100])
    .columnGap(0)
    .cell('X1')
    .cell('X2')
    .cell('X3')
    .row()
    .build();

  engine2.render(layout2);
  const out2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-grid-zero-gap-minimal.prn'), out2);
  analyzeCommands(out2, 'Grid columnGap=0, columns=[100,100,100]');

  // Test 3: Grid with 10 dot Gap
  console.log('\n### Test 3: Grid with columnGap=10 ###');
  const engine3 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });

  engine3.initialize();
  const layout3 = grid([100, 100, 100])
    .columnGap(10)
    .cell('Y1')
    .cell('Y2')
    .cell('Y3')
    .row()
    .build();

  engine3.render(layout3);
  const out3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-grid-gap10-minimal.prn'), out3);
  analyzeCommands(out3, 'Grid columnGap=10, columns=[100,100,100]');

  // Test 4: Grid with 60 dot columns (should be exactly 1/60" per column = 1 unit in ESC $)
  console.log('\n### Test 4: Grid with 36-dot columns (exactly 1 char at 10 CPI) ###');
  const engine4 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });

  engine4.initialize();
  const layout4 = grid([36, 36, 36])
    .columnGap(0)
    .cell('A')
    .cell('B')
    .cell('C')
    .row()
    .build();

  engine4.render(layout4);
  const out4 = engine4.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-grid-36dot-minimal.prn'), out4);
  analyzeCommands(out4, 'Grid columnGap=0, columns=[36,36,36] (1 char width each)');

  // Verification Analysis
  console.log('\n' + '='.repeat(70));
  console.log('  EXPECTED VALUES');
  console.log('='.repeat(70));
  console.log('\nGrid [100, 100, 100] with columnGap=0 should position at:');
  console.log('  Col 1: X=0 dots -> ESC $ nL=0x00 nH=0x00 (0 * 1/60")');
  console.log('  Col 2: X=100 dots -> 100/6 = 16.67 -> ESC $ nL=0x11 nH=0x00 (17 * 1/60" = 102 dots)');
  console.log('  Col 3: X=200 dots -> 200/6 = 33.33 -> ESC $ nL=0x21 nH=0x00 (33 * 1/60" = 198 dots)');

  console.log('\nGrid [100, 100, 100] with columnGap=10 should position at:');
  console.log('  Col 1: X=0 dots');
  console.log('  Col 2: X=110 dots -> 110/6 = 18.33 -> ESC $ nL=0x12 nH=0x00 (18 * 1/60" = 108 dots)');
  console.log('  Col 3: X=220 dots -> 220/6 = 36.67 -> ESC $ nL=0x25 nH=0x00 (37 * 1/60" = 222 dots)');

  console.log('\nGrid [36, 36, 36] with columnGap=0 should position at:');
  console.log('  Col 1: X=0 dots');
  console.log('  Col 2: X=36 dots -> 36/6 = 6 -> ESC $ nL=0x06 nH=0x00 (6 * 1/60" = 36 dots)');
  console.log('  Col 3: X=72 dots -> 72/6 = 12 -> ESC $ nL=0x0c nH=0x00 (12 * 1/60" = 72 dots)');
}

main().catch(console.error);
