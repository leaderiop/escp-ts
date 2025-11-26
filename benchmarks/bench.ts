/**
 * Performance Benchmarks for escp-ts
 *
 * Run with: npx tsx benchmarks/bench.ts
 */

import {
  LayoutEngine,
  CommandBuilder,
  VirtualRenderer,
  stack,
  flex,
  grid,
  text,
  applyDithering,
  createTestPattern,
  measureNode,
  layoutNode,
  renderLayout,
  DEFAULT_MEASURE_CONTEXT,
} from '../src/index';

// Timing utility
function benchmark(name: string, fn: () => void, iterations = 1000): void {
  // Warm up
  for (let i = 0; i < 10; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const total = end - start;
  const avg = total / iterations;
  const opsPerSec = (1000 / avg).toFixed(0);

  console.log(
    `${name.padEnd(40)} ${avg.toFixed(3).padStart(8)}ms  ${opsPerSec.padStart(8)} ops/s`
  );
}

console.log('escp-ts Performance Benchmarks');
console.log('='.repeat(70));
console.log();

// ==================== COMMAND BUILDER ====================
console.log('Command Builder');
console.log('-'.repeat(70));

benchmark('CommandBuilder.initialize()', () => {
  CommandBuilder.initialize();
});

benchmark('CommandBuilder.absoluteHorizontalPosition()', () => {
  CommandBuilder.absoluteHorizontalPosition(1000);
});

benchmark('CommandBuilder.encodeText("Hello World")', () => {
  CommandBuilder.encodeText('Hello, World!');
});

benchmark('CommandBuilder.printLine(80 chars)', () => {
  CommandBuilder.printLine('A'.repeat(80));
});

console.log();

// ==================== LAYOUT BUILDING ====================
console.log('Layout Building');
console.log('-'.repeat(70));

benchmark('stack().text().build()', () => {
  stack().text('Hello').build();
});

benchmark('stack with 10 children', () => {
  const s = stack();
  for (let i = 0; i < 10; i++) s.text(`Line ${i}`);
  s.build();
});

benchmark('flex with 5 children', () => {
  flex()
    .text('A')
    .text('B')
    .text('C')
    .text('D')
    .text('E')
    .build();
});

benchmark('grid 4x4', () => {
  const g = grid([100, 100, 100, 100]);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) g.cell(`R${r}C${c}`);
    g.row();
  }
  g.build();
});

benchmark('nested layout (3 levels)', () => {
  stack()
    .child(
      flex()
        .child(stack().text('A').text('B').build())
        .child(stack().text('C').text('D').build())
        .build()
    )
    .build();
});

console.log();

// ==================== LAYOUT PHASES ====================
console.log('Layout Phases');
console.log('-'.repeat(70));

const testLayout = stack()
  .gap(10)
  .text('Header', { bold: true })
  .child(
    flex()
      .justify('space-between')
      .text('Left')
      .text('Right')
      .build()
  )
  .child(
    grid([100, 'fill', 100])
      .cell('A').cell('B').cell('C').row()
      .cell('1').cell('2').cell('3').row()
      .build()
  )
  .build();

benchmark('measureNode()', () => {
  measureNode(testLayout, DEFAULT_MEASURE_CONTEXT);
});

const measured = measureNode(testLayout, DEFAULT_MEASURE_CONTEXT);
benchmark('layoutNode()', () => {
  layoutNode(measured, 0, 0, 2880, 1000, DEFAULT_MEASURE_CONTEXT);
});

const laidOut = layoutNode(measured, 0, 0, 2880, 1000, DEFAULT_MEASURE_CONTEXT);
benchmark('renderLayout()', () => {
  renderLayout(laidOut);
});

console.log();

// ==================== LAYOUT ENGINE ====================
console.log('Layout Engine');
console.log('-'.repeat(70));

benchmark('LayoutEngine: init + println + formFeed', () => {
  const engine = new LayoutEngine();
  engine.initialize().println('Hello, World!').formFeed();
  engine.getOutput();
});

benchmark('LayoutEngine: render simple layout', () => {
  const engine = new LayoutEngine();
  engine.initialize();
  const layout = stack().text('Hello').text('World').build();
  engine.render(layout);
  engine.getOutput();
});

benchmark('LayoutEngine: render complex layout', () => {
  const engine = new LayoutEngine();
  engine.initialize();
  engine.render(testLayout);
  engine.getOutput();
}, 500);

console.log();

// ==================== GRAPHICS ====================
console.log('Graphics');
console.log('-'.repeat(70));

const smallImage = createTestPattern(100, 24);
const mediumImage = createTestPattern(400, 100);
const largeImage = createTestPattern(800, 200);

benchmark('Dithering: threshold 100x24', () => {
  applyDithering({ ...smallImage, data: new Uint8Array(smallImage.data) }, 'threshold');
}, 5000);

benchmark('Dithering: floyd-steinberg 100x24', () => {
  applyDithering({ ...smallImage, data: new Uint8Array(smallImage.data) }, 'floyd-steinberg');
}, 5000);

benchmark('Dithering: ordered 100x24', () => {
  applyDithering({ ...smallImage, data: new Uint8Array(smallImage.data) }, 'ordered');
}, 5000);

benchmark('Dithering: floyd-steinberg 400x100', () => {
  applyDithering({ ...mediumImage, data: new Uint8Array(mediumImage.data) }, 'floyd-steinberg');
}, 500);

benchmark('Dithering: floyd-steinberg 800x200', () => {
  applyDithering({ ...largeImage, data: new Uint8Array(largeImage.data) }, 'floyd-steinberg');
}, 100);

console.log();

// ==================== VIRTUAL RENDERER ====================
console.log('Virtual Renderer');
console.log('-'.repeat(70));

// Create some ESC/P2 data
const sampleEngine = new LayoutEngine();
sampleEngine.initialize();
for (let i = 0; i < 10; i++) {
  sampleEngine.println(`Line ${i}: Sample text content for rendering`);
}
sampleEngine.formFeed();
const sampleData = sampleEngine.getOutput();

benchmark('VirtualRenderer: parse simple doc', () => {
  const renderer = new VirtualRenderer({ dpi: 72 });
  renderer.render(sampleData);
  renderer.getPages();
}, 100);

benchmark('VirtualRenderer: parse @ 180 DPI', () => {
  const renderer = new VirtualRenderer({ dpi: 180 });
  renderer.render(sampleData);
  renderer.getPages();
}, 50);

console.log();
console.log('='.repeat(70));
console.log('Benchmarks complete');
