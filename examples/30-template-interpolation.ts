/**
 * Example 30: Template String Interpolation
 *
 * Demonstrates the power of template string interpolation:
 * - Basic variable substitution: {{name}}
 * - Nested paths: {{user.address.city}}
 * - Array access: {{items[0]}}
 * - Built-in filters: {{price | currency}}, {{name | uppercase}}
 * - Filter chaining: {{text | trim | uppercase}}
 * - Default values: {{missing | default:"N/A"}}
 *
 * Run: npx tsx examples/30-template-interpolation.ts
 */

import { LayoutEngine, stack, flex, template, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Template String Interpolation Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Set global data context
  engine.setData({
    company: {
      name: 'Acme Corporation',
      tagline: 'Quality products since 1985',
      address: {
        street: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
      },
    },
    customer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      memberSince: '2020-03-15',
      loyaltyPoints: 2500,
    },
    order: {
      number: 'ORD-2024-001234',
      date: '2024-12-15',
      total: 149.99,
      discount: 15.0,
      tax: 12.37,
    },
    greeting: '  welcome to our store  ',
  });

  const layout = stack()
    .gap(10)
    .padding(30)

    // === HEADER ===
    .text('TEMPLATE INTERPOLATION DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // === BASIC VARIABLE SUBSTITUTION ===
    .text('1. BASIC VARIABLE SUBSTITUTION', { bold: true, underline: true })
    .spacer(5)
    .text('Syntax: {{variableName}}', { italic: true })
    .spacer(8)
    .add(template('Company: {{company.name}}').build())
    .add(template('Tagline: {{company.tagline}}').build())
    .spacer(15)

    // === NESTED PATHS ===
    .text('2. NESTED OBJECT PATHS', { bold: true, underline: true })
    .spacer(5)
    .text('Syntax: {{object.nested.property}}', { italic: true })
    .spacer(8)
    .add(template('Address: {{company.address.street}}').build())
    .add(template('City: {{company.address.city}}, {{company.address.state}} {{company.address.zip}}').build())
    .spacer(15)

    // === CUSTOMER INFO WITH FILTERS ===
    .text('3. STRING FILTERS', { bold: true, underline: true })
    .spacer(5)
    .text('uppercase, lowercase, capitalize, trim, truncate', { italic: true })
    .spacer(8)
    .add(
      flex()
        .text('Original:')
        .add(template('{{greeting}}').build())
    )
    .add(
      flex()
        .text('Trimmed:')
        .add(template('{{greeting | trim}}').build())
    )
    .add(
      flex()
        .text('Uppercase:')
        .add(template('{{customer.name | uppercase}}').build())
    )
    .add(
      flex()
        .text('Lowercase:')
        .add(template('{{customer.email | lowercase}}').build())
    )
    .add(
      flex()
        .text('Capitalized:')
        .add(template('{{company.tagline | capitalize}}').build())
    )
    .add(
      flex()
        .text('Truncated:')
        .add(template('{{company.tagline | truncate:20}}').build())
    )
    .spacer(15)

    // === NUMBER FILTERS ===
    .text('4. NUMBER FILTERS', { bold: true, underline: true })
    .spacer(5)
    .text('currency, number, percent', { italic: true })
    .spacer(8)
    .add(
      flex()
        .text('Order Total:')
        .add(template('{{order.total | currency:"$"}}').build())
    )
    .add(
      flex()
        .text('Discount:')
        .add(template('{{order.discount | currency:"$"}}').build())
    )
    .add(
      flex()
        .text('Tax:')
        .add(template('{{order.tax | currency:"$"}}').build())
    )
    .add(
      flex()
        .text('Loyalty Points:')
        .add(template('{{customer.loyaltyPoints | number}}').build())
    )
    .spacer(15)

    // === DEFAULT VALUES ===
    .text('5. DEFAULT VALUES', { bold: true, underline: true })
    .spacer(5)
    .text('Syntax: {{missing | default:"fallback"}}', { italic: true })
    .spacer(8)
    .add(
      flex()
        .text('Phone:')
        .add(template('{{customer.phone | default:"Not provided"}}').build())
    )
    .add(
      flex()
        .text('Notes:')
        .add(template('{{order.notes | default:"None"}}').build())
    )
    .spacer(15)

    // === FILTER CHAINING ===
    .text('6. FILTER CHAINING', { bold: true, underline: true })
    .spacer(5)
    .text('Syntax: {{value | filter1 | filter2 | filter3}}', { italic: true })
    .spacer(8)
    .add(template('{{greeting | trim | uppercase | truncate:15}}').build())
    .add(template('{{company.tagline | capitalize | truncate:25}}').build())
    .spacer(15)

    // === STYLED TEMPLATES ===
    .text('7. STYLED TEMPLATES', { bold: true, underline: true })
    .spacer(5)
    .text('Templates can have bold, italic, underline styles', { italic: true })
    .spacer(8)
    .add(template('Order #{{order.number}}').bold().build())
    .add(template('Customer: {{customer.name}}').italic().build())
    .add(template('Total: {{order.total | currency:"$"}}').underline().build())
    .add(template('IMPORTANT: {{company.name | uppercase}}').bold().doubleWidth().build())
    .spacer(15)

    // === LOCAL DATA OVERRIDE ===
    .text('8. LOCAL DATA OVERRIDE', { bold: true, underline: true })
    .spacer(5)
    .text('Templates can provide local data that overrides context', { italic: true })
    .spacer(8)
    .add(
      template('Product: {{product.name}} - {{product.price | currency:"$"}}')
        .data({ product: { name: 'Widget Pro', price: 29.99 } })
        .build()
    )
    .add(
      template('Product: {{product.name}} - {{product.price | currency:"$"}}')
        .data({ product: { name: 'Gadget Plus', price: 49.99 } })
        .build()
    )
    .spacer(20)

    // === FOOTER ===
    .line('-', 'fill')
    .add(
      flex()
        .add(template('Generated for: {{customer.name}}').italic().build())
        .spacer()
        .add(template('Order: {{order.number}}').italic().build())
    )
    .build();

  engine.render(layout);

  const commands = engine.getOutput();
  await renderPreview(commands, 'Template String Interpolation', '30-template-interpolation');
}

main().catch(console.error);
