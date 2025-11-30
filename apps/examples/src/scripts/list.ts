/**
 * List all available examples
 *
 * Usage: pnpm examples:list
 */

import { examples, qaTests } from '../index';

function printTable(items: typeof examples, title: string) {
  console.log(`\n${title}`);
  console.log('='.repeat(60));

  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  for (const [category, categoryItems] of Object.entries(grouped)) {
    console.log(`\n## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`);
    for (const item of categoryItems) {
      console.log(`  [${item.id}] ${item.name}`);
      console.log(`      ${item.description}`);
      console.log(`      Topics: ${item.topics.join(', ')}`);
      console.log(`      Run: npx tsx src/${item.path}`);
      console.log('');
    }
  }
}

function main() {
  console.log('escp-ts Examples Catalog');
  console.log('========================\n');
  console.log(`Total examples: ${examples.length}`);
  console.log(`Total QA tests: ${qaTests.length}`);

  printTable(examples, 'EXAMPLES');
  printTable(qaTests, 'QA TESTS');
}

main();
