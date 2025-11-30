/**
 * Examples Index/Catalog
 *
 * This file exports metadata for all examples and QA tests.
 * Used by helper scripts and for documentation generation.
 */

export interface ExampleMetadata {
  id: string;
  name: string;
  category: 'fundamentals' | 'intermediate' | 'advanced' | 'components';
  path: string;
  description: string;
  topics: string[];
}

export interface QaTestMetadata {
  id: string;
  name: string;
  category:
    | 'flex'
    | 'stack'
    | 'positioning'
    | 'margins'
    | 'vertical'
    | 'stress'
    | 'byte-verification'
    | 'misc';
  path: string;
  description: string;
  topics: string[];
}

/**
 * All user-facing examples (01-31)
 */
export const examples: ExampleMetadata[] = [
  // 01-FUNDAMENTALS
  {
    id: '01',
    name: 'Basic Printing',
    category: 'fundamentals',
    path: '01-fundamentals/01-basic-printing.ts',
    description: 'Basic text printing with styles, CPI settings, and form feed',
    topics: ['text', 'bold', 'italic', 'underline', 'cpi'],
  },
  {
    id: '02',
    name: 'Layout System',
    category: 'fundamentals',
    path: '01-fundamentals/02-layout-system/02-layout-system.tsx',
    description: 'Stack and Flex layouts using JSX',
    topics: ['stack', 'flex', 'layout', 'jsx'],
  },
  {
    id: '03',
    name: 'Graphics',
    category: 'fundamentals',
    path: '01-fundamentals/03-graphics.ts',
    description: 'Image printing with dithering options',
    topics: ['graphics', 'images', 'dithering'],
  },
  {
    id: '04',
    name: 'Barcodes',
    category: 'fundamentals',
    path: '01-fundamentals/04-barcodes.ts',
    description: 'Barcode generation (Code 39, EAN-13, UPC-A, Code 128)',
    topics: ['barcodes', 'code39', 'ean13', 'upca', 'code128'],
  },
  {
    id: '05',
    name: 'Virtual Preview',
    category: 'fundamentals',
    path: '01-fundamentals/05-virtual-preview.ts',
    description: 'Virtual rendering and PNG export',
    topics: ['preview', 'png', 'virtual-renderer'],
  },
  {
    id: '06',
    name: 'Text Styles',
    category: 'fundamentals',
    path: '01-fundamentals/06-text-styles/06-text-styles.tsx',
    description: 'Text styling with JSX components',
    topics: ['text', 'styles', 'jsx'],
  },
  {
    id: '07',
    name: 'Pagination',
    category: 'fundamentals',
    path: '01-fundamentals/07-pagination.ts',
    description: 'Multi-page documents and page breaks',
    topics: ['pagination', 'pages', 'form-feed'],
  },
  {
    id: '08',
    name: 'Constraints',
    category: 'fundamentals',
    path: '01-fundamentals/08-constraints/08-constraints.tsx',
    description: 'Width and height constraints',
    topics: ['constraints', 'width', 'height'],
  },
  {
    id: '09',
    name: 'Positioning',
    category: 'fundamentals',
    path: '01-fundamentals/09-positioning/09-positioning.tsx',
    description: 'Absolute and relative positioning',
    topics: ['positioning', 'absolute', 'relative'],
  },
  {
    id: '10',
    name: 'Conditional Rendering',
    category: 'fundamentals',
    path: '01-fundamentals/10-conditional.ts',
    description: 'Conditional rendering based on data',
    topics: ['conditional', 'if', 'switch'],
  },
  {
    id: '11',
    name: 'Vertical Text',
    category: 'fundamentals',
    path: '01-fundamentals/11-vertical-text.ts',
    description: 'Vertical text printing',
    topics: ['vertical', 'text', 'rotation'],
  },

  // 02-INTERMEDIATE
  {
    id: '12',
    name: 'Margins',
    category: 'intermediate',
    path: '02-intermediate/12-margins/12-margins.tsx',
    description: 'Margin and padding configuration',
    topics: ['margins', 'padding', 'spacing'],
  },
  {
    id: '13',
    name: 'Percentages',
    category: 'intermediate',
    path: '02-intermediate/13-percentages.ts',
    description: 'Percentage-based sizing',
    topics: ['percentages', 'sizing', 'responsive'],
  },
  {
    id: '14',
    name: 'Auto Margins',
    category: 'intermediate',
    path: '02-intermediate/14-auto-margins/14-auto-margins.ts',
    description: 'Auto margins for centering',
    topics: ['auto-margins', 'centering', 'alignment'],
  },
  {
    id: '15',
    name: 'Relative Positioning',
    category: 'intermediate',
    path: '02-intermediate/15-relative-positioning/15-relative-positioning.ts',
    description: 'Relative position offsets',
    topics: ['positioning', 'relative', 'offset'],
  },
  {
    id: '16',
    name: 'Typefaces',
    category: 'intermediate',
    path: '02-intermediate/16-typefaces.ts',
    description: 'Different typeface options',
    topics: ['typefaces', 'fonts', 'typography'],
  },
  {
    id: '17',
    name: 'Print Quality',
    category: 'intermediate',
    path: '02-intermediate/17-print-quality.ts',
    description: 'Print quality settings (draft, LQ)',
    topics: ['quality', 'draft', 'lq'],
  },
  {
    id: '18',
    name: 'Line Spacing',
    category: 'intermediate',
    path: '02-intermediate/18-line-spacing.ts',
    description: 'Line spacing configuration',
    topics: ['line-spacing', 'leading', 'typography'],
  },
  {
    id: '19',
    name: 'Superscript/Subscript',
    category: 'intermediate',
    path: '02-intermediate/19-superscript-subscript.ts',
    description: 'Superscript and subscript text',
    topics: ['superscript', 'subscript', 'typography'],
  },
  {
    id: '20',
    name: 'International Charsets',
    category: 'intermediate',
    path: '02-intermediate/20-international-charsets.ts',
    description: 'International character sets',
    topics: ['charset', 'international', 'encoding'],
  },
  {
    id: '21',
    name: 'Proportional Fonts',
    category: 'intermediate',
    path: '02-intermediate/21-proportional-fonts.ts',
    description: 'Proportional font support',
    topics: ['proportional', 'fonts', 'typography'],
  },
  {
    id: '22',
    name: 'Scalable Fonts',
    category: 'intermediate',
    path: '02-intermediate/22-scalable-fonts.ts',
    description: 'Scalable font sizes',
    topics: ['scalable', 'fonts', 'size'],
  },
  {
    id: '23',
    name: 'Inter-Character Spacing',
    category: 'intermediate',
    path: '02-intermediate/23-inter-character-spacing.ts',
    description: 'Character spacing adjustment',
    topics: ['spacing', 'kerning', 'typography'],
  },
  {
    id: '24',
    name: 'Word Wrapping',
    category: 'intermediate',
    path: '02-intermediate/24-word-wrapping.ts',
    description: 'Word wrapping and text overflow',
    topics: ['word-wrap', 'overflow', 'text'],
  },

  // 03-ADVANCED
  {
    id: '25',
    name: 'Graphics Modes',
    category: 'advanced',
    path: '03-advanced/25-graphics-modes.ts',
    description: 'Advanced graphics rendering modes',
    topics: ['graphics', 'modes', 'rendering'],
  },
  {
    id: '26',
    name: 'Page Headers/Footers',
    category: 'advanced',
    path: '03-advanced/26-page-headers-footers.ts',
    description: 'Repeating headers and footers',
    topics: ['headers', 'footers', 'pagination'],
  },
  {
    id: '27',
    name: 'Template Interpolation',
    category: 'advanced',
    path: '03-advanced/27-template-interpolation/27-template-interpolation.tsx',
    description: 'Data binding with template strings',
    topics: ['templates', 'data-binding', 'interpolation'],
  },
  {
    id: '28',
    name: 'Data Conditionals',
    category: 'advanced',
    path: '03-advanced/28-data-conditionals/28-data-conditionals.tsx',
    description: 'Data-driven conditional rendering',
    topics: ['conditionals', 'data', 'if-else'],
  },
  {
    id: '29',
    name: 'List Iteration',
    category: 'advanced',
    path: '03-advanced/29-list-iteration/29-list-iteration.tsx',
    description: 'Iterating over data lists',
    topics: ['iteration', 'lists', 'foreach'],
  },
  {
    id: '30',
    name: 'Reusable Components',
    category: 'advanced',
    path: '03-advanced/30-reusable-components.ts',
    description: 'Creating reusable component patterns',
    topics: ['components', 'reusable', 'patterns'],
  },
  {
    id: '31',
    name: 'Complete Invoice',
    category: 'advanced',
    path: '03-advanced/31-complete-invoice/31-complete-invoice.tsx',
    description: 'Full-featured invoice with all components',
    topics: ['invoice', 'complete', 'real-world'],
  },
];

/**
 * QA/Test examples (internal testing)
 */
export const qaTests: QaTestMetadata[] = [
  // FLEX
  {
    id: 'qa-flex-01',
    name: 'Flex Justify',
    category: 'flex',
    path: 'qa/flex/qa-01-flex-justify.ts',
    description: 'Test flex justify content',
    topics: ['flex', 'justify'],
  },
  {
    id: 'qa-flex-02',
    name: 'Flex Align Items',
    category: 'flex',
    path: 'qa/flex/qa-02-flex-align-items.ts',
    description: 'Test flex align items',
    topics: ['flex', 'align'],
  },
  {
    id: 'qa-flex-43',
    name: 'Flex Align Justify',
    category: 'flex',
    path: 'qa/flex/qa-43-flex-align-justify.ts',
    description: 'Combined flex alignment test',
    topics: ['flex', 'align', 'justify'],
  },

  // STACK
  {
    id: 'qa-stack-03',
    name: 'Stack Direction',
    category: 'stack',
    path: 'qa/stack/qa-03-stack-direction.ts',
    description: 'Test stack direction',
    topics: ['stack', 'direction'],
  },
  {
    id: 'qa-stack-33',
    name: 'Stack Alignment Edge',
    category: 'stack',
    path: 'qa/stack/qa-33-stack-alignment-edge.ts',
    description: 'Edge cases for stack alignment',
    topics: ['stack', 'alignment', 'edge-cases'],
  },
  {
    id: 'qa-stack-overlap',
    name: 'Stack Overlap Test',
    category: 'stack',
    path: 'qa/stack/qa-stack-overlap-test.ts',
    description: 'Stack element overlap testing',
    topics: ['stack', 'overlap'],
  },
  {
    id: 'qa-stack-stress',
    name: 'Stack Stress Test',
    category: 'stack',
    path: 'qa/stack/qa-stack-stress-test.ts',
    description: 'Stack stress testing',
    topics: ['stack', 'stress'],
  },

  // POSITIONING
  {
    id: 'qa-pos-07',
    name: 'Absolute Positioning',
    category: 'positioning',
    path: 'qa/positioning/qa-07-absolute-positioning.ts',
    description: 'Absolute positioning tests',
    topics: ['positioning', 'absolute'],
  },
  {
    id: 'qa-pos-29',
    name: 'Position Validation',
    category: 'positioning',
    path: 'qa/positioning/qa-29-position-validation.ts',
    description: 'Position validation tests',
    topics: ['positioning', 'validation'],
  },
  {
    id: 'qa-pos-31',
    name: 'Absolute Relative Positioning',
    category: 'positioning',
    path: 'qa/positioning/qa-31-absolute-relative-positioning.ts',
    description: 'Combined absolute/relative positioning',
    topics: ['positioning', 'absolute', 'relative'],
  },
  {
    id: 'qa-pos-38',
    name: 'Positioning Overlap Test',
    category: 'positioning',
    path: 'qa/positioning/qa-38-positioning-overlap-test.ts',
    description: 'Positioning overlap edge cases',
    topics: ['positioning', 'overlap'],
  },
  {
    id: 'qa-pos-53',
    name: 'Positioning Edge Cases',
    category: 'positioning',
    path: 'qa/positioning/qa-53-positioning-edge-cases.ts',
    description: 'Positioning edge cases',
    topics: ['positioning', 'edge-cases'],
  },
  {
    id: 'qa-pos-overlap',
    name: 'Position Overlap Verify',
    category: 'positioning',
    path: 'qa/positioning/qa-position-overlap-verify.ts',
    description: 'Position overlap verification',
    topics: ['positioning', 'overlap', 'verify'],
  },

  // MARGINS
  {
    id: 'qa-margin-08',
    name: 'Margin Padding Combo',
    category: 'margins',
    path: 'qa/margins/qa-08-margin-padding-combo.ts',
    description: 'Combined margin/padding tests',
    topics: ['margins', 'padding'],
  },
  {
    id: 'qa-margin-18',
    name: 'Auto Margin Bug',
    category: 'margins',
    path: 'qa/margins/qa-18-auto-margin-bug.ts',
    description: 'Auto margin bug reproduction',
    topics: ['margins', 'auto', 'bug'],
  },
  {
    id: 'qa-margin-42',
    name: 'Margin Padding Edge',
    category: 'margins',
    path: 'qa/margins/qa-42-margin-padding-edge.ts',
    description: 'Margin/padding edge cases',
    topics: ['margins', 'padding', 'edge-cases'],
  },
  {
    id: 'qa-margin-52',
    name: 'Margin Padding Stress',
    category: 'margins',
    path: 'qa/margins/qa-52-margin-padding-stress.ts',
    description: 'Margin/padding stress test',
    topics: ['margins', 'padding', 'stress'],
  },

  // VERTICAL
  {
    id: 'qa-vert-20',
    name: 'Stack Row Valign',
    category: 'vertical',
    path: 'qa/vertical/qa-20-stack-row-valign.ts',
    description: 'Vertical alignment in row stacks',
    topics: ['vertical', 'alignment', 'stack'],
  },
  {
    id: 'qa-vert-30',
    name: 'Vertical Position Test',
    category: 'vertical',
    path: 'qa/vertical/qa-30-vertical-position-test.ts',
    description: 'Vertical positioning tests',
    topics: ['vertical', 'positioning'],
  },
  {
    id: 'qa-vert-39',
    name: 'Row Stack Valign Stress',
    category: 'vertical',
    path: 'qa/vertical/qa-39-row-stack-valign-stress.ts',
    description: 'Row stack vertical alignment stress',
    topics: ['vertical', 'alignment', 'stress'],
  },
  {
    id: 'qa-vert-41',
    name: 'Valign Byte Analysis',
    category: 'vertical',
    path: 'qa/vertical/qa-41-valign-byte-analysis.ts',
    description: 'Byte-level vertical alignment analysis',
    topics: ['vertical', 'alignment', 'bytes'],
  },
  {
    id: 'qa-vert-50',
    name: 'Vertical Alignment Analysis',
    category: 'vertical',
    path: 'qa/vertical/qa-50-vertical-alignment-analysis.ts',
    description: 'Comprehensive vertical alignment analysis',
    topics: ['vertical', 'alignment', 'analysis'],
  },

  // STRESS
  {
    id: 'qa-stress-28',
    name: 'Nested Flex Stress',
    category: 'stress',
    path: 'qa/stress/qa-28-nested-flex-stress.ts',
    description: 'Nested flex stress test',
    topics: ['stress', 'flex', 'nested'],
  },
  {
    id: 'qa-stress-35',
    name: 'Nested Flex Alignment Stress',
    category: 'stress',
    path: 'qa/stress/qa-35-nested-flex-alignment-stress.ts',
    description: 'Nested flex alignment stress',
    topics: ['stress', 'flex', 'alignment'],
  },
  {
    id: 'qa-stress-40',
    name: 'Nested Flex Stack 40',
    category: 'stress',
    path: 'qa/stress/qa-40-nested-flex-stack.ts',
    description: 'Nested flex/stack combinations',
    topics: ['stress', 'flex', 'stack'],
  },
  {
    id: 'qa-stress-50',
    name: 'Nested Flex Stack 50',
    category: 'stress',
    path: 'qa/stress/qa-50-nested-flex-stack.ts',
    description: 'Advanced nested flex/stack',
    topics: ['stress', 'flex', 'stack'],
  },

  // BYTE VERIFICATION
  {
    id: 'qa-byte-28',
    name: 'Byte Verification',
    category: 'byte-verification',
    path: 'qa/byte-verification/qa-28-byte-verification.ts',
    description: 'ESC/P byte sequence verification',
    topics: ['bytes', 'verification', 'escp'],
  },
  {
    id: 'qa-byte-31',
    name: 'PRN Anomaly Scanner',
    category: 'byte-verification',
    path: 'qa/byte-verification/qa-31-prn-anomaly-scanner.ts',
    description: 'PRN file anomaly detection',
    topics: ['bytes', 'prn', 'anomaly'],
  },
  {
    id: 'qa-byte-abs',
    name: 'PRN Absolute Positioning',
    category: 'byte-verification',
    path: 'qa/byte-verification/qa-prn-absolute-positioning.ts',
    description: 'PRN absolute positioning verification',
    topics: ['bytes', 'prn', 'positioning'],
  },
  {
    id: 'qa-byte-flex',
    name: 'PRN Flex Positions',
    category: 'byte-verification',
    path: 'qa/byte-verification/qa-prn-flex-positions.ts',
    description: 'PRN flex position verification',
    topics: ['bytes', 'prn', 'flex'],
  },
  {
    id: 'qa-byte-stack',
    name: 'PRN Stack Spacing',
    category: 'byte-verification',
    path: 'qa/byte-verification/qa-prn-stack-spacing.ts',
    description: 'PRN stack spacing verification',
    topics: ['bytes', 'prn', 'stack'],
  },
  {
    id: 'qa-byte-y',
    name: 'Absolute Y Bug Test',
    category: 'byte-verification',
    path: 'qa/byte-verification/qa-absolute-y-bug-test.ts',
    description: 'Absolute Y position bug test',
    topics: ['bytes', 'bug', 'positioning'],
  },

  // MISC
  {
    id: 'qa-misc-13',
    name: 'Space Evenly',
    category: 'misc',
    path: 'qa/misc/qa-13-space-evenly.ts',
    description: 'Space evenly distribution test',
    topics: ['misc', 'spacing', 'distribution'],
  },
  {
    id: 'qa-misc-44',
    name: 'Width Interaction',
    category: 'misc',
    path: 'qa/misc/qa-44-width-interaction.ts',
    description: 'Width interaction tests',
    topics: ['misc', 'width', 'interaction'],
  },
  {
    id: 'qa-misc-48',
    name: 'Flex Text Merge Bug',
    category: 'misc',
    path: 'qa/misc/qa-48-flex-text-merge-bug.ts',
    description: 'Flex text merge bug reproduction',
    topics: ['misc', 'flex', 'bug'],
  },
];

/**
 * Component examples
 */
export const componentExamples: ExampleMetadata[] = [
  {
    id: 'comp-01',
    name: 'Layout Components',
    category: 'components',
    path: 'components/01-layout.tsx',
    description: 'Layout component examples',
    topics: ['components', 'layout'],
  },
  {
    id: 'comp-02',
    name: 'Content Components',
    category: 'components',
    path: 'components/02-content.tsx',
    description: 'Content component examples',
    topics: ['components', 'content'],
  },
  {
    id: 'comp-03',
    name: 'Control Components',
    category: 'components',
    path: 'components/03-controls.tsx',
    description: 'Control component examples',
    topics: ['components', 'controls'],
  },
  {
    id: 'comp-04',
    name: 'Data Display Components',
    category: 'components',
    path: 'components/04-data-display.tsx',
    description: 'Data display component examples',
    topics: ['components', 'data'],
  },
  {
    id: 'comp-05',
    name: 'Table Border Components',
    category: 'components',
    path: 'components/05-table-borders.tsx',
    description: 'Table and border component examples',
    topics: ['components', 'tables', 'borders'],
  },
  {
    id: 'comp-06',
    name: 'Typography Components',
    category: 'components',
    path: 'components/06-typography.tsx',
    description: 'Typography component examples',
    topics: ['components', 'typography'],
  },
  {
    id: 'comp-07',
    name: 'Decorative Components',
    category: 'components',
    path: 'components/07-decorative.tsx',
    description: 'Decorative component examples',
    topics: ['components', 'decorative'],
  },
  {
    id: 'comp-08',
    name: 'Complete Invoice',
    category: 'components',
    path: 'components/08-complete-invoice.tsx',
    description: 'Full invoice using all components',
    topics: ['components', 'invoice', 'complete'],
  },
];
