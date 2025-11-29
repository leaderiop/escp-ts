/**
 * Example 32: List Iteration with For (JSX Version)
 *
 * Demonstrates iterating over arrays with <For> component:
 * - Basic iteration: <For items="array">
 * - Custom variable names: as="product" indexAs="i"
 * - Separators between items: separator={<Line/>}
 * - Empty state handling: empty={<Text>No items</Text>}
 * - Nested iteration for complex data
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/32-list-iteration.tsx
 */

import { LayoutEngine, gt } from '../src/index';
import { Stack, Flex, Text, Line, Spacer, Template, If, For } from '../src/jsx';
import type { LayoutNode } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('List Iteration Demo (JSX)');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Set up sample data with various arrays
  engine.setData({
    // Simple array of strings
    categories: ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Toys'],

    // Array of objects
    products: [
      { name: 'Wireless Mouse', price: 29.99, stock: 150, category: 'Electronics' },
      { name: 'USB-C Cable', price: 12.99, stock: 500, category: 'Electronics' },
      { name: 'Mechanical Keyboard', price: 89.99, stock: 75, category: 'Electronics' },
      { name: 'Cotton T-Shirt', price: 19.99, stock: 200, category: 'Clothing' },
      { name: 'Running Shoes', price: 79.99, stock: 45, category: 'Clothing' },
    ],

    // Order with line items
    order: {
      number: 'ORD-2024-5678',
      items: [
        { sku: 'WM-001', name: 'Wireless Mouse', qty: 2, unitPrice: 29.99 },
        { sku: 'KB-002', name: 'Mechanical Keyboard', qty: 1, unitPrice: 89.99 },
        { sku: 'UC-003', name: 'USB-C Cable (3-pack)', qty: 3, unitPrice: 12.99 },
      ],
    },

    // Empty array for demo
    emptyList: [],

    // Nested data structure
    departments: [
      {
        name: 'Engineering',
        employees: [
          { name: 'Alice', role: 'Senior Developer' },
          { name: 'Bob', role: 'DevOps Engineer' },
          { name: 'Carol', role: 'QA Lead' },
        ],
      },
      {
        name: 'Design',
        employees: [
          { name: 'David', role: 'UI Designer' },
          { name: 'Eve', role: 'UX Researcher' },
        ],
      },
    ],
  });

  const layout = (
    <Stack style={{ gap: 10, padding: 30 }}>
      {/* Header */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">LIST ITERATION DEMO</Text>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 15 }} />

      {/* Basic Iteration */}
      <Text style={{ bold: true, underline: true }}>1. BASIC STRING ARRAY ITERATION</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'<For items="path">...'}</Text>
      <Spacer style={{ height: 8 }} />

      <Text style={{ bold: true }}>Categories:</Text>
      <For items="categories">
        <Template template="  - {{item}}" />
      </For>
      <Spacer style={{ height: 15 }} />

      {/* With Index */}
      <Text style={{ bold: true, underline: true }}>2. ITERATION WITH INDEX</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Access {{index}} for current position (0-based)'}</Text>
      <Spacer style={{ height: 8 }} />

      <Text style={{ bold: true }}>Categories (numbered):</Text>
      <For items="categories" indexAs="num">
        <Template template="  {{num}}. {{item}}" />
      </For>
      <Spacer style={{ height: 15 }} />

      {/* Object Arrays */}
      <Text style={{ bold: true, underline: true }}>3. OBJECT ARRAY ITERATION</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Access object properties: {{item.property}}'}</Text>
      <Spacer style={{ height: 8 }} />

      <Text style={{ bold: true }}>Product Catalog:</Text>
      <Line char="-" length="fill" />
      <For items="products" as="product">
        <Flex>
          <Stack style={{ width: 300 }}>
            <Template template="{{product.name}}" />
          </Stack>
          <Stack style={{ width: 100 }}>
            <Template template={'{{product.price | currency:"$"}}'} align="right" />
          </Stack>
          <Stack style={{ width: 150 }}>
            <Template template="Stock: {{product.stock}}" align="right" />
          </Stack>
        </Flex>
      </For>
      <Line char="-" length="fill" />
      <Spacer style={{ height: 15 }} />

      {/* With Separators */}
      <Text style={{ bold: true, underline: true }}>4. ITERATION WITH SEPARATORS</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>separator prop adds content between items</Text>
      <Spacer style={{ height: 8 }} />

      <Text style={{ bold: true }}>Products (with separators):</Text>
      <For
        items="products"
        as="p"
        separator={<Line char="." length="fill" /> as LayoutNode}
      >
        <Stack>
          <Template template="{{p.name}}" style={{ bold: true }} />
          <Template template={'  Price: {{p.price | currency:"$"}} | Category: {{p.category}}'} />
        </Stack>
      </For>
      <Spacer style={{ height: 15 }} />

      {/* Empty State */}
      <Text style={{ bold: true, underline: true }}>5. EMPTY ARRAY HANDLING</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>empty prop renders when array is empty</Text>
      <Spacer style={{ height: 8 }} />

      <Text style={{ bold: true }}>Empty List Demo:</Text>
      <For
        items="emptyList"
        empty={
          <Stack style={{ padding: 10 }}>
            <Text style={{ italic: true }} align="center">No items found</Text>
            <Text align="center">(This is the empty state)</Text>
          </Stack> as LayoutNode
        }
      >
        <Template template="{{item}}" />
      </For>
      <Spacer style={{ height: 15 }} />

      {/* Order Line Items */}
      <Text style={{ bold: true, underline: true }}>6. ORDER LINE ITEMS (Invoice Style)</Text>
      <Spacer style={{ height: 5 }} />
      <Line char="=" length="fill" />
      <Template template="Order: {{order.number}}" style={{ bold: true }} />
      <Line char="-" length="fill" />

      {/* Header row */}
      <Flex>
        <Stack style={{ width: 100 }}>
          <Text style={{ bold: true }}>SKU</Text>
        </Stack>
        <Stack style={{ width: 350 }}>
          <Text style={{ bold: true }}>Description</Text>
        </Stack>
        <Stack style={{ width: 80 }}>
          <Text style={{ bold: true }} align="right">Qty</Text>
        </Stack>
        <Stack style={{ width: 120 }}>
          <Text style={{ bold: true }} align="right">Unit Price</Text>
        </Stack>
      </Flex>
      <Line char="-" length="fill" />

      {/* Line items */}
      <For items="order.items" as="line" indexAs="lineNum">
        <Flex>
          <Stack style={{ width: 100 }}>
            <Template template="{{line.sku}}" />
          </Stack>
          <Stack style={{ width: 350 }}>
            <Template template="{{line.name}}" />
          </Stack>
          <Stack style={{ width: 80 }}>
            <Template template="{{line.qty}}" align="right" />
          </Stack>
          <Stack style={{ width: 120 }}>
            <Template template={'{{line.unitPrice | currency:"$"}}'} align="right" />
          </Stack>
        </Flex>
      </For>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 15 }} />

      {/* Conditionals in Iteration */}
      <Text style={{ bold: true, underline: true }}>7. CONDITIONALS INSIDE ITERATION</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Combine <For> with <If> for dynamic content'}</Text>
      <Spacer style={{ height: 8 }} />

      <For items="products" as="p">
        <Flex>
          <Stack style={{ width: 300 }}>
            <Template template="{{p.name}}" />
          </Stack>
          <Stack style={{ width: 150 }}>
            <If
              condition={gt('p.stock', 100)}
              else={
                <If
                  condition={gt('p.stock', 0)}
                  else={<Text style={{ bold: true }}>OUT OF STOCK</Text> as LayoutNode}
                >
                  <Text style={{ italic: true }}>Low Stock</Text>
                </If> as LayoutNode
              }
            >
              <Text style={{ bold: true }}>In Stock</Text>
            </If>
          </Stack>
          <Stack style={{ width: 100 }}>
            <Template template={'{{p.price | currency:"$"}}'} align="right" />
          </Stack>
        </Flex>
      </For>
      <Spacer style={{ height: 15 }} />

      {/* Nested Iteration */}
      <Text style={{ bold: true, underline: true }}>8. NESTED ITERATION</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>Iterate over nested arrays (departments -&gt; employees)</Text>
      <Spacer style={{ height: 8 }} />

      <For items="departments" as="dept">
        <Stack style={{ gap: 5 }}>
          <Template template="Department: {{dept.name}}" style={{ bold: true, underline: true }} />
          <For items="dept.employees" as="emp">
            <Flex>
              <Text>  </Text>
              <Stack style={{ width: 150 }}>
                <Template template="{{emp.name}}" />
              </Stack>
              <Template template="({{emp.role}})" style={{ italic: true }} />
            </Flex>
          </For>
          <Spacer style={{ height: 10 }} />
        </Stack>
      </For>
      <Spacer style={{ height: 15 }} />

      {/* Footer */}
      <Line char="=" length="fill" />
      <Text style={{ italic: true }} align="center">End of List Iteration Demo</Text>
    </Stack>
  ) as LayoutNode;

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'List Iteration (JSX)', '32-list-iteration-jsx');
}

main().catch(console.error);
