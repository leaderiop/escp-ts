/**
 * Example 02: Layout System (JSX Version)
 *
 * Demonstrates the virtual DOM layout system with stack and flex layouts
 * using the JSX API.
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/02-layout-system.tsx
 */

import { LayoutEngine } from "../src/index";
import { Stack, Flex, Text, Spacer, Line } from "../src/jsx";
import type { FunctionComponent } from "../src/jsx";
import type { LayoutNode } from "../src/index";
import { renderPreview, DEFAULT_PAPER, printSection } from "./_helpers";

// Helper component for table rows
interface TableRowProps {
  qty: string;
  desc: string;
  price: string;
  total: string;
  bold?: boolean;
}

const TableRow: FunctionComponent<TableRowProps> = ({
  qty,
  desc,
  price,
  total,
  bold,
}) => (
  <Flex style={{ gap: 20 }}>
    <Stack style={{ width: 80 }}>
      <Text style={bold ? { bold: true } : undefined}>{qty}</Text>
    </Stack>
    <Spacer style={{ width: 15 }} />
    <Stack>
      <Text style={bold ? { bold: true } : undefined}>{desc}</Text>
    </Stack>
    <Spacer />
    <Stack style={{ width: 120 }}>
      <Text align="right" style={bold ? { bold: true } : undefined}>
        {price}
      </Text>
    </Stack>
    <Spacer style={{ width: 200 }} />
    <Stack style={{ width: 120 }}>
      <Text align="right" style={bold ? { bold: true } : undefined}>
        {total}
      </Text>
    </Stack>
  </Flex>
);

// Header component
const Header: FunctionComponent = () => (
  <Stack style={{ gap: 10 }}>
    <Text style={{ bold: true, doubleWidth: true }}>INVOICE</Text>
    <Line char="-" length="fill" />
  </Stack>
);

// Address row component
const AddressRow: FunctionComponent = () => (
  <Flex style={{ justifyContent: "space-between" }}>
    <Stack>
      <Text style={{ bold: true }}>Bill To:</Text>
      <Text>John Smith</Text>
      <Text>123 Main Street</Text>
      <Text>Anytown, ST 12345</Text>
    </Stack>
    <Stack>
      <Text style={{ bold: true }}>Ship To:</Text>
      <Text>Jane Doe</Text>
      <Text>456 Oak Avenue</Text>
      <Text>Somewhere, ST 67890</Text>
    </Stack>
  </Flex>
);

// Items table component
const ItemsTable: FunctionComponent = () => (
  <Stack style={{ gap: 8 }}>
    <TableRow qty="Qty" desc="Description" price="Price" total="Total" bold />
    <Line char="-" length="fill" />
    <TableRow qty="2" desc="Widget A" price="$10.00" total="$20.00" />
    <TableRow qty="5" desc="Widget B (Premium)" price="$15.00" total="$75.00" />
    <TableRow qty="1" desc="Widget C" price="$25.00" total="$25.00" />
  </Stack>
);

// Totals section component
const TotalsSection: FunctionComponent = () => (
  <Flex style={{ justifyContent: "end" }}>
    <Stack style={{ gap: 5 }}>
      <Flex style={{ gap: 50 }}>
        <Text>Subtotal:</Text>
        <Text style={{ bold: true }}>$120.00</Text>
      </Flex>
      <Flex style={{ gap: 50 }}>
        <Text>Tax (8%):</Text>
        <Text>$9.60</Text>
      </Flex>
      <Line char="-" length={200} />
      <Flex style={{ gap: 50 }}>
        <Text style={{ bold: true }}>TOTAL:</Text>
        <Text style={{ bold: true, doubleWidth: true }}>$129.60</Text>
      </Flex>
    </Stack>
  </Flex>
);

// Main invoice document
const InvoiceDocument: FunctionComponent = () => (
  <Stack style={{ gap: 20, padding: 36 }}>
    <Header />
    <Spacer style={{ height: 20 }} />
    <AddressRow />
    <Spacer style={{ height: 30 }} />
    <ItemsTable />
    <Spacer style={{ height: 20 }} />
    <Line char="-" length="fill" />
    <TotalsSection />
    <Spacer style={{ height: 40 }} />
    <Text style={{ italic: true }}>Thank you for your business!</Text>
  </Stack>
);

async function main() {
  printSection("Layout System Demo (JSX)");

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });
  engine.initialize();
  await engine.initYoga();

  // Render the JSX layout
  const document = (<InvoiceDocument />) as LayoutNode;
  engine.render(document);

  // Get output and show preview
  const commands = engine.getOutput();
  await renderPreview(
    commands,
    "Layout System Demo (JSX)",
    "02-layout-system-jsx"
  );
}

main().catch(console.error);
