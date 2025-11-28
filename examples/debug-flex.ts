/**
 * Debug script to trace flex layout issue
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { measureNode, type MeasureContext } from '../src/layout/measure';
import { performLayout } from '../src/layout/layout';
import { paginateLayout, createPageConfig } from '../src/layout/pagination';
import { flattenTree, sortRenderItems } from '../src/layout/renderer';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Debug Flex Layout');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  engine.initialize();
  await engine.initYoga();

  // Simple flex with two stacks - should be side by side
  const layout = flex()
    .justify('space-between')
    .add(
      stack()
        .text('Left 1')
        .text('Left 2')
    )
    .add(
      stack()
        .text('Right 1')
        .text('Right 2')
    )
    .build();

  // Manually trace through the phases
  const DEFAULT_STYLE = {
    bold: false, italic: false, underline: false, doubleStrike: false,
    doubleWidth: false, doubleHeight: false, condensed: false, cpi: 10,
  };

  const ctx: MeasureContext = {
    availableWidth: 4896,  // Printable width
    availableHeight: 3000,
    lineSpacing: 60,
    interCharSpace: 0,
    style: DEFAULT_STYLE,
  };

  console.log('=== MEASURE ===');
  const measured = measureNode(layout, ctx, DEFAULT_STYLE);

  console.log('=== LAYOUT ===');
  const layoutResult = performLayout(measured, 225, 90, 4896, 3000);

  console.log('=== PAGINATION ===');
  const pageConfig = createPageConfig(3075, 90, 90);
  const paginated = paginateLayout(layoutResult, pageConfig);

  console.log('Page count:', paginated.pageCount);
  console.log('Page 0 items count:', paginated.pages[0]?.items.length);

  paginated.pages[0]?.items.forEach((item, i) => {
    console.log(`\nPage item [${i}]:`);
    console.log('  node type:', item.node.type);
    console.log('  x:', item.x, 'y:', item.y);
    console.log('  children:', item.children.length);

    // Flatten and show render items for this page item
    const renderItems = flattenTree(item);
    console.log('  flattened render items:', renderItems.length);
    renderItems.forEach((ri, j) => {
      const content = ri.data.type === 'text' ? ri.data.content : '(line)';
      console.log(`    [${j}] x=${ri.x}, y=${ri.y}: "${content}"`);
    });
  });

  console.log('\n=== NOW RENDER WITH ENGINE ===');
  engine.render(layout);

  const commands = engine.getOutput();
  console.log('Commands length:', commands.length);

  await renderPreview(commands, 'Debug Flex', 'debug-flex');
}

main().catch(console.error);
