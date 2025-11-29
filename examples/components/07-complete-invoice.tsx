/**
 * Complete Invoice Example
 *
 * Professional, data-driven invoice using full page width.
 * Demonstrates all component categories working together.
 */

import { LayoutEngine } from "../../src";
import type { FunctionComponent } from "../../src/jsx";
import {
  Stack,
  Flex,
  Layout,
  Spacer,
  Text,
  Line,
  Template,
  If,
  Switch,
  Case,
} from "../../src/jsx";
import {
  Table,
  Card,
  Badge,
  List,
  Heading,
  Label,
  Caption,
  Divider,
  Panel,
} from "../../src/jsx/components";
import { renderPreview, DEFAULT_PAPER, printSection } from "../_helpers";


// Reusable Components
interface CompanyHeaderProps {
  companyName: string;
  tagline: string;
}

const CompanyHeader: FunctionComponent<CompanyHeaderProps> = ({
  companyName,
  tagline,
}) =>
  Stack({
    style: { gap: 5 },
    children: [
      Heading({ level: 1, align: "center", children: companyName }),
      Caption({ align: "center", children: tagline }),
    ],
  });

interface AddressBlockProps {
  title: string;
  dataPath: string;
}

const AddressBlock: FunctionComponent<AddressBlockProps> = ({
  title,
  dataPath,
}) =>
  Card({
    title,
    children: Stack({
      style: { gap: 3 },
      children: [
        Template({ template: `{{${dataPath}.name}}`, style: { bold: true } }),
        Template({ template: `{{${dataPath}.address}}` }),
        Template({
          template: `{{${dataPath}.city}}, {{${dataPath}.state}} {{${dataPath}.zip}}`,
        }),
        Template({ template: `{{${dataPath}.country}}` }),
      ],
    }),
  });

interface OrderStatusBadgeProps {
  statusPath: string;
}

const OrderStatusBadge: FunctionComponent<OrderStatusBadgeProps> = ({
  statusPath,
}) =>
  Switch({
    path: statusPath,
    default: Badge({ variant: "default", children: "UNKNOWN" }),
    children: [
      Case({
        value: "paid",
        children: Badge({ variant: "success", children: "PAID" }),
      }),
      Case({
        value: "pending",
        children: Badge({ variant: "warning", children: "PENDING" }),
      }),
      Case({
        value: "overdue",
        children: Badge({ variant: "error", children: "OVERDUE" }),
      }),
    ],
  });

async function main() {
  printSection("Complete Invoice Example");

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  // Set invoice data
  engine.setData({
    invoice: {
      number: "INV-2024-0042",
      date: "2024-12-15",
      dueDate: "2024-12-30",
      status: "paid",
      paymentMethod: "Credit Card",
      paidDate: "2024-12-18",
    },
    company: {
      name: "ACME Corporation",
      tagline: "Quality Products Since 1985",
      address: "123 Business Park",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
      phone: "+1 (555) 123-4567",
      email: "billing@acme.com",
    },
    customer: {
      name: "John Smith",
      address: "456 Customer Lane",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country: "USA",
      email: "john.smith@email.com",
      isPremium: true,
      memberSince: "2022",
    },
    items: [
      { sku: "PROD-001", description: "Premium Widget", qty: 5, unitPrice: 49.99, lineTotal: 249.95 },
      { sku: "PROD-002", description: "Standard Gadget", qty: 10, unitPrice: 24.99, lineTotal: 249.90 },
      { sku: "PROD-003", description: "Deluxe Accessory", qty: 2, unitPrice: 89.99, lineTotal: 179.98 },
      { sku: "SVC-001", description: "Installation Service", qty: 1, unitPrice: 150.0, lineTotal: 150.00 },
    ],
    subtotal: 679.83,
    discount: 67.98,
    discountPercent: 10,
    taxRate: 8.5,
    taxAmount: 52.01,
    shippingMethod: "Express",
    shippingCost: 25.0,
    total: 688.86,
    notes: [
      "Thank you for your business!",
      "Premium members receive 10% discount.",
      "Free shipping on orders over $500.",
    ],
    terms: [
      "Payment due within 15 days.",
      "Late payments: 1.5% monthly interest.",
      "Refunds within 30 days only.",
    ],
  });

  const invoice = Layout({
    style: { padding: 20 },
    children: [
      // Header
      CompanyHeader({
        companyName: "ACME Corporation",
        tagline: "Quality Products Since 1985",
      }),
      Divider({ variant: "double", spacing: 10 }),

      // Invoice title and status
      Flex({
        children: [
          Heading({ level: 2, children: "INVOICE" }),
          Spacer({ flex: true }),
          Stack({
            children: [
              Flex({
                children: [
                  Text({ children: "Invoice #: " }),
                  Template({ template: "{{invoice.number}}", style: { bold: true } }),
                ],
              }),
            ],
          }),
          Spacer({ style: { width: 100 } }),
          OrderStatusBadge({ statusPath: "invoice.status" }),
        ],
      }),

      Spacer({ style: { height: 15 } }),

      // Invoice Details Panel
      Panel({
        title: "Invoice Details",
        children: Flex({
          style: { gap: 100 },
          children: [
            Stack({
              style: { gap: 3 },
              children: [
                Label({
                  label: "Date",
                  labelWidth: 180,
                  children: Template({ template: "{{invoice.date}}" }),
                }),
                Label({
                  label: "Due",
                  labelWidth: 180,
                  children: Template({ template: "{{invoice.dueDate}}" }),
                }),
              ],
            }),
            If({
              condition: { path: "invoice.status", operator: "eq", value: "paid" },
              children: Stack({
                style: { gap: 3 },
                children: [
                  Label({
                    label: "Paid",
                    labelWidth: 180,
                    children: Template({ template: "{{invoice.paidDate}}" }),
                  }),
                  Label({
                    label: "Method",
                    labelWidth: 260,
                    children: Template({ template: "{{invoice.paymentMethod}}" }),
                  }),
                ],
              }),
            }),
          ],
        }),
      }),

      Spacer({ style: { height: 15 } }),

      // Addresses (2 columns)
      Flex({
        style: { gap: 80 },
        children: [
          Stack({
            style: { width: '48%' },
            children: [AddressBlock({ title: "From", dataPath: "company" })],
          }),
          Stack({
            style: { width: '48%' },
            children: [
              AddressBlock({ title: "Bill To", dataPath: "customer" }),
              If({
                condition: { path: "customer.isPremium", operator: "eq", value: true },
                children: Flex({
                  style: { margin: { top: 5 } },
                  children: [
                    Text({ children: "Member since " }),
                    Template({ template: "{{customer.memberSince}}" }),
                    Spacer({ flex: true }),
                    Badge({ variant: "success", children: "PREMIUM" }),
                  ],
                }),
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 10 } }),

      // Line Items Table
      Text({ style: { bold: true }, children: "Order Items" }),
      Table({
        columns: [
          { header: "SKU", key: "sku", width: 300 },
          { header: "Description", key: "description", width: 700 },
          { header: "Qty", key: "qty", width: 150, align: "right" },
          { header: "Unit Price", key: "unitPrice", width: 400, align: "right" },
          { header: "Total", key: "lineTotal", width: 400, align: "right" },
        ],
        items: "items",
      }),

      Spacer({ style: { height: 15 } }),

      // Totals (right-aligned)
      Flex({
        children: [
          Spacer({ flex: true }),
          Stack({
            style: { width: 800 },
            children: [
              Divider({ variant: "single", spacing: 5 }),
              Flex({
                children: [
                  Text({ children: "Subtotal:" }),
                  Spacer({ flex: true }),
                  Template({ template: "${{subtotal}}" }),
                ],
              }),
              If({
                condition: { path: "discount", operator: "gt", value: 0 },
                children: Flex({
                  style: { italic: true },
                  children: [
                    Template({ template: "Discount ({{discountPercent}}%):" }),
                    Spacer({ flex: true }),
                    Template({ template: "-${{discount}}" }),
                  ],
                }),
              }),
              Flex({
                children: [
                  Template({ template: "Tax ({{taxRate}}%):" }),
                  Spacer({ flex: true }),
                  Template({ template: "${{taxAmount}}" }),
                ],
              }),
              Flex({
                children: [
                  Template({ template: "Shipping ({{shippingMethod}}):" }),
                  Spacer({ flex: true }),
                  Template({ template: "${{shippingCost}}" }),
                ],
              }),
              Divider({ variant: "double", spacing: 5 }),
              Flex({
                style: { bold: true },
                children: [
                  Text({ style: { doubleWidth: true }, children: "TOTAL:" }),
                  Spacer({ flex: true }),
                  Template({
                    template: "${{total}}",
                    style: { doubleWidth: true, bold: true },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: "=", length: "fill" }),
      Spacer({ style: { height: 10 } }),

      // Notes & Terms (2 columns)
      Flex({
        style: { gap: 80 },
        children: [
          Stack({
            style: { width: '48%' },
            children: [
              Panel({
                title: "Notes",
                children: List({
                  variant: "bullet",
                  bullet: "*",
                  items: "notes",
                }),
              }),
            ],
          }),
          Stack({
            style: { width: '48%' },
            children: [
              Panel({
                title: "Terms & Conditions",
                children: List({
                  variant: "numbered",
                  items: "terms",
                }),
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 15 } }),
      Divider({ variant: "single", spacing: 10 }),

      // Footer
      Stack({
        style: { gap: 3 },
        children: [
          Text({ align: "center", children: "Thank you for your business!" }),
          Caption({
            align: "center",
            children: "Contact: billing@acme.com | +1 (555) 123-4567",
          }),
          Caption({
            align: "center",
            children: "Generated by escp-ts Invoice System",
          }),
        ],
      }),
    ],
  });

  engine.render(invoice);
  const output = engine.getOutput();
  await renderPreview(output, "Complete Invoice", "components-07-complete-invoice");
}

main().catch(console.error);
