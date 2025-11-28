/**
 * Debug Test: Why is top margin not working?
 */
import { LayoutEngine, stack } from '../src/index';
import { measureNode, MeasureContext } from '../src/layout/measure';
import { performLayout } from '../src/layout/layout';
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

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('DEBUG: Top Margin Analysis');
  console.log('='.repeat(70));

  // Create node with top margin
  const node = stack()
    .margin({ top: 100 })
    .text('TopMargin')
    .build();

  console.log('\n1. Node Definition:');
  console.log(JSON.stringify(node, null, 2));

  // Create measure context
  const measureCtx: MeasureContext = {
    availableWidth: 8.5 * 360,
    availableHeight: 11 * 360,
    lineSpacing: 60,
    interCharSpace: 0,
    style: {
      bold: false,
      italic: false,
      underline: false,
      doubleStrike: false,
      doubleWidth: false,
      doubleHeight: false,
      condensed: false,
      cpi: 10,
    },
  };

  // Phase 1: Measure
  const measured = measureNode(node, measureCtx, measureCtx.style);
  console.log('\n2. Measured Node:');
  console.log('   preferredHeight:', measured.preferredHeight);
  console.log('   margin:', measured.margin);
  console.log('   padding:', measured.padding);

  // Phase 2: Layout
  const startX = 0;
  const startY = 0;
  const layoutResult = performLayout(
    measured,
    startX,
    startY,
    measureCtx.availableWidth,
    measureCtx.availableHeight
  );

  console.log('\n3. Layout Result:');
  console.log('   Root x:', layoutResult.x);
  console.log('   Root y:', layoutResult.y);
  console.log('   Root height:', layoutResult.height);
  if (layoutResult.children.length > 0) {
    console.log('   Child[0] x:', layoutResult.children[0]?.x);
    console.log('   Child[0] y:', layoutResult.children[0]?.y);
  }

  // Check flatten tree
  const { flattenTree, sortRenderItems } = await import('../src/layout/renderer');
  const flattened = flattenTree(layoutResult);
  console.log('\n3b. Flattened Render Items:');
  for (const item of flattened) {
    console.log(`   type: ${item.type}, x: ${item.x}, y: ${item.y}`);
  }

  const sorted = sortRenderItems(flattened);
  console.log('\n3c. Sorted Render Items:');
  for (const item of sorted) {
    console.log(`   type: ${item.type}, x: ${item.x}, y: ${item.y}`);
  }

  // Check pagination
  const { paginateLayout, createPageConfig } = await import('../src/layout/pagination');
  const pageConfig = createPageConfig(
    11 * 360, // page height
    0, // top margin
    0  // bottom margin
  );
  const paginated = paginateLayout(layoutResult, pageConfig);
  console.log('\n3d. Pagination Result:');
  console.log('   Number of pages:', paginated.pages.length);
  for (let i = 0; i < paginated.pages.length; i++) {
    const page = paginated.pages[i];
    console.log(`   Page ${i}: startY=${page?.startY}, items=${page?.items.length}`);
    if (page?.items) {
      for (const item of page.items) {
        console.log(`     item.y: ${item.y}, item.height: ${item.height}`);
        if (item.children) {
          for (const child of item.children) {
            console.log(`       child.y: ${child.y}`);
          }
        }
      }
    }
  }

  // Check what renderPageItems does
  const { renderPageItems } = await import('../src/layout/renderer');
  if (paginated.pages[0]) {
    console.log('\n3e. renderPageItems with page items:');
    const renderResult = renderPageItems(paginated.pages[0].items, {
      startX: 0,
      startY: 0,
    });
    console.log('   Output length:', renderResult.commands.length);
    console.log('   Final Y:', renderResult.finalY);

    // Analyze the commands
    const commands = renderResult.commands;
    let idx = 0;
    while (idx < commands.length) {
      const b = commands[idx];
      if (b === 0x1B) {
        const next = commands[idx + 1];
        if (next === 0x4A) {
          const n = commands[idx + 2];
          console.log(`   ESC J ${n} -> Y advance ${n! * 2}`);
          idx += 3;
        } else if (next === 0x24) {
          const nL = commands[idx + 2] ?? 0;
          const nH = commands[idx + 3] ?? 0;
          console.log(`   ESC $ ${nL} ${nH} -> X = ${(nL + nH * 256) * 6}`);
          idx += 4;
        } else {
          idx += 2;
        }
      } else if (b !== undefined && b >= 0x20 && b < 0x7F) {
        let text = '';
        while (idx < commands.length && commands[idx] !== undefined && commands[idx]! >= 0x20 && commands[idx]! < 0x7F) {
          text += String.fromCharCode(commands[idx]!);
          idx++;
        }
        console.log(`   TEXT: "${text}"`);
      } else {
        idx++;
      }
    }
  }

  // Now render through LayoutEngine
  console.log('\n4. Full Pipeline through LayoutEngine:');
  const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine.initialize();
  await engine.initYoga();
  engine.render(node);

  const prn = engine.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-debug-margin.prn'), prn);

  // Analyze PRN
  console.log('\n5. PRN Analysis:');
  let i = 0;
  while (i < prn.length) {
    const b = prn[i];
    if (b === 0x1B) {
      const next = prn[i + 1];
      if (next === 0x40) {
        console.log(`   [${i}] ESC @ - Initialize`);
        i += 2;
      } else if (next === 0x4A) {
        const n = prn[i + 2];
        console.log(`   [${i}] ESC J ${n} - Advance Y by ${n! * 2} dots`);
        i += 3;
      } else if (next === 0x24) {
        const nL = prn[i + 2] ?? 0;
        const nH = prn[i + 3] ?? 0;
        console.log(`   [${i}] ESC $ ${nL} ${nH} - X = ${(nL + nH * 256) * 6} dots`);
        i += 4;
      } else {
        console.log(`   [${i}] ESC ${next?.toString(16)}`);
        i += 2;
      }
    } else if (b !== undefined && b >= 0x20 && b < 0x7F) {
      let text = '';
      while (i < prn.length && prn[i] !== undefined && prn[i]! >= 0x20 && prn[i]! < 0x7F) {
        text += String.fromCharCode(prn[i]!);
        i++;
      }
      console.log(`   [${i - text.length}] TEXT: "${text}"`);
    } else {
      i++;
    }
  }

  console.log('\n6. Conclusion:');
  console.log('   Expected: ESC J command to advance Y by 100 dots before text');
  console.log('   If no ESC J before text, margin is not being rendered');
}

main().catch(console.error);
