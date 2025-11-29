/**
 * Example 33: Reusable Component Pattern
 *
 * Demonstrates creating reusable layout components as factory functions:
 * - Simple components with props
 * - Components with children/slots
 * - Parameterized styling
 * - Composable component hierarchies
 * - Type-safe props with TypeScript
 *
 * This pattern enables clean, maintainable, and reusable layouts.
 *
 * Run: npx tsx examples/33-reusable-components.ts
 */

import {
  LayoutEngine,
  stack,
  flex,
  text,
  template,
  line,
  conditional,
  each,
  type LayoutNode,
  type HAlign,
} from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

// ============================================================
// COMPONENT DEFINITIONS
// ============================================================

/**
 * Section Header Component
 * A styled header with a title and optional subtitle
 */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: HAlign;
}

const SectionHeader = ({ title, subtitle, align = 'left' }: SectionHeaderProps): LayoutNode =>
  stack()
    .gap(3)
    .text(title, { bold: true, doubleWidth: true, align })
    .add(subtitle ? text(subtitle, { italic: true, align }) : { type: 'spacer', height: 0 })
    .line('=', 'fill')
    .spacer(10)
    .build();

/**
 * Card Component
 * A bordered container with padding
 */
interface CardProps {
  title?: string;
  children: LayoutNode | LayoutNode[];
  width?: number | string;
}

const Card = ({ title, children, width }: CardProps): LayoutNode => {
  const childrenArray = Array.isArray(children) ? children : [children];

  const builder = stack()
    .width((width ?? 'fill') as number | 'auto' | 'fill')
    .gap(5)
    .line('-', 'fill')
    .add(title ? text(title, { bold: true }) : { type: 'spacer', height: 0 })
    .add(title ? line('-', 'fill') : { type: 'spacer', height: 0 });

  for (const child of childrenArray) {
    builder.add({ ...child });
  }

  return builder.line('-', 'fill').build();
};

/**
 * KeyValue Component
 * Displays a label-value pair in a flex row
 */
interface KeyValueProps {
  label: string;
  value: string;
  labelWidth?: number;
  bold?: boolean;
}

const KeyValue = ({ label, value, labelWidth = 150, bold = false }: KeyValueProps): LayoutNode =>
  flex().text(label, { width: labelWidth, bold }).text(value, { bold }).build();

/**
 * Price Display Component
 * Shows price with optional sale styling
 */
interface PriceProps {
  amount: number;
  currency?: string;
  isOnSale?: boolean;
  originalPrice?: number;
}

const Price = ({ amount, currency = '$', isOnSale, originalPrice }: PriceProps): LayoutNode => {
  const formatted = `${currency}${amount.toFixed(2)}`;

  if (isOnSale && originalPrice) {
    return flex()
      .gap(10)
      .text(`${currency}${originalPrice.toFixed(2)}`, { italic: true })
      .text(formatted, { bold: true })
      .text('SALE!', { bold: true })
      .build();
  }

  return text(formatted, { bold: true });
};

/**
 * Badge Component
 * A styled label/tag
 */
interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const Badge = ({ text: badgeText, variant = 'default' }: BadgeProps): LayoutNode => {
  const styles: Record<string, { bold?: boolean; italic?: boolean; doubleWidth?: boolean }> = {
    default: {},
    success: { bold: true },
    warning: { italic: true },
    error: { bold: true, doubleWidth: true },
  };

  const style = styles[variant] ?? styles.default;
  return text(`[${badgeText}]`, { ...style });
};

/**
 * Product Card Component
 * A complete product display with name, price, stock status
 */
interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
}

const ProductCard = ({
  name,
  description,
  price,
  originalPrice,
  stock,
  category,
}: ProductCardProps): LayoutNode => {
  const isOnSale = originalPrice !== undefined && originalPrice > price;
  const stockStatus = stock > 100 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock';
  const stockVariant = stock > 100 ? 'success' : stock > 0 ? 'warning' : 'error';

  return Card({
    title: name,
    children: [
      text(description, { italic: true }),
      { type: 'spacer', height: 5 },
      flex().text('Category: ').text(category).build(),
      flex()
        .text('Price: ')
        .add(Price({ amount: price, originalPrice, isOnSale }))
        .build(),
      flex()
        .text('Status: ')
        .add(Badge({ text: stockStatus, variant: stockVariant as BadgeProps['variant'] }))
        .build(),
    ],
  });
};

/**
 * Address Component
 * Formats an address block
 */
interface AddressProps {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

const Address = ({ name, street, city, state, zip, country }: AddressProps): LayoutNode =>
  stack()
    .gap(2)
    .text(name, { bold: true })
    .text(street)
    .text(`${city}, ${state} ${zip}`)
    .add(country ? text(country) : { type: 'spacer', height: 0 })
    .build();

/**
 * Invoice Header Component
 * Company info and invoice details
 */
interface InvoiceHeaderProps {
  company: {
    name: string;
    address: AddressProps;
  };
  invoiceNumber: string;
  date: string;
}

const InvoiceHeader = ({ company, invoiceNumber, date }: InvoiceHeaderProps): LayoutNode =>
  flex()
    .add(
      stack()
        .width('50%')
        .text(company.name, { bold: true, doubleWidth: true })
        .add(Address(company.address))
    )
    .add(
      stack()
        .width('50%')
        .text('INVOICE', { bold: true, doubleWidth: true, align: 'right' })
        .text(`#${invoiceNumber}`, { align: 'right' })
        .text(`Date: ${date}`, { align: 'right' })
    )
    .build();

// ============================================================
// MAIN EXAMPLE
// ============================================================

async function main() {
  printSection('Reusable Component Pattern Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(15)
    .padding(30)

    // === HEADER ===
    .add(
      SectionHeader({
        title: 'REUSABLE COMPONENTS',
        subtitle: 'Building maintainable layouts with component patterns',
        align: 'center',
      })
    )
    .spacer(10)

    // === SECTION 1: BASIC COMPONENTS ===
    .add(SectionHeader({ title: '1. Basic Components' }))

    .text('KeyValue Component:', { bold: true })
    .add(KeyValue({ label: 'Customer:', value: 'John Doe' }))
    .add(KeyValue({ label: 'Email:', value: 'john@example.com' }))
    .add(KeyValue({ label: 'Phone:', value: '(555) 123-4567', bold: true }))
    .spacer(10)

    .text('Badge Component:', { bold: true })
    .add(
      flex()
        .gap(20)
        .add(Badge({ text: 'Default' }))
        .add(Badge({ text: 'Success', variant: 'success' }))
        .add(Badge({ text: 'Warning', variant: 'warning' }))
        .add(Badge({ text: 'Error', variant: 'error' }))
    )
    .spacer(10)

    .text('Price Component:', { bold: true })
    .add(
      flex()
        .gap(30)
        .add(
          stack()
            .text('Regular:')
            .add(Price({ amount: 29.99 }))
        )
        .add(
          stack()
            .text('On Sale:')
            .add(Price({ amount: 19.99, originalPrice: 29.99, isOnSale: true }))
        )
    )
    .spacer(20)

    // === SECTION 2: CARD COMPONENT ===
    .add(SectionHeader({ title: '2. Card Component' }))

    .add(
      Card({
        title: 'Simple Card',
        children: [
          text('This is a card with a title and content.'),
          text('Cards provide visual grouping.'),
        ],
      })
    )
    .spacer(15)

    // === SECTION 3: PRODUCT CARDS ===
    .add(SectionHeader({ title: '3. Product Cards' }))

    .add(
      ProductCard({
        name: 'Wireless Mouse Pro',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 39.99,
        stock: 150,
        category: 'Electronics',
      })
    )
    .spacer(10)

    .add(
      ProductCard({
        name: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with Cherry MX switches',
        price: 79.99,
        originalPrice: 99.99,
        stock: 25,
        category: 'Electronics',
      })
    )
    .spacer(10)

    .add(
      ProductCard({
        name: 'USB Hub (Discontinued)',
        description: 'No longer available',
        price: 19.99,
        stock: 0,
        category: 'Accessories',
      })
    )
    .spacer(20)

    // === SECTION 4: ADDRESS COMPONENT ===
    .add(SectionHeader({ title: '4. Address Component' }))

    .add(
      flex()
        .add(
          stack()
            .width('50%')
            .text('Billing Address:', { bold: true, underline: true })
            .spacer(5)
            .add(
              Address({
                name: 'John Doe',
                street: '123 Main Street',
                city: 'Springfield',
                state: 'IL',
                zip: '62701',
                country: 'USA',
              })
            )
        )
        .add(
          stack()
            .width('50%')
            .text('Shipping Address:', { bold: true, underline: true })
            .spacer(5)
            .add(
              Address({
                name: 'Jane Smith',
                street: '456 Oak Avenue',
                city: 'Chicago',
                state: 'IL',
                zip: '60601',
              })
            )
        )
    )
    .spacer(20)

    // === SECTION 5: INVOICE HEADER ===
    .add(SectionHeader({ title: '5. Invoice Header Component' }))

    .add(
      InvoiceHeader({
        company: {
          name: 'ACME Corp',
          address: {
            name: 'ACME Corporation',
            street: '789 Business Blvd',
            city: 'Commerce City',
            state: 'CA',
            zip: '90210',
          },
        },
        invoiceNumber: 'INV-2024-001234',
        date: '2024-12-15',
      })
    )
    .spacer(20)

    // === SECTION 6: COMPOSITION EXAMPLE ===
    .add(SectionHeader({ title: '6. Component Composition' }))

    .text('Components can be composed together:', { italic: true })
    .spacer(10)

    .add(
      Card({
        title: 'Order Summary',
        children: [
          KeyValue({ label: 'Order #:', value: 'ORD-2024-5678' }),
          KeyValue({ label: 'Date:', value: '2024-12-15' }),
          KeyValue({ label: 'Status:', value: 'Shipped' }),
          { type: 'line', char: '-' } as LayoutNode,
          KeyValue({ label: 'Subtotal:', value: '$149.97' }),
          KeyValue({ label: 'Shipping:', value: '$9.99' }),
          KeyValue({ label: 'Tax:', value: '$12.00' }),
          { type: 'line', char: '-' } as LayoutNode,
          KeyValue({ label: 'Total:', value: '$171.96', bold: true }),
        ],
      })
    )
    .spacer(20)

    // === FOOTER ===
    .line('=', 'fill')
    .text('End of Reusable Components Demo', { align: 'center', italic: true })
    .text('Components enable clean, maintainable, and reusable layouts', { align: 'center' })
    .build();

  engine.render(layout);

  const commands = engine.getOutput();
  await renderPreview(commands, 'Reusable Components', '33-reusable-components');
}

main().catch(console.error);
