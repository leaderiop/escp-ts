/**
 * Example 34: Complete Invoice - Using Template Engine Features (JSX Version)
 *
 * Demonstrates template engine with a professional invoice layout using JSX.
 * Showcases data binding, conditionals, switch-case, and iteration.
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/34-complete-invoice.tsx
 */

import { LayoutEngine, gt, eq } from '@escp/jsx';
import { Stack, Flex, Text, Line, Spacer, Template, If, Switch, Case, For } from '@escp/jsx';
import type { FunctionComponent } from '@escp/jsx';
import type { LayoutNode } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

// Item row component for the For iteration
const ItemRow: FunctionComponent = () => (
  <Flex style={{ gap: 10 }}>
    <Template template="{{item.name}}" />
    <Spacer />
    <Stack style={{ width: 80 }}>
      <Template template="{{item.quantity}}" align="right" />
    </Stack>
    <Stack style={{ width: 120 }}>
      <Template template={'{{item.unitPrice | currency:"$"}}'} align="right" />
    </Stack>
    <Stack style={{ width: 120 }}>
      <Template template={'{{item.total | currency:"$"}}'} align="right" />
    </Stack>
  </Flex>
);

async function main() {
  printSection('Complete Invoice Demo (JSX)');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  engine.initialize();
  await engine.initYoga();

  engine.setData({
    invoice: {
      number: 'INV-2024-001234',
      date: '2024-12-15',
      dueDate: '2025-01-14',
      status: 'pending',
    },
    customer: {
      name: 'Jane Smith',
      company: 'Tech Innovations LLC',
      membership: 'gold',
      street: '456 Innovation Drive',
      cityStateZip: 'San Francisco, CA 94105',
    },
    shipping: {
      name: 'Tech Innovations Warehouse',
      street: '789 Warehouse Blvd',
      cityStateZip: 'Oakland, CA 94607',
    },
    items: [
      { name: 'Wireless Mouse Pro', quantity: 10, unitPrice: 39.99, total: 399.9 },
      { name: 'Mechanical Keyboard', quantity: 5, unitPrice: 89.99, total: 449.95 },
      { name: 'USB-C Hub (7-port)', quantity: 10, unitPrice: 49.99, total: 499.9 },
      { name: 'Monitor Stand 27"', quantity: 5, unitPrice: 79.99, total: 399.95 },
      { name: 'Webcam HD 1080p', quantity: 10, unitPrice: 59.99, total: 599.9 },
    ],
    totals: {
      subtotal: 2349.6,
      discount: { applied: true, percent: 10, amount: 234.96 },
      shipping: { method: 'express', cost: 25.0 },
      tax: { rate: 8.25, amount: 174.46 },
      grandTotal: 2314.1,
    },
    payment: { method: 'net_30' },
  });

  const invoice = (
    <Stack style={{ padding: 20 }}>
      {/* === HEADER === */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">
        ACME CORPORATION
      </Text>
      <Text align="center">123 Business Ave, Commerce City, CA 90210 | (800) 555-ACME</Text>
      <Line char="=" length="fill" />

      {/* === INVOICE INFO LINE === */}
      <Flex>
        <Template template="INVOICE #{{invoice.number}}" style={{ bold: true }} />
        <Spacer />
        <Switch
          path="customer.membership"
          default={(<Spacer style={{ height: 0 }} />) as LayoutNode}
        >
          <Case value="gold">
            <Text style={{ bold: true }}>** GOLD MEMBER **</Text>
          </Case>
          <Case value="platinum">
            <Text style={{ bold: true }}>*** PLATINUM VIP ***</Text>
          </Case>
        </Switch>
      </Flex>
      <Template template="Date: {{invoice.date}} | Due: {{invoice.dueDate}}" />
      <Spacer style={{ height: 10 }} />

      {/* === ADDRESSES - Using parallel lines === */}
      <Flex>
        <Text style={{ bold: true, underline: true }}>BILL TO:</Text>
        <Spacer style={{ width: 200 }} />
        <Text style={{ bold: true, underline: true }}>SHIP TO:</Text>
        <Spacer />
      </Flex>
      <Flex>
        <Template template="{{customer.name}}" style={{ bold: true }} />
        <Spacer style={{ width: 200 }} />
        <Template template="{{shipping.name}}" style={{ bold: true }} />
        <Spacer />
      </Flex>
      <Flex>
        <Template template={'{{customer.company | default:""}}'} />
        <Spacer style={{ width: 200 }} />
        <Template template="{{shipping.street}}" />
        <Spacer />
      </Flex>
      <Flex>
        <Template template="{{customer.street}}" />
        <Spacer style={{ width: 200 }} />
        <Template template="{{shipping.cityStateZip}}" />
        <Spacer />
      </Flex>
      <Template template="{{customer.cityStateZip}}" />
      <Spacer style={{ height: 10 }} />

      {/* === LINE ITEMS TABLE === */}
      <Line char="-" length="fill" />
      <Flex style={{ gap: 10 }}>
        <Text style={{ bold: true }}>Item</Text>
        <Spacer />
        <Stack style={{ width: 80 }}>
          <Text style={{ bold: true }} align="right">
            Qty
          </Text>
        </Stack>
        <Stack style={{ width: 120 }}>
          <Text style={{ bold: true }} align="right">
            Price
          </Text>
        </Stack>
        <Stack style={{ width: 120 }}>
          <Text style={{ bold: true }} align="right">
            Total
          </Text>
        </Stack>
      </Flex>
      <Line char="-" length="fill" />
      <For items="items" as="item">
        <ItemRow />
      </For>
      <Line char="-" length="fill" />

      {/* === TOTALS === */}
      <Flex>
        <Spacer />
        <Text>Subtotal:</Text>
        <Stack style={{ width: 120 }}>
          <Template template={'{{totals.subtotal | currency:"$"}}'} align="right" />
        </Stack>
      </Flex>

      {/* Discount - conditional */}
      <If
        condition={eq('totals.discount.applied', true)}
        else={(<Spacer style={{ height: 0 }} />) as LayoutNode}
      >
        <Flex>
          <Spacer />
          <Template template="Discount ({{totals.discount.percent}}%):" style={{ italic: true }} />
          <Stack style={{ width: 120 }}>
            <Template
              template={'-{{totals.discount.amount | currency:"$"}}'}
              style={{ italic: true }}
              align="right"
            />
          </Stack>
        </Flex>
      </If>

      {/* Shipping */}
      <Flex>
        <Spacer />
        <Switch path="totals.shipping.method" default={(<Text>Shipping:</Text>) as LayoutNode}>
          <Case value="express">
            <Text>Express Shipping:</Text>
          </Case>
          <Case value="free">
            <Text>Shipping:</Text>
          </Case>
        </Switch>
        <If
          condition={gt('totals.shipping.cost', 0)}
          else={
            (
              <Stack style={{ width: 120 }}>
                <Text style={{ bold: true }} align="right">
                  FREE
                </Text>
              </Stack>
            ) as LayoutNode
          }
        >
          <Stack style={{ width: 120 }}>
            <Template template={'{{totals.shipping.cost | currency:"$"}}'} align="right" />
          </Stack>
        </If>
      </Flex>

      {/* Tax */}
      <Flex>
        <Spacer />
        <Template template="Tax ({{totals.tax.rate}}%):" />
        <Stack style={{ width: 120 }}>
          <Template template={'{{totals.tax.amount | currency:"$"}}'} align="right" />
        </Stack>
      </Flex>

      {/* Total line */}
      <Flex>
        <Spacer />
        <Line char="-" length={200} />
      </Flex>
      <Flex>
        <Spacer />
        <Text style={{ bold: true }}>TOTAL DUE:</Text>
        <Stack style={{ width: 120 }}>
          <Template
            template={'{{totals.grandTotal | currency:"$"}}'}
            style={{ bold: true }}
            align="right"
          />
        </Stack>
      </Flex>

      {/* === FOOTER === */}
      <Spacer style={{ height: 10 }} />
      <Line char="-" length="fill" />
      <Flex>
        <Text style={{ bold: true }}>Payment: </Text>
        <Switch path="payment.method" default={(<Text>Other</Text>) as LayoutNode}>
          <Case value="net_30">
            <Text>Net 30 Terms</Text>
          </Case>
          <Case value="credit_card">
            <Template template="Card ****{{payment.lastFour}}" />
          </Case>
        </Switch>
        <Spacer />
        <Text style={{ bold: true }}>Status: </Text>
        <Switch path="invoice.status" default={(<Text>-</Text>) as LayoutNode}>
          <Case value="paid">
            <Text style={{ bold: true }}>PAID</Text>
          </Case>
          <Case value="pending">
            <Text>PENDING</Text>
          </Case>
        </Switch>
      </Flex>
      <Text style={{ italic: true }}>Thank you for your business!</Text>
      <Line char="=" length="fill" />
      <Text align="center">www.acme.example.com</Text>
    </Stack>
  ) as LayoutNode;

  engine.render(invoice);
  await renderPreview(engine.getOutput(), 'Complete Invoice (JSX)', '34-complete-invoice-jsx');
}

main().catch(console.error);
