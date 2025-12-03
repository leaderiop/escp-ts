/**
 * Example 30: Template String Interpolation (JSX Version)
 *
 * Demonstrates the power of template string interpolation using JSX:
 * - Basic variable substitution: {{name}}
 * - Nested paths: {{user.address.city}}
 * - Built-in filters: {{price | currency}}, {{name | uppercase}}
 * - Filter chaining: {{text | trim | uppercase}}
 * - Default values: {{missing | default:"N/A"}}
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/30-template-interpolation.tsx
 */

import { LayoutEngine } from '@escp/jsx';
import { Stack, Flex, Text, Line, Spacer, Template } from '@escp/jsx';
import type { LayoutNode } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

async function main() {
  printSection('Template String Interpolation Demo (JSX)');

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

  const layout = (
    <Stack style={{ gap: 10, padding: 30 }}>
      {/* Header */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">
        TEMPLATE INTERPOLATION DEMO
      </Text>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 15 }} />

      {/* Basic Variable Substitution */}
      <Text style={{ bold: true, underline: true }}>1. BASIC VARIABLE SUBSTITUTION</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Syntax: {{variableName}}'}</Text>
      <Spacer style={{ height: 8 }} />
      <Template template="Company: {{company.name}}" />
      <Template template="Tagline: {{company.tagline}}" />
      <Spacer style={{ height: 15 }} />

      {/* Nested Paths */}
      <Text style={{ bold: true, underline: true }}>2. NESTED OBJECT PATHS</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Syntax: {{object.nested.property}}'}</Text>
      <Spacer style={{ height: 8 }} />
      <Template template="Address: {{company.address.street}}" />
      <Template template="City: {{company.address.city}}, {{company.address.state}} {{company.address.zip}}" />
      <Spacer style={{ height: 15 }} />

      {/* String Filters */}
      <Text style={{ bold: true, underline: true }}>3. STRING FILTERS</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>uppercase, lowercase, capitalize, trim, truncate</Text>
      <Spacer style={{ height: 8 }} />
      <Flex>
        <Text>Original:</Text>
        <Template template="{{greeting}}" />
      </Flex>
      <Flex>
        <Text>Trimmed:</Text>
        <Template template="{{greeting | trim}}" />
      </Flex>
      <Flex>
        <Text>Uppercase:</Text>
        <Template template="{{customer.name | uppercase}}" />
      </Flex>
      <Flex>
        <Text>Lowercase:</Text>
        <Template template="{{customer.email | lowercase}}" />
      </Flex>
      <Flex>
        <Text>Capitalized:</Text>
        <Template template="{{company.tagline | capitalize}}" />
      </Flex>
      <Flex>
        <Text>Truncated:</Text>
        <Template template="{{company.tagline | truncate:20}}" />
      </Flex>
      <Spacer style={{ height: 15 }} />

      {/* Number Filters */}
      <Text style={{ bold: true, underline: true }}>4. NUMBER FILTERS</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>currency, number, percent</Text>
      <Spacer style={{ height: 8 }} />
      <Flex>
        <Text>Order Total:</Text>
        <Template template={'{{order.total | currency:"$"}}'} />
      </Flex>
      <Flex>
        <Text>Discount:</Text>
        <Template template={'{{order.discount | currency:"$"}}'} />
      </Flex>
      <Flex>
        <Text>Tax:</Text>
        <Template template={'{{order.tax | currency:"$"}}'} />
      </Flex>
      <Flex>
        <Text>Loyalty Points:</Text>
        <Template template="{{customer.loyaltyPoints | number}}" />
      </Flex>
      <Spacer style={{ height: 15 }} />

      {/* Default Values */}
      <Text style={{ bold: true, underline: true }}>5. DEFAULT VALUES</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Syntax: {{missing | default:"fallback"}}'}</Text>
      <Spacer style={{ height: 8 }} />
      <Flex>
        <Text>Phone:</Text>
        <Template template={'{{customer.phone | default:"Not provided"}}'} />
      </Flex>
      <Flex>
        <Text>Notes:</Text>
        <Template template={'{{order.notes | default:"None"}}'} />
      </Flex>
      <Spacer style={{ height: 15 }} />

      {/* Filter Chaining */}
      <Text style={{ bold: true, underline: true }}>6. FILTER CHAINING</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Syntax: {{value | filter1 | filter2 | filter3}}'}</Text>
      <Spacer style={{ height: 8 }} />
      <Template template="{{greeting | trim | uppercase | truncate:15}}" />
      <Template template="{{company.tagline | capitalize | truncate:25}}" />
      <Spacer style={{ height: 15 }} />

      {/* Styled Templates */}
      <Text style={{ bold: true, underline: true }}>7. STYLED TEMPLATES</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>Templates can have bold, italic, underline styles</Text>
      <Spacer style={{ height: 8 }} />
      <Template template="Order #{{order.number}}" style={{ bold: true }} />
      <Template template="Customer: {{customer.name}}" style={{ italic: true }} />
      <Template template={'Total: {{order.total | currency:"$"}}'} style={{ underline: true }} />
      <Template
        template="IMPORTANT: {{company.name | uppercase}}"
        style={{ bold: true, doubleWidth: true }}
      />
      <Spacer style={{ height: 15 }} />

      {/* Local Data Override */}
      <Text style={{ bold: true, underline: true }}>8. LOCAL DATA OVERRIDE</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>Templates can provide local data that overrides context</Text>
      <Spacer style={{ height: 8 }} />
      <Template
        template={'Product: {{product.name}} - {{product.price | currency:"$"}}'}
        data={{ product: { name: 'Widget Pro', price: 29.99 } }}
      />
      <Template
        template={'Product: {{product.name}} - {{product.price | currency:"$"}}'}
        data={{ product: { name: 'Gadget Plus', price: 49.99 } }}
      />
      <Spacer style={{ height: 20 }} />

      {/* Footer */}
      <Line char="-" length="fill" />
      <Flex>
        <Template template="Generated for: {{customer.name}}" style={{ italic: true }} />
        <Spacer />
        <Template template="Order: {{order.number}}" style={{ italic: true }} />
      </Flex>
    </Stack>
  ) as LayoutNode;

  engine.render(layout);

  const commands = engine.getOutput();
  await renderPreview(
    commands,
    'Template String Interpolation (JSX)',
    '30-template-interpolation-jsx'
  );
}

main().catch(console.error);
